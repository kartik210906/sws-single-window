import os
import shutil
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Dummy regulatory policy documents for SWS India compliance
DUMMY_REGULATORY_DOCUMENTS = [
    Document(
        page_content="""
        MPCB (Maharashtra Pollution Control Board) Chemical Industry Regulation, Section 4A:
        Any new chemical manufacturing, processing, or storage facility being established in Maharashtra, 
        specifically within district zones like Pune, Mumbai, or Nagpur, must apply for a 'Consent to Establish' (CTE) 
        before starting civil construction. This requires submission of an Environmental Impact Assessment (EIA), 
        details of effluent treatment plant (ETP) capacity, and hazardous waste disposal pipeline layout. 
        Additionally, a 'Consent to Operate' (CTO) must be secured 15 days before production commencement.
        """,
        metadata={"category": "Environmental", "state": "Maharashtra", "authority": "MPCB"}
    ),
    Document(
        page_content="""
        Pune Municipal Corporation (PMC) Water Clearance Rule 102:
        Industrial zones in Pune (including Chakan, Hinjewadi, and Bhosari MIDC) require a municipal water allocation certificate 
        from the PMC Water Supply Department. For chemical manufacturing, the applicant must provide a daily water consumption blueprint 
        detailing recycling capacity. Processing facilities that discharge heavy water or chemical waste are strictly prohibited 
        from using standard groundwater pipelines without a dedicated sewage treatment plant (STP) clearance certificate.
        """,
        metadata={"category": "Water", "state": "Maharashtra", "authority": "PMC"}
    ),
    Document(
        page_content="""
        National Fire Safety NOC guidelines for Hazardous Facilities:
        For chemical factories, explosives storage, or paint processing plants, a provisional Fire NOC (No Objection Certificate) 
        is mandatory. The plant design must include automatic sprinkler systems, fire doors with a 2-hour rating, a static water storage tank 
        of minimum 100,000 liters dedicated to fire hydrants, and a minimum 12-meter wide driveway surrounding the main manufacturing zone 
        to facilitate fire tender movement. Final NOC is issued post-physical inspections by state fire services.
        """,
        metadata={"category": "Fire Safety", "state": "All-India", "authority": "State Fire Services"}
    ),
    Document(
        page_content="""
        Ministry of Labour Factory License Rules (1948 Amendment):
        Any industrial unit employing more than 10 workers (with power) or 20 workers (without power) must register for a 
        Factory License under the state Department of Industrial Safety and Health (DISH). Applications require building plan approval, 
        stability certificate signed by an authorized structural engineer, and detailed ventilation, exit routing, and first-aid plan details.
        """,
        metadata={"category": "Labour & Safety", "state": "All-India", "authority": "DISH"}
    ),
    Document(
        page_content="""
        Hinjewadi IT Park Special Economic Zone (SEZ) Rules:
        IT and Software units setting up operations in Hinjewadi Phase 1, 2, or 3 are exempt from typical environmental clearances. 
        However, they must register under the Shops and Establishment Act within 30 days of starting operations, secure a dedicated 
        commercial electricity grid connection from MSEDCL, and obtain standard waste disposal contracts for e-waste recycling.
        """,
        metadata={"category": "IT & Telecom", "state": "Maharashtra", "authority": "MSEDCL"}
    )
]

def run_ingestion():
    # Define vector database local path
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    persist_directory = os.path.join(os.path.dirname(base_dir), "chroma_db")

    print(f"Initializing Vector DB ingestion...")
    print(f"Persist Directory: {persist_directory}")

    # Wipe existing database directory to avoid duplication
    if os.path.exists(persist_directory):
        print("Cleaning up old database files...")
        shutil.rmtree(persist_directory)

    # Initialize the local HuggingFace embeddings model (runs on CPU)
    # This downloads the MiniLM model (approx. 80MB) locally on first run
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    # Split documents into optimal chunks for retrieval
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    split_docs = text_splitter.split_documents(DUMMY_REGULATORY_DOCUMENTS)

    print(f"Split {len(DUMMY_REGULATORY_DOCUMENTS)} documents into {len(split_docs)} chunks.")

    # Initialize Chroma and save embeddings
    vector_db = Chroma.from_documents(
        documents=split_docs,
        embedding=embeddings,
        persist_directory=persist_directory
    )

    print("Successfully ingested documents into ChromaDB.")

if __name__ == "__main__":
    run_ingestion()
