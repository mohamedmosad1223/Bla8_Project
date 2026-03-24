"""
RAG Service — pgvector Semantic Search
=======================================
كل الكود جاهز. المطلوب منك: فقط عبّئ الحقول المكتوب عليها TODO أدناه.
"""

from typing import Optional, List
import logging

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# ⚙️ TODO: عبّئ هذه القيم فقط
# ─────────────────────────────────────────────────────────────────────────────

TABLE_NAME      = ""   # TODO: اسم الجدول في Postgres (مثال: "knowledge_base")
CONTENT_COLUMN  = ""   # TODO: عمود النص        (مثال: "content")
EMBEDDING_COLUMN = ""  # TODO: عمود الـ Vector   (مثال: "embedding")
TITLE_COLUMN    = ""   # TODO: عمود العنوان (أو "" لو مفيش)
ROLE_COLUMN     = ""   # TODO: عمود الدور   (أو "" لو مفيش فلترة بالدور)

TOP_K           = 3     # عدد المقاطع المُختارة لكل سؤال
MIN_SIMILARITY  = 0.40  # الحد الأدنى للتشابه (0.0 → 1.0)
MAX_CONTEXT_CHARS = 2000 # الحد الأقصى لنص السياق المُرسل للـ AI


# ─────────────────────────────────────────────────────────────────────────────
# 1) EMBEDDING — تحويل نص السؤال إلى Vector للبحث في pgvector
# ─────────────────────────────────────────────────────────────────────────────

def embed_text(text: str) -> Optional[List[float]]:
    """
    يحوّل نص السؤال إلى Vector بنفس الموديل المستخدم عند تخزين الداتا.

    TODO: استبدل السطر أدناه بالموديل الخاص بك.
    الشرط الوحيد: يُرجع List[float] بنفس حجم الـ Vector المخزن في pgvector.

    أمثلة:
        # OpenAI:
        # from openai import OpenAI
        # client = OpenAI(api_key="...")
        # return client.embeddings.create(input=text, model="text-embedding-3-small").data[0].embedding

        # Groq / HuggingFace / أي موديل آخر:
        # return your_model.encode(text).tolist()
    """
    try:
        # TODO: ضع هنا استدعاء موديل الـ Embedding الخاص بك
        raise NotImplementedError("embed_text: لم يتم تحديد موديل الـ Embedding بعد")
    except NotImplementedError:
        logger.warning("embed_text غير مكتملة. RAG لن يعمل حتى يتم تحديد الموديل.")
        return None
    except Exception as e:
        logger.error(f"Embedding error: {e}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# 2) RETRIEVAL — البحث بالتشابه في pgvector
# ─────────────────────────────────────────────────────────────────────────────

def retrieve_context(query: str, role: str = "interested", top_k: int = TOP_K) -> Optional[str]:
    """
    يبحث في pgvector بالتشابه الدلالي ويرجع أفضل المقاطع ذات الصلة.
    يرجع None إذا لم تتوفر داتا أو لم يجد نتائج.
    """
    if not TABLE_NAME or not CONTENT_COLUMN or not EMBEDDING_COLUMN:
        # TODO غير مكتمل بعد → تخطي بدون خطأ
        return None

    query_embedding = embed_text(query)
    if query_embedding is None:
        return None

    try:
        from app.database import SessionLocal
        from sqlalchemy import text

        db = SessionLocal()

        # بناء الـ WHERE clause ديناميكياً
        role_filter = f"AND {ROLE_COLUMN} IN ('all', :role)" if ROLE_COLUMN else ""
        title_select = f", {TITLE_COLUMN} AS title" if TITLE_COLUMN else ", NULL AS title"

        sql = text(f"""
            SELECT
                {CONTENT_COLUMN} AS content
                {title_select},
                1 - ({EMBEDDING_COLUMN} <=> CAST(:embedding AS vector)) AS similarity
            FROM {TABLE_NAME}
            WHERE
                1 - ({EMBEDDING_COLUMN} <=> CAST(:embedding AS vector)) >= :min_sim
                {role_filter}
            ORDER BY {EMBEDDING_COLUMN} <=> CAST(:embedding AS vector)
            LIMIT :top_k
        """)

        params = {
            "embedding": str(query_embedding),
            "min_sim": MIN_SIMILARITY,
            "top_k": top_k,
        }
        if ROLE_COLUMN:
            params["role"] = role

        results = db.execute(sql, params).fetchall()
        db.close()

        if not results:
            return None

        context_parts = []
        total_chars = 0
        for row in results:
            chunk = row.content or ""
            if total_chars + len(chunk) > MAX_CONTEXT_CHARS:
                break
            sim_pct = int(row.similarity * 100)
            header = f"[{row.title} | تطابق {sim_pct}%]" if row.title else f"[تطابق {sim_pct}%]"
            context_parts.append(f"{header}\n{chunk}")
            total_chars += len(chunk)

        return "\n\n".join(context_parts) if context_parts else None

    except Exception as e:
        logger.warning(f"RAG retrieval failed (proceeding without context): {e}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# 3) PROMPT BUILDER — دمج الـ Prompt مع السياق
# ─────────────────────────────────────────────────────────────────────────────

def build_prompt_with_context(base_prompt: str, query: str, role: str = "interested") -> str:
    """يدمج السياق المسترجع في الـ System Prompt ويُلزم الـ AI بعدم الاختراع"""
    context = retrieve_context(query, role)

    # 🚨 سياسة "لا رد بدون داتا" للأدوار المحددة (داعية، زائر، مهتم)
    restricted_roles = ['preacher', 'guest', 'interested']
    if not context and role in restricted_roles:
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
    else:
        # للمدير والمشرف (minister/organization) → نسمح برد عام لو مفيش داتا (أو لو الأدوار مش ريستريكتد)
        return base_prompt + """

IMPORTANT: No specific data found in our knowledge base.
Provide only a brief, general, well-known Islamic answer.
Do NOT fabricate hadith references, scholar names, or fatwas.
If specifics are needed, say: "يُنصح بالتواصل مع أحد العلماء للتأكد."
"""
