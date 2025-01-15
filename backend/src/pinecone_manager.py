from langchain_community.vectorstores import Pinecone
from langchain_openai import OpenAIEmbeddings
from langchain_community.document_loaders import TextLoader, PyPDFLoader, CSVLoader
from pathlib import Path
from pinecone import Pinecone as PineconeClient
import os
import logging

logger = logging.getLogger(__name__)

class PineconeDocumentManager:
    def __init__(self, docs_dir: str):
        self.docs_dir = Path(docs_dir)
        self.embeddings = OpenAIEmbeddings()
        
        # Initialize Pinecone
        api_key = os.getenv("PINECONE_API_KEY")
        if not api_key:
            raise ValueError("PINECONE_API_KEY environment variable not set")
            
        self.client = PineconeClient(api_key=api_key)
        self.index_name = "document-store"
        
        # Ensure index exists
        if self.index_name not in [index.name for index in self.client.list_indexes()]:
            logger.info(f"Creating new index: {self.index_name}")
            self.client.create_index(
                name=self.index_name,
                dimension=1536,  # OpenAI embedding dimension
                metric='cosine'
            )
            
        # Initialize vectorstore
        self.vectorstore = Pinecone.from_existing_index(
            index_name=self.index_name,
            embedding=self.embeddings,
            namespace="default"
        )
        logger.info("Pinecone vectorstore initialized successfully")

    def process_document(self, file_path: str):
        """Process a single document"""
        try:
            logger.info(f"Processing document: {file_path}")
            
            # Load document based on file type
            if file_path.endswith('.pdf'):
                loader = PyPDFLoader(file_path)
            elif file_path.endswith('.csv'):
                loader = CSVLoader(file_path)
            else:
                loader = TextLoader(file_path)
                
            documents = loader.load()
            
            if documents:
                # Add documents to vectorstore
                self.vectorstore.add_documents(documents)
                logger.info(f"Added {len(documents)} chunks to vectorstore")
                return self.vectorstore
            else:
                logger.warning(f"No content extracted from {file_path}")
                return self.vectorstore
                
        except Exception as e:
            logger.error(f"Error processing document {file_path}: {e}")
            raise

    def get_vectorstore(self):
        """Return the initialized vectorstore"""
        return self.vectorstore

    def process_documents(self, directory: str = None):
        """Process all documents in the specified directory"""
        if directory is None:
            directory = self.docs_dir
            
        # Get all supported files in directory
        supported_extensions = ['.pdf', '.csv', '.txt']
        documents = []
        for ext in supported_extensions:
            documents.extend(list(Path(directory).glob(f'*{ext}')))
            
        if not documents:
            logger.warning(f"No supported documents found in {directory}")
            return self.vectorstore
            
        # Process each document
        for doc_path in documents:
            try:
                self.process_document(str(doc_path))
            except Exception as e:
                logger.error(f"Error processing {doc_path}: {e}")
                continue
                
        logger.info(f"Processed {len(documents)} documents from {directory}")
        return self.vectorstore

    def verify_documents_in_vectorstore(self):
        """Verify which documents are present in the vectorstore"""
        try:
            # Get index statistics using the correct Pinecone client method
            index_stats = self.client.Index(self.index_name).describe_index_stats()
            
            return {
                "index_status": "ready",
                "total_vector_count": index_stats.get("total_vector_count", 0),
                "namespaces": index_stats.get("namespaces", {})
            }
        except Exception as e:
            logger.error(f"Error verifying documents in vectorstore: {e}")
            return {
                "error": str(e),
                "index_status": "unknown",
                "total_vector_count": 0,
                "namespaces": {}
            }

    def process_specific_documents(self, document_paths: list):
        """Process specific documents from a list of paths"""
        if not document_paths:
            logger.warning("No document paths provided")
            return self.vectorstore
            
        processed_count = 0
        for doc_path in document_paths:
            try:
                if not Path(doc_path).exists():
                    logger.warning(f"Document not found: {doc_path}")
                    continue
                    
                self.process_document(doc_path)
                processed_count += 1
            except Exception as e:
                logger.error(f"Error processing {doc_path}: {e}")
                continue
                
        logger.info(f"Processed {processed_count}/{len(document_paths)} documents")
        return self.vectorstore

    def get_document_stats(self):
        """Get comprehensive document statistics"""
        try:
            # Get local documents
            local_docs = [f.name for f in self.docs_dir.glob('*') 
                         if f.suffix.lower() in ['.pdf', '.txt', '.csv']]
            
            # Get Pinecone stats
            index = self.client.Index(self.index_name)
            stats = index.describe_index_stats()
            
            logger.info(f"Local documents: {local_docs}")
            logger.info(f"Pinecone stats: {stats}")
            
            return {
                "local_documents": local_docs,
                "vector_count": stats.get("total_vector_count", 0),
                "namespaces": stats.get("namespaces", {}),
                "is_indexed": len(local_docs) > 0 and stats.get("total_vector_count", 0) > 0
            }
        except Exception as e:
            logger.error(f"Error getting document stats: {e}")
            raise
