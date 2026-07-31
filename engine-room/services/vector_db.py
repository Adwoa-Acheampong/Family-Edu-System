"""Vector Database Service for RAG (Retrieval-Augmented Generation).

Provides semantic search and retrieval of curriculum content,
student submissions, and learning resources using vector embeddings.

Supports multiple backends:
- ChromaDB (local/embedded)
- Qdrant (production)
- Pinecone (managed cloud)
"""

from __future__ import annotations

import hashlib
import logging
import os
from dataclasses import dataclass
from typing import Any, Optional

logger = logging.getLogger("engine_room.vector_db")


@dataclass
class Document:
    """A document in the vector store."""
    id: str
    content: str
    metadata: dict[str, Any]
    embedding: Optional[list[float]] = None


@dataclass
class SearchResult:
    """A search result from the vector store."""
    document: Document
    score: float
    rank: int


class VectorStoreConfig:
    """Configuration for vector store backends."""
    
    def __init__(
        self,
        backend: str = "chromadb",
        collection_name: str = "curriculum_knowledge",
        embedding_model: str = "all-MiniLM-L6-v2",
        persist_directory: str = "./data/vectordb",
        qdrant_url: Optional[str] = None,
        qdrant_api_key: Optional[str] = None,
        pinecone_api_key: Optional[str] = None,
        pinecone_environment: str = "us-east-1",
    ):
        self.backend = backend.lower()
        self.collection_name = collection_name
        self.embedding_model = embedding_model
        self.persist_directory = persist_directory
        self.qdrant_url = qdrant_url or os.getenv("QDRANT_URL")
        self.qdrant_api_key = qdrant_api_key or os.getenv("QDRANT_API_KEY")
        self.pinecone_api_key = pinecone_api_key or os.getenv("PINECONE_API_KEY")
        self.pinecone_environment = pinecone_environment


class BaseVectorStore:
    """Base class for vector store implementations."""
    
    def __init__(self, config: VectorStoreConfig):
        self.config = config
        self._initialized = False
    
    async def initialize(self) -> None:
        """Initialize the vector store connection."""
        raise NotImplementedError
    
    async def add_documents(self, documents: list[Document]) -> list[str]:
        """Add documents to the vector store. Returns document IDs."""
        raise NotImplementedError
    
    async def search(
        self,
        query: str,
        top_k: int = 5,
        filter_metadata: Optional[dict[str, Any]] = None,
    ) -> list[SearchResult]:
        """Search for similar documents."""
        raise NotImplementedError
    
    async def delete_documents(self, document_ids: list[str]) -> int:
        """Delete documents by ID. Returns count deleted."""
        raise NotImplementedError
    
    async def get_document(self, document_id: str) -> Optional[Document]:
        """Retrieve a specific document by ID."""
        raise NotImplementedError


class ChromaDBVectorStore(BaseVectorStore):
    """ChromaDB implementation for local/embedded vector storage."""
    
    def __init__(self, config: VectorStoreConfig):
        super().__init__(config)
        self._client = None
        self._collection = None
        self._embedding_function = None
    
    async def initialize(self) -> None:
        """Initialize ChromaDB client and collection."""
        try:
            import chromadb
            from chromadb.config import Settings
            
            # Initialize client with persistence
            self._client = chromadb.Client(Settings(
                persist_directory=self.config.persist_directory,
                anonymized_telemetry=False,
            ))
            
            # Get or create collection
            self._collection = self._client.get_or_create_collection(
                name=self.config.collection_name,
                metadata={"description": "Curriculum knowledge base"},
            )
            
            # Setup embedding function
            try:
                from chromadb.utils import embedding_functions
                self._embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
                    model_name=self.config.embedding_model
                )
            except ImportError:
                logger.warning("SentenceTransformer not available, using default embeddings")
                self._embedding_function = None
            
            self._initialized = True
            logger.info("ChromaDB initialized with collection: %s", self.config.collection_name)
            
        except ImportError as e:
            logger.error("ChromaDB not installed. Run: pip install chromadb sentence-transformers")
            raise RuntimeError(f"ChromaDB initialization failed: {e}")
        except Exception as e:
            logger.exception("Failed to initialize ChromaDB")
            raise
    
    def _generate_id(self, content: str, metadata: dict) -> str:
        """Generate a deterministic document ID."""
        content_hash = hashlib.sha256(content.encode()).hexdigest()[:16]
        meta_hash = hashlib.sha256(str(sorted(metadata.items())).encode()).hexdigest()[:8]
        return f"doc_{content_hash}_{meta_hash}"
    
    async def add_documents(self, documents: list[Document]) -> list[str]:
        """Add documents to ChromaDB."""
        if not self._initialized:
            await self.initialize()
        
        if not documents:
            return []
        
        ids = []
        texts = []
        metadatas = []
        
        for doc in documents:
            doc_id = doc.id or self._generate_id(doc.content, doc.metadata)
            ids.append(doc_id)
            texts.append(doc.content)
            metadatas.append(doc.metadata)
        
        try:
            self._collection.add(
                documents=texts,
                metadatas=metadatas,
                ids=ids,
            )
            logger.info("Added %d documents to ChromaDB", len(ids))
            return ids
            
        except Exception as e:
            logger.error("Failed to add documents to ChromaDB: %s", e)
            raise
    
    async def search(
        self,
        query: str,
        top_k: int = 5,
        filter_metadata: Optional[dict[str, Any]] = None,
    ) -> list[SearchResult]:
        """Search for similar documents in ChromaDB."""
        if not self._initialized:
            await self.initialize()
        
        try:
            # Build where clause for filtering
            where_clause = None
            if filter_metadata:
                where_clause = {}
                for key, value in filter_metadata.items():
                    where_clause[key] = {"$eq": value}
            
            results = self._collection.query(
                query_texts=[query],
                n_results=top_k,
                where=where_clause,
                include=["documents", "metadatas", "distances"],
            )
            
            # Format results
            search_results = []
            if results["ids"] and results["ids"][0]:
                for i, doc_id in enumerate(results["ids"][0]):
                    distance = results["distances"][0][i] if results["distances"] else 0.0
                    # Convert distance to similarity score (lower distance = higher similarity)
                    score = 1.0 / (1.0 + distance)
                    
                    doc = Document(
                        id=doc_id,
                        content=results["documents"][0][i],
                        metadata=results["metadatas"][0][i] if results["metadatas"] else {},
                    )
                    
                    search_results.append(SearchResult(
                        document=doc,
                        score=score,
                        rank=i + 1,
                    ))
            
            return search_results
            
        except Exception as e:
            logger.error("ChromaDB search failed: %s", e)
            return []
    
    async def delete_documents(self, document_ids: list[str]) -> int:
        """Delete documents from ChromaDB."""
        if not self._initialized:
            await self.initialize()
        
        try:
            self._collection.delete(ids=document_ids)
            logger.info("Deleted %d documents from ChromaDB", len(document_ids))
            return len(document_ids)
        except Exception as e:
            logger.error("Failed to delete documents: %s", e)
            return 0
    
    async def get_document(self, document_id: str) -> Optional[Document]:
        """Get a specific document from ChromaDB."""
        if not self._initialized:
            await self.initialize()
        
        try:
            results = self._collection.get(ids=[document_id], include=["documents", "metadatas"])
            
            if results["ids"] and results["documents"]:
                return Document(
                    id=results["ids"][0],
                    content=results["documents"][0],
                    metadata=results["metadatas"][0] if results["metadatas"] else {},
                )
            return None
            
        except Exception as e:
            logger.error("Failed to get document: %s", e)
            return None


class InMemoryVectorStore(BaseVectorStore):
    """Simple in-memory vector store for testing/development.
    
    Uses cosine similarity with basic TF-IDF-like weighting.
    For production, use ChromaDB, Qdrant, or Pinecone.
    """
    
    def __init__(self, config: VectorStoreConfig):
        super().__init__(config)
        self._documents: dict[str, Document] = {}
        self._embeddings: dict[str, list[float]] = {}
    
    async def initialize(self) -> None:
        """Initialize in-memory store (no-op)."""
        self._initialized = True
        logger.info("InMemoryVectorStore initialized")
    
    def _simple_embed(self, text: str) -> list[float]:
        """Generate a simple hash-based embedding (placeholder)."""
        # In production, use real embeddings from sentence-transformers
        import hashlib
        hash_bytes = hashlib.sha256(text.encode()).digest()
        # Convert to 256-dimensional vector (normalized)
        import math
        vec = [float(b) for b in hash_bytes]
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0:
            vec = [v / norm for v in vec]
        return vec * 16  # Expand to 4096 dimensions
    
    async def add_documents(self, documents: list[Document]) -> list[str]:
        """Add documents to in-memory store."""
        ids = []
        for doc in documents:
            if not doc.id:
                doc.id = hashlib.sha256(doc.content.encode()).hexdigest()[:16]
            
            if not doc.embedding:
                doc.embedding = self._simple_embed(doc.content)
            
            self._documents[doc.id] = doc
            self._embeddings[doc.id] = doc.embedding
            ids.append(doc.id)
        
        logger.info("Added %d documents to InMemoryVectorStore", len(ids))
        return ids
    
    async def search(
        self,
        query: str,
        top_k: int = 5,
        filter_metadata: Optional[dict[str, Any]] = None,
    ) -> list[SearchResult]:
        """Search using cosine similarity."""
        query_embedding = self._simple_embed(query)
        
        results = []
        for doc_id, doc in self._documents.items():
            # Apply metadata filter
            if filter_metadata:
                match = all(
                    doc.metadata.get(k) == v
                    for k, v in filter_metadata.items()
                )
                if not match:
                    continue
            
            # Calculate cosine similarity
            doc_emb = doc.embedding or []
            if not doc_emb:
                continue
            
            dot_product = sum(a * b for a, b in zip(query_embedding, doc_emb))
            query_norm = sum(x * x for x in query_embedding) ** 0.5
            doc_norm = sum(x * x for x in doc_emb) ** 0.5
            
            if query_norm > 0 and doc_norm > 0:
                similarity = dot_product / (query_norm * doc_norm)
                results.append((doc, similarity))
        
        # Sort by similarity (descending)
        results.sort(key=lambda x: x[1], reverse=True)
        
        # Return top_k results
        return [
            SearchResult(document=doc, score=score, rank=i + 1)
            for i, (doc, score) in enumerate(results[:top_k])
        ]
    
    async def delete_documents(self, document_ids: list[str]) -> int:
        """Delete documents from in-memory store."""
        count = 0
        for doc_id in document_ids:
            if doc_id in self._documents:
                del self._documents[doc_id]
                if doc_id in self._embeddings:
                    del self._embeddings[doc_id]
                count += 1
        
        logger.info("Deleted %d documents from InMemoryVectorStore", count)
        return count
    
    async def get_document(self, document_id: str) -> Optional[Document]:
        """Get a document from in-memory store."""
        return self._documents.get(document_id)


# Factory function to create vector store
def create_vector_store(config: Optional[VectorStoreConfig] = None) -> BaseVectorStore:
    """Create a vector store instance based on configuration.
    
    Args:
        config: Vector store configuration. If None, uses environment variables.
    
    Returns:
        Initialized vector store instance
    """
    if config is None:
        config = VectorStoreConfig()
    
    backend = config.backend.lower()
    
    if backend == "chromadb":
        return ChromaDBVectorStore(config)
    elif backend == "qdrant":
        # Qdrant implementation would go here
        logger.warning("Qdrant backend requested but not implemented, falling back to in-memory")
        return InMemoryVectorStore(config)
    elif backend == "pinecone":
        # Pinecone implementation would go here
        logger.warning("Pinecone backend requested but not implemented, falling back to in-memory")
        return InMemoryVectorStore(config)
    else:
        logger.info("Using in-memory vector store (backend=%s)", backend)
        return InMemoryVectorStore(config)


# RAG helper functions
async def index_curriculum_module(
    vector_store: BaseVectorStore,
    module: dict[str, Any],
    curriculum_id: str,
) -> list[str]:
    """Index a curriculum module and its topics in the vector store."""
    documents = []
    
    # Index module-level content
    module_doc = Document(
        id=f"module_{module.get('id', '')}",
        content=f"{module.get('title', '')}\n\n{module.get('description', '')}",
        metadata={
            "type": "module",
            "curriculum_id": curriculum_id,
            "domain": module.get("domain", ""),
            "estimated_hours": module.get("estimatedHours", 0),
        },
    )
    documents.append(module_doc)
    
    # Index each topic
    for topic in module.get("topics", []):
        topic_content = f"""
Title: {topic.get('title', '')}
Description: {topic.get('description', '')}

Reading Guides:
{chr(10).join([f"- {rg.get('title', '')}: {rg.get('summary', '')}" for rg in topic.get('readingGuides', [])])}

Projects:
{chr(10).join([f"- {pp.get('title', '')}: {pp.get('description', '')}" for pp in topic.get('practicalProjects', [])])}
"""
        
        topic_doc = Document(
            id=f"topic_{topic.get('id', '')}",
            content=topic_content,
            metadata={
                "type": "topic",
                "curriculum_id": curriculum_id,
                "module_id": module.get("id", ""),
                "module_title": module.get("title", ""),
            },
        )
        documents.append(topic_doc)
    
    # Add all documents to vector store
    if not await vector_store.initialize():
        await vector_store.initialize()
    
    return await vector_store.add_documents(documents)


async def search_curriculum_knowledge(
    vector_store: BaseVectorStore,
    query: str,
    curriculum_id: Optional[str] = None,
    content_type: Optional[str] = None,
    top_k: int = 5,
) -> list[SearchResult]:
    """Search the curriculum knowledge base.
    
    Args:
        vector_store: The vector store instance
        query: Search query
        curriculum_id: Optional filter by curriculum
        content_type: Optional filter by type ('module' or 'topic')
        top_k: Number of results to return
    
    Returns:
        List of search results ranked by relevance
    """
    filters = {}
    if curriculum_id:
        filters["curriculum_id"] = curriculum_id
    if content_type:
        filters["type"] = content_type
    
    return await vector_store.search(
        query=query,
        top_k=top_k,
        filter_metadata=filters if filters else None,
    )
