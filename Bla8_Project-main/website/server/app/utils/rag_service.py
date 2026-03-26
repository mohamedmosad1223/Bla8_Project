"""
RAG Service (Qdrant)
=====================
يستخدم Qdrant Cloud + HuggingFace embeddings لاسترجاع سياق إسلامي.

المطلوب حسب استخدام التطبيق:
- الـ RAG يكون شغال فقط للـ roles: `preacher` و `guest` و `interested` (غير مسلم)
- الباقي (minister/organization/...) يعتمد على رد عام بدون سياق
"""

from __future__ import annotations

from typing import Optional, List, Dict, Any
import logging
import os

from dotenv import load_dotenv
from pathlib import Path

from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from sentence_transformers import SentenceTransformer
import requests

import numpy as np
from huggingface_hub import InferenceClient

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# 0) CONFIG (من .env زي query_db.py)
# ─────────────────────────────────────────────────────────────────────────────

# تجنب TensorFlow ops (مثل سكربت query_db.py)
os.environ.setdefault("TRANSFORMERS_NO_TF", "1")
os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")

_ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(_ENV_PATH, override=False)

URL_QDRANT = os.getenv("URL_QDRANT", "")
API_KEY_QDRANT = os.getenv("API_KEY_QDRANT", "")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "islamic_knowledge")

TOP_K = int(os.getenv("RAG_TOP_K", "3"))
SCORE_THRESHOLD = float(os.getenv("RAG_SCORE_THRESHOLD", "0.35"))
MAX_CONTEXT_CHARS = int(os.getenv("RAG_MAX_CONTEXT_CHARS", "2000"))

# payload keys المتاحة فعلا عندك (من تفريغ Qdrant):
# - type: غالبًا ثابت (مثال: pdf) → مش مناسب لتمييز roles
# - category: فيه قيم مميزة → هنستخدمها للتمييز بين الداعية/غير مسلم
PAYLOAD_DOC_TYPE_KEY = os.getenv("RAG_PAYLOAD_DOC_TYPE_KEY", "type")
PAYLOAD_CATEGORY_KEY = os.getenv("RAG_PAYLOAD_CATEGORY_KEY", "category")

# قيم category الافتراضية (عدّلهم بالـ .env لو اتضح عكس المنطق)
ROLE_CATEGORY_MAP = {
    # افتراض: المحتوى اللي فيه مقارنات/حوار مناسب للداعية
    "preacher": os.getenv("RAG_CATEGORY_PREACHER", "comparative_religion"),
    # افتراض: محتوى تقديم الإسلام مناسب للغير مسلم
    "interested": os.getenv("RAG_CATEGORY_NON_MUSLIM", "introducing_islam"),
    "guest": os.getenv("RAG_CATEGORY_NON_MUSLIM", "introducing_islam"),
}

_qdrant_client: Optional[QdrantClient] = None
_embed_model: Optional[SentenceTransformer] = None
_embedding_cache: Dict[str, List[float]] = {}

# في e5 models غالباً الأفضل normalise_embeddings=True (لكن لو stored vectors عندك غير normalized
# هنعمل fallback بتجربة بدون normalisation عبر env var)
RAG_NORMALIZE_EMBEDDINGS = os.getenv("RAG_NORMALIZE_EMBEDDINGS", "true").lower() == "true"

# ─────────────────────────────────────────────────────────────────────────────
# Embedding backend
# ─────────────────────────────────────────────────────────────────────────────
RAG_EMBEDDING_BACKEND = os.getenv("RAG_EMBEDDING_BACKEND", "local").lower()  # "local" | "hf_api"
HF_EMBEDDING_MODEL_NAME = os.getenv("RAG_HF_EMBEDDING_MODEL", "intfloat/multilingual-e5-large")
HUGGINGFACEHUB_API_TOKEN = os.getenv("HUGGINGFACEHUB_API_TOKEN", "")


def _mean_pool_token_embeddings(token_embeddings: List[List[float]]) -> List[float]:
    """
    HF Inference (feature-extraction) غالبًا يرجع token embeddings.
    هنحسب mean pooling على محور الـ tokens.
    """
    if not token_embeddings:
        return []
    dim = len(token_embeddings[0])
    pooled = [0.0] * dim
    for emb in token_embeddings:
        for i, v in enumerate(emb):
            pooled[i] += float(v)
    n = float(len(token_embeddings))
    return [v / n for v in pooled]


def _l2_normalize(vec: List[float]) -> List[float]:
    import math
    norm = math.sqrt(sum(v * v for v in vec))
    if norm == 0:
        return vec
    return [v / norm for v in vec]


def _embed_query_via_hf_api(text: str) -> Optional[List[float]]:
    """
    embedding عبر HuggingFace Inference API باستخدام المكتبة الرسمية.
    """
    if not HUGGINGFACEHUB_API_TOKEN:
        logger.warning("HUGGINGFACEHUB_API_TOKEN missing; cannot use hf_api embedding backend.")
        return None

    try:
        client = InferenceClient(api_key=HUGGINGFACEHUB_API_TOKEN)
        # ملاحظة: الموديل مصنف كـ sentence-similarity ولكن لعمل RAG نحتاج الـ feature-extraction لجلب المتجهات (vectors)
        data = client.feature_extraction(text, model=HF_EMBEDDING_MODEL_NAME)
        
        vec: List[float] = []
        # التعامل مع أشكال الرد المختلفة من Inference API (قد يكون list أو numpy array)
        if isinstance(data, (list, tuple, np.ndarray)):
            arr = np.array(data)
            # لو الرد ثلاثي الأبعاد (batch, tokens, dim) نأخذ المتوسط (mean pooling)
            if arr.ndim == 3:
                vec = arr[0].mean(axis=0).tolist()
            # لو الرد ثنائي الأبعاد (tokens, dim) نأخذ المتوسط
            elif arr.ndim == 2:
                vec = arr.mean(axis=0).tolist()
            # لو الرد أحادي الأبعاد (dim) هو ده المطلوب
            elif arr.ndim == 1:
                vec = arr.tolist()
        
        if not vec:
            return None

        if RAG_NORMALIZE_EMBEDDINGS:
            vec = _l2_normalize(vec)

        return vec
    except Exception as e:
        logger.warning(f"HF InferenceClient failed: {e}")
        return None



def _lazy_init() -> None:
    """
    تهيئة Qdrant client + embedding model مرة واحدة.
    """
    global _qdrant_client, _embed_model
    if _qdrant_client is not None and _embed_model is not None:
        return

    if not URL_QDRANT or not API_KEY_QDRANT:
        logger.warning("Qdrant env vars missing: URL_QDRANT / API_KEY_QDRANT")
        return

    try:
        _qdrant_client = QdrantClient(url=URL_QDRANT, api_key=API_KEY_QDRANT, check_compatibility=False)
        logger.info("Qdrant client connected.")
    except Exception as e:
        logger.warning(f"Failed to init Qdrant client: {e}")
        _qdrant_client = None
        return

    if RAG_EMBEDDING_BACKEND == "local":
        try:
            _embed_model = SentenceTransformer(HF_EMBEDDING_MODEL_NAME)
            logger.info("Embedding model ready (local).")
        except Exception as e:
            logger.warning(f"Failed to init embedding model: {e}")
            _embed_model = None
    else:
        # hf_api backend لا يحتاج تحميل model محلي
        _embed_model = None


def embed_query(text: str, *, normalize_embeddings: bool = RAG_NORMALIZE_EMBEDDINGS) -> Optional[List[float]]:
    """
    نفس منطق query_db.py: query prefix
    """
    query_text = f"query: {text}"

    if query_text in _embedding_cache:
        return _embedding_cache[query_text]

    if RAG_EMBEDDING_BACKEND == "hf_api":
        _lazy_init()
        vec = _embed_query_via_hf_api(query_text)
        if vec is None:
            return None
        _embedding_cache[query_text] = vec
        # override flag if needed
        if not normalize_embeddings and RAG_NORMALIZE_EMBEDDINGS:
            # لو اتعمل normalise بالفعل من الـ API، مفيش وسيلة نرجعه بسهولة
            # لكن غالبًا متوافق مع تخزين DB
            pass
        return vec

    # local backend
    _lazy_init()
    if _embed_model is None:
        return None
    try:
        vec = _embed_model.encode(
            query_text,
            normalize_embeddings=normalize_embeddings,
        )
        out = vec.tolist()  # type: ignore[no-any-return]
        _embedding_cache[query_text] = out
        return out
    except Exception as e:
        logger.warning(f"Embedding error: {e}")
        return None


def retrieve_context(query: str, role: str = "interested", top_k: int = TOP_K) -> Optional[str]:
    """
    يسترجع أفضل مقاطع من Qdrant ويكوّن سياق مُجمّع (string).
    """
    # RAG فقط للـ preacher وغير مسلم
    restricted_roles = {"preacher", "guest", "interested"}
    if role not in restricted_roles:
        return None

    query_vector = embed_query(query, normalize_embeddings=RAG_NORMALIZE_EMBEDDINGS)
    if query_vector is None:
        return None

    _lazy_init()
    if _qdrant_client is None:
        return None

    try:
        conditions = []
        category = ROLE_CATEGORY_MAP.get(role)
        if category:
            conditions.append(
                FieldCondition(
                    key=PAYLOAD_CATEGORY_KEY,
                    match=MatchValue(value=category),
                )
            )

        query_filter = Filter(must=conditions) if conditions else None

        hits = _qdrant_client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_vector,
            limit=top_k,
            query_filter=query_filter,
            score_threshold=SCORE_THRESHOLD,
            with_payload=True,
        )

        # Fallback: لو الفلتر ماجبش نتائج (اختلاف payload values)، جرّب من غير فلتر
        if not hits and category:
            hits = _qdrant_client.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_vector,
                limit=top_k,
                query_filter=None,
                score_threshold=SCORE_THRESHOLD,
                with_payload=True,
            )

        # Fallback إضافي: لو مفيش hits حتى بعد الفلتر/بدونه، جرّب normalize_embeddings=false
        # (مفيد لو كان بناء الـ DB متخزن بدون normalisation)
        if not hits and RAG_EMBEDDING_BACKEND == "local" and RAG_NORMALIZE_EMBEDDINGS:
            query_vector_2 = embed_query(query, normalize_embeddings=False)
            if query_vector_2 is not None:
                hits = _qdrant_client.search(
                    collection_name=COLLECTION_NAME,
                    query_vector=query_vector_2,
                    limit=top_k,
                    query_filter=query_filter,
                    score_threshold=SCORE_THRESHOLD,
                    with_payload=True,
                )
    except Exception as e:
        logger.warning(f"Qdrant search failed (proceeding without context): {e}")
        return None

    if not hits:
        return None

    context_parts: List[str] = []
    total_chars = 0

    for hit in hits:
        p: Dict[str, Any] = (hit.payload or {})
        chunk = p.get("text") or p.get("content") or ""
        if not chunk:
            continue

        if total_chars + len(chunk) > MAX_CONTEXT_CHARS:
            break

        score_pct = int((hit.score or 0) * 100)
        source = p.get("source") or p.get("author") or ""
        header = f"[{source} | تطابق {score_pct}%]" if source else f"[تطابق {score_pct}%]"
        context_parts.append(f"{header}\n{chunk}")
        total_chars += len(chunk)

    return "\n\n".join(context_parts) if context_parts else None


def build_prompt_with_context(base_prompt: str, query: str, role: str = "interested") -> str:
    """
    دمج السياق المسترجع في الـ System Prompt.
    سياسة "لا رد بدون داتا" للأدوار المحددة فقط.
    """
    restricted_roles = {"preacher", "guest", "interested"}

    context = retrieve_context(query, role) if role in restricted_roles else None

    if not context and role in restricted_roles:
        # إذا لم نجد سياقاً، لا نمنع الرد تماماً للزوار، بل ننتقل للرد العام
        if role == "guest":
            return base_prompt + "\n\nIMPORTANT: No specific data found. Provide a general, well-known Islamic answer strictly following high ethics."
        return "__BLOCK_RESPONSE__"

    if context:
        return base_prompt + f"""

══════════════════════════════════════════
📚 CONTEXT FROM ISLAMIC KNOWLEDGE BASE
══════════════════════════════════════════
CRITICAL: Answer EXCLUSIVELY based on the context below. Do NOT add anything not present here.
If the context doesn't fully answer the question, say:
"لم أجد في مصادرنا إجابة كافية. يُنصح بالتواصل مع أحد الدعاة."

{context}
══════════════════════════════════════════
"""

    # للمدير والمشرف (minister/organization) — بدون RAG أو لو ماكانش فيه سياق
    return base_prompt + """

IMPORTANT: No specific data found in our knowledge base.
Provide only a brief, general, well-known Islamic answer.
Do NOT fabricate hadith references, scholar names, or fatwas.
If specifics are needed, say: "يُنصح بالتواصل مع أحد العلماء للتأكد."
"""
