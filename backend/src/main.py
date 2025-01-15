import os
from dotenv import load_dotenv
from document_processor import DocumentProcessor
from rag_system import RAGQuerySystem

def main():
    load_dotenv()
    
    # Set documents directory relative to project root
    current_dir = os.path.dirname(os.path.dirname(__file__))
    docs_dir = os.path.join(current_dir, "data", "documents")
    
    # Create documents directory if it doesn't exist
    os.makedirs(docs_dir, exist_ok=True)
    
    processor = DocumentProcessor(docs_dir)
    vectorstore = processor.process_documents()
    rag_system = RAGQuerySystem(vectorstore)
    
    # Interactive query loop
    while True:
        question = input("\nEnter your question (or 'quit' to exit): ")
        if question.lower() == 'quit':
            break
            
        response = rag_system.query(question)
        print("\nAnswer:", response["answer"])
        print("\nSources:")
        for source in response["sources"]:
            print(f"- {source.get('source', 'Unknown source')}")

if __name__ == "__main__":
    main()