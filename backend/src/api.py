from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import JSONResponse
import shutil
import os
from pathlib import Path
from pinecone_manager import PineconeDocumentManager
from rag_system import RAGQuerySystem
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from starlette.background import BackgroundTask
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Load environment variables at startup
load_dotenv()
print(f"API Key present: {'OPENAI_API_KEY' in os.environ}")

# Initialize global variables
DOCS_DIR = Path(__file__).parent.parent / "data" / "documents"

# Verify the directory exists at startup
if not DOCS_DIR.exists():
    raise RuntimeError(f"Documents directory not found at {DOCS_DIR}")

print(f"Using documents directory: {DOCS_DIR}")

vectorstore = None
rag_system = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def initialize_rag():
    global vectorstore, rag_system
    try:
        processor = PineconeDocumentManager(str(DOCS_DIR))
        vectorstore = processor.process_documents()
        rag_system = RAGQuerySystem(vectorstore)
        return True
    except Exception as e:
        print(f"Error initializing RAG: {str(e)}")
        return False

@app.on_event("startup")
async def startup_event():
    """Initialize RAG system on startup if documents exist"""
    if list(DOCS_DIR.glob("*")):  # Check if documents exist
        initialize_rag()

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Save file
        file_path = DOCS_DIR / file.filename
        with file_path.open("wb") as buffer:
            content = await file.read()
            buffer.write(content)
            
        # Initialize document manager and process file
        manager = PineconeDocumentManager(str(DOCS_DIR))
        vectorstore = manager.process_document(str(file_path))
        
        # Initialize RAG system with the vectorstore
        global rag_system
        rag_system = RAGQuerySystem(vectorstore)
        
        return JSONResponse(content={
            "message": f"Successfully uploaded and processed {file.filename}",
            "status": "success"
        })
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        if file_path.exists():
            file_path.unlink()
        return JSONResponse(
            content={"message": f"Failed to upload file: {str(e)}", "status": "error"},
            status_code=500
        )

class QueryRequest(BaseModel):
    question: str
    documents: List[str] = None
    mode: str = "rag"  # Can be "rag" or "llm"

@app.post("/query")
async def query(request: Request, query_request: QueryRequest):
    try:
        # Initialize LLM for general queries
        llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.7)
        
        # Handle LLM-only mode
        if query_request.mode == "llm" or not query_request.documents:
            response = await llm.ainvoke(query_request.question)
            return JSONResponse(
                content={
                    "data": {
                        "answer": response.content,
                        "sources": [],
                        "status": "success"
                    }
                }
            )
        
        processor = PineconeDocumentManager(str(DOCS_DIR))
        try:
            vectorstore = processor.process_specific_documents(query_request.documents)
            if not vectorstore:
                return JSONResponse(
                    content={"message": "Failed to create vectorstore", "status": "error"},
                    status_code=500
                )
            
            global rag_system
            rag_system = RAGQuerySystem(vectorstore)
            response = await rag_system.query(query_request.question)
            
            logger.info(f"Query response: {response}")
            
            if response.get("status") == "error":
                return JSONResponse(
                    content={
                        "message": response.get("answer", "Query failed"),
                        "error": response.get("error", "Unknown error"),
                        "status": "error"
                    },
                    status_code=500
                )
            
            return JSONResponse(
                content={
                    "data": {
                        "answer": response["answer"],
                        "sources": response["sources"],
                        "status": "success"
                    }
                }
            )
        except Exception as e:
            print(f"Processing error: {str(e)}")
            return JSONResponse(
                content={"message": f"Document processing failed: {str(e)}", "status": "error"},
                status_code=500
            )
    except Exception as e:
        print(f"Query error: {str(e)}")
        return JSONResponse(
            content={"message": f"Query failed: {str(e)}", "status": "error"},
            status_code=500
        )

@app.get("/")
async def root():
    return {"message": "Welcome to the Document Query API"}

@app.get("/documents")
async def list_documents():
    try:
        # Initialize PineconeDocumentManager
        manager = PineconeDocumentManager(str(DOCS_DIR))
        
        # Get local documents
        local_documents = [f.name for f in DOCS_DIR.glob("*") if f.is_file()]
        
        # Get Pinecone stats
        vectorstore = manager.get_vectorstore()
        index = manager.client.Index(manager.index_name)
        stats = index.describe_index_stats()
        
        logger.info(f"Found {len(local_documents)} local documents")
        logger.info(f"Pinecone stats: {stats}")
        
        return {
            "data": {
                "documents": local_documents,
                "count": len(local_documents),
                "vector_count": stats.get("total_vector_count", 0),
                "status": "success"
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to list documents: {str(e)}")
        return JSONResponse(
            content={
                "message": f"Failed to list documents: {str(e)}", 
                "status": "error"
            },
            status_code=500
        )

if __name__ == "__main__":
    import uvicorn
    
    def run_server(port: int, max_retries: int = 3) -> None:
        for retry in range(max_retries):
            try:
                uvicorn.run(app, host="0.0.0.0", port=port + retry)
                break
            except OSError as e:
                if retry == max_retries - 1:
                    raise e
                print(f"Port {port + retry} is in use, trying next port...")

    run_server(8000)
