import os
import json
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.utils.file_utils import validate_and_save_temp_file
from app.services.ocr_service import ocr_service
from app.services.validation_service import ValidationService
from app.services.rag_service import rag_service

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0"
)

# Apply CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def delete_local_file(path: str):
    """Safely removes temporary files from host storage."""
    if os.path.exists(path):
        try:
            os.remove(path)
        except Exception:
            pass

@app.get("/health")
def read_health():
    return {"status": "UP", "app": settings.APP_NAME}

@app.post("/api/validate-document")
async def validate_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    required_keywords: str = Form(...),  # Stringified JSON array, e.g. '["Signature", "Blueprint"]'
    applicant_name: str | None = Form(None)
):
    # 1. Decode required keywords
    try:
        keywords = json.loads(required_keywords)
        if not isinstance(keywords, list):
            raise ValueError()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="required_keywords parameter must be a JSON array of strings."
        )

    # 2. Write uploaded file to temporary directory
    temp_path = validate_and_save_temp_file(file)
    
    # Queue background file destruction task after sending response
    background_tasks.add_task(delete_local_file, temp_path)

    try:
        # 3. Read text using OCR engine
        extracted_text = ocr_service.extract_text(temp_path)
        
        # 4. Compare text fuzzy attributes
        validation_report = ValidationService.verify_document(
            extracted_text=extracted_text,
            required_keywords=keywords,
            applicant_name=applicant_name
        )
        
        # Append short preview for UI convenience
        validation_report["extracted_text_preview"] = extracted_text[:800]
        return validation_report

    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail=f"Document OCR validation logic failed: {str(err)}"
        )

@app.post("/api/rag/query")
async def query_rag(payload: dict):
    """
    RAG Query Endpoint. Takes user question, retrieves context from Chroma,
    and returns an LLM-generated compliance list.
    """
    user_query = payload.get("query")
    if not user_query:
        raise HTTPException(
            status_code=400,
            detail="Payload parameter 'query' is required."
        )
        
    try:
        result = rag_service.query(user_query)
        return result
    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail=f"RAG query execution failed: {str(err)}"
        )
