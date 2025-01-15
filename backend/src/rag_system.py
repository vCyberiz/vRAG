from langchain_core.memory import BaseMemory
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain_core.vectorstores import VectorStore
from langchain_core.retrievers import BaseRetriever
from pydantic import Field
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class CustomConversationMemory(BaseMemory):
    """Efficient implementation of conversation memory"""
    
    messages: List[BaseMessage] = Field(default_factory=list)
    return_messages: bool = Field(default=True)
    output_key: str = Field(default="answer")
    
    @property
    def memory_variables(self) -> List[str]:
        """Define memory variables."""
        return ["chat_history"]
        
    def load_memory_variables(self, _: Dict[str, Any]) -> Dict[str, Any]:
        """Load memory variables."""
        return {"chat_history": self.messages}
        
    async def aload_memory_variables(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Load memory variables asynchronously."""
        return self.load_memory_variables(inputs)
        
    def save_context(self, inputs: Dict[str, Any], outputs: Dict[str, str]) -> None:
        """Save context from this conversation to memory."""
        if "question" in inputs:
            self.messages.append(HumanMessage(content=inputs["question"]))
            if self.output_key in outputs:
                self.messages.append(AIMessage(content=outputs[self.output_key]))
            
    def clear(self) -> None:
        """Clear memory contents."""
        self.messages = []

class RAGQuerySystem:
    def __init__(self, vectorstore: Any):
        """Initialize the RAG system with vectorstore."""
        self.memory = CustomConversationMemory()
        self.llm = ChatOpenAI(temperature=0, model_name="gpt-3.5-turbo")
        
        try:
            # Check if vectorstore has the required method
            if not hasattr(vectorstore, 'as_retriever'):
                raise ValueError("Vectorstore must implement 'as_retriever' method")
                
            self.retriever = vectorstore.as_retriever(
                search_kwargs={"k": 3}
            )
            
            if not isinstance(self.retriever, BaseRetriever):
                raise ValueError("Retrieved object must be an instance of BaseRetriever")
                
            self.chain = ConversationalRetrievalChain.from_llm(
                llm=self.llm,
                retriever=self.retriever,
                memory=self.memory,
                return_source_documents=True,
                verbose=True
            )
        except Exception as e:
            logger.error(f"Error initializing retriever: {str(e)}")
            raise ValueError(f"Failed to initialize retriever: {str(e)}") from e
        
    async def query(self, question: str) -> Dict[str, Any]:
        """Process a question using the RAG system."""
        try:
            response = await self.chain.ainvoke({
                "question": question
            })
            
            sources = [
                {
                    "content": doc.page_content,
                    "metadata": doc.metadata
                } for doc in response.get("source_documents", [])
            ]
            
            return {
                "answer": response["answer"],
                "sources": sources,
                "status": "success"
            }
            
        except Exception as e:
            logger.error(f"Query error: {str(e)}", exc_info=True)
            return {
                "answer": "Sorry, I encountered an error processing your question.",
                "error": str(e),
                "status": "error"
            }