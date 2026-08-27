import os
import tempfile
from fastapi import UploadFile, HTTPException

ALLOWED_MIME_TYPES = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png"
}

def validate_and_save_temp_file(file: UploadFile) -> str:
    """
    Validates file MIME type and streams it to a temporary file on local disk.
    Returns the absolute path to the temporary file.
    """
    content_type = file.content_type
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: {content_type}. Only PDF, JPEG, and PNG are allowed."
        )
    
    suffix = ALLOWED_MIME_TYPES[content_type]
    
    try:
        temp_dir = tempfile.gettempdir()
        # Create a unique file name using cryptographically secure random bytes
        unique_name = f"sws_doc_{os.urandom(8).hex()}{suffix}"
        temp_file_path = os.path.join(temp_dir, unique_name)
        
        # Write file in chunks to prevent memory overflows on large documents
        with open(temp_file_path, "wb") as buffer:
            while chunk := file.file.read(8192):
                buffer.write(chunk)
                
        return temp_file_path
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to write file to temporary directory: {str(e)}"
        )
