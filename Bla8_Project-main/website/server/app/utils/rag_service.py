"""
RAG Service (Qdrant)
=====================
Retrieves Islamic knowledge context from Qdrant using Hugging Face Inference API embeddings.
- Used for roles: preacher, guest, interested
- Pure semantic search (no category filter) for maximum recall
"""

from typing import Optional, List, Dict
import logging
import requests
import json

from qdrant_client import QdrantClient
from app.config import settings

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Qdrant Client (lazy — initialized on first use)
# ─────────────────────────────────────────────────────────────────────────────

_qdrant_client: Optional[QdrantClient] = None

def _get_qdrant() -> Optional[QdrantClient]:
    global _qdrant_client
    if _qdrant_client is None:
        if not settings.URL_QDRANT or not settings.API_KEY_QDRANT:
            logger.warning("Qdrant env vars missing: URL_QDRANT / API_KEY_QDRANT")
            return None
        try:
            _qdrant_client = QdrantClient(
                url=settings.URL_QDRANT,
                api_key=settings.API_KEY_QDRANT,
                check_compatibility=False,
            )
            logger.info("Qdrant client connected ✓")
        except Exception as e:
            logger.warning(f"Failed to connect to Qdrant: {e}")
            return None
    return _qdrant_client

# ─────────────────────────────────────────────────────────────────────────────
# Embedding Model (API Only)
# ─────────────────────────────────────────────────────────────────────────────

_embedding_cache: Dict[str, List[float]] = {}

def embed_query(text: str) -> Optional[List[float]]:
    """
    Encodes a query using the e5 query prefix format via Hugging Face Inference API.
    """
    query_text = f"query: {text}"

    if query_text in _embedding_cache:
        return _embedding_cache[query_text]

    try:
        vec = None
        if not settings.HF_TOKEN:
            logger.error("HF_TOKEN is missing! Cannot fetch embeddings via HF API.")
            return None
            
        api_url = f"https://router.huggingface.co/hf-inference/models/{settings.RAG_HF_EMBEDDING_MODEL}"
        headers = {"Authorization": f"Bearer {settings.HF_TOKEN}"}
        logger.info(f"Calling HF API for embedding: {settings.RAG_HF_EMBEDDING_MODEL}")
        
        response = requests.post(
            api_url, 
            headers=headers, 
            json={"inputs": [query_text], "options": {"wait_for_model": True}}
        )
        response.raise_for_status()
        results = response.json()
        
        if results and len(results) > 0:
            vec = results[0]

        if vec:
            _embedding_cache[query_text] = vec
            return vec
        return None

    except Exception as e:
        logger.error(f"HF API Embedding error: {e}")
        return None

# ─────────────────────────────────────────────────────────────────────────────
# Context Retrieval
# ─────────────────────────────────────────────────────────────────────────────

# Roles that use RAG
RAG_ROLES = {"preacher", "guest", "interested"}

def retrieve_context(query: str, role: str = "interested", top_k: int = settings.RAG_TOP_K) -> Optional[str]:
    """
    Retrieves the most semantically relevant chunks from Qdrant.
    Returns a single string combining all relevant chunks, or None if nothing found.
    """
    if role not in RAG_ROLES:
        return None

    query_vector = embed_query(query)
    if not query_vector:
        return None

    client = _get_qdrant()
    if client is None:
        return None

    try:
        results = client.query_points(
            collection_name=settings.COLLECTION_NAME,
            query=query_vector,
            limit=top_k,
            score_threshold=settings.SCORE_THRESHOLD,
            with_payload=True,
        )

        points = results.points if hasattr(results, 'points') else results
        if not points:
            logger.info(f"RAG: No results above threshold for query: '{query[:60]}'")
            return None

        chunks: List[str] = []
        total_chars = 0

        for r in points:
            payload = r.payload or {}
            text = payload.get("text") or payload.get("content") or ""
            if not text:
                continue
            if total_chars + len(text) > settings.MAX_CONTEXT_CHARS:
                break

            score_pct = int((r.score or 0) * 100)
            source = payload.get("source") or payload.get("author") or ""
            header = f"[{source} | match {score_pct}%]" if source else f"[match {score_pct}%]"
            chunks.append(f"{header}\n{text}")
            total_chars += len(text)

        if not chunks:
            return None

        logger.info(f"RAG: Retrieved {len(chunks)} chunks for query: '{query[:60]}'")
        return "\n\n".join(chunks)

    except Exception as e:
        logger.error(f"RAG retrieval error: {e}")
        return None
