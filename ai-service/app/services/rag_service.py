import os
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.config import settings

class RAGService:
    def __init__(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.persist_directory = os.path.join(os.path.dirname(base_dir), "chroma_db")
        
        # Load local embeddings (MiniLM-L6-v2) - runs on CPU
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        
        # Connect to ChromaDB
        self.vector_store = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings
        )
        self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 3})

    def query(self, user_query: str) -> dict:
        """
        Retrieves relevant compliance texts from Chroma and generates a 
        tailored corporate license checklist using Gemini 1.5.
        """
        # Retrieve context from local vector store
        retrieved_docs = self.retriever.invoke(user_query)
        context = "\n\n".join([doc.page_content for doc in retrieved_docs])
        
        # Compile sources lists to return to UI
        sources = [
            {
                "authority": doc.metadata.get("authority", "Government Registry"),
                "category": doc.metadata.get("category", "General Compliance"),
                "state": doc.metadata.get("state", "All-India")
            }
            for doc in retrieved_docs
        ]

        # Extract Google Gemini Key from system or configuration file
        api_key = os.environ.get("GEMINI_API_KEY") or settings.GEMINI_API_KEY
        
        # Fallback mechanism: If LLM keys are absent, serve structured RAG responses safely
        if not api_key:
            fallback_response = f"""
### ⚠️ Local Database Retrieval Response (Gemini API Key Missing)

We successfully queried the vector store for matching regulations. Here is the verified context extracted:

{context}

*To enable intelligent, generative checklist summaries, please configure the `GEMINI_API_KEY` in your environment variables.*
"""
            return {
                "answer": fallback_response.strip(),
                "sources": sources
            }

        try:
            # Initialize Gemini Chat Model (Low temperature for deterministic checklists)
            llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=api_key,
                temperature=0.1
            )

            # Design prompt template instructing LLM to output clean Markdown checklists
            prompt = ChatPromptTemplate.from_template("""
You are an expert Government Compliance Assistant for the Single Window System (SWS) of India. 
Review the user's business query, match it with the official regulatory context provided, and generate a customized, step-by-step checklist of clearances and licenses they need to obtain.

User Query: {query}

Official Regulatory Context:
{context}

Format your response as a clean, professional Markdown document. Structure it as follows:
1. **Executive Summary**: Brief description of the planned business setup.
2. **Clearance Checklist**: A numbered list of approvals. Each approval must outline:
   - **Approval/License Name** (e.g. MPCB Consent to Establish)
   - **Issuing Department/Authority** (e.g. Maharashtra Pollution Control Board)
   - **Prerequisites & Specific Thresholds** (e.g. ETP setup, safety boundaries)
   - **Legal Enforcement Category** (Mandatory, Conditionally Required, or Exempt)
3. **Drafting Requirements**: Quick list of documentation they should prepare immediately.

Do not use placeholders. If the context does not contain specific information, mention it clearly.
""")

            # Build and invoke chain
            chain = prompt | llm | StrOutputParser()
            answer = chain.invoke({"query": user_query, "context": context})

            return {
                "answer": answer,
                "sources": sources
            }

        except Exception as e:
            return {
                "answer": f"Error occurred during LLM generation: {str(e)}\n\n#### Retrieved Local Database Context:\n{context}",
                "sources": sources
            }

# Singleton RAG instance
rag_service = RAGService()
