from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain_community.document_loaders.pdf import PyPDFLoader
from pathlib import Path
import os

class DocumentProcessor:
    def __init__(self, docs_dir: str):
        self.docs_dir = Path(docs_dir)
        self.embeddings = OpenAIEmbeddings()

    def process_documents(self):
        """Process all documents in the docs directory"""
        try:
            documents = []
            for file_path in self.docs_dir.glob('*'):
                if file_path.suffix.lower() == '.pdf':
                    loader = PyPDFLoader(str(file_path))
                else:
                    loader = TextLoader(str(file_path))
                documents.extend(loader.load())

            if not documents:
                raise ValueError("No documents found in directory")

            vectorstore = FAISS.from_documents(documents, self.embeddings)
            return vectorstore

        except Exception as e:
            print(f"Error processing documents: {str(e)}")
            raise

    def process_specific_documents(self, document_names: list[str]):
        """Process specific documents by name"""
        try:
            documents = []
            for doc_name in document_names:
                file_path = self.docs_dir / doc_name
                if not file_path.exists():
                    print(f"Warning: Document {doc_name} not found at {file_path}")
                    continue

                if file_path.suffix.lower() == '.pdf':
                    loader = PyPDFLoader(str(file_path))
                else:
                    loader = TextLoader(str(file_path))
                
                documents.extend(loader.load())

            if not documents:
                raise ValueError("No valid documents were loaded")

            vectorstore = FAISS.from_documents(documents, self.embeddings)
            return vectorstore

        except Exception as e:
            print(f"Error processing documents: {str(e)}")
            raise