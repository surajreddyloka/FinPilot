import chromadb
from chromadb.config import Settings
import os

class ChromaDBService:
    """
    Manages vector storage and retrieval for Financial Copilot RAG queries.
    Stores historical transaction data, goals, and budgets as embeddings.
    """
    def __init__(self):
        # Store ChromaDB locally in a persistent directory for this example
        db_path = os.path.join(os.getcwd(), "data", "chromadb")
        os.makedirs(db_path, exist_ok=True)
        
        self.client = chromadb.PersistentClient(path=db_path)
        
        # Collection for financial context chunks
        self.collection = self.client.get_or_create_collection(
            name="financial_context",
            metadata={"hnsw:space": "cosine"}
        )

    def add_transaction(self, user_id: str, transaction_id: str, text: str):
        """Indexes a transaction into the vector store."""
        try:
            self.collection.upsert(
                documents=[text],
                metadatas=[{"user_id": user_id, "type": "transaction"}],
                ids=[f"txn_{transaction_id}"]
            )
        except Exception:
            pass

    def search_context(self, user_id: str, query: str, n_results: int = 5) -> list:
        """Retrieves relevant financial context for a given query."""
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results,
                where={"user_id": user_id}
            )
            if results and "documents" in results and results["documents"]:
                return results["documents"][0]
            return []
        except Exception:
            return []

vector_store = ChromaDBService()
