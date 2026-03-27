from typing import List, Dict
import os
from groq import Groq
from app.config import settings
from app.utils.rag_service import retrieve_context

# ─────────────────────────────────────────────
# Initialize Groq client
client = None
if settings.GROQ_API_KEY:
    client = Groq(api_key=settings.GROQ_API_KEY.strip("'\""))

# ─────────────────────────────────────────────
# 🔒 Core Anti-Hallucination + Format

ANTI_HALLUCINATION_CORE = """
You are not a chatbot. You are a Text Extraction Engine.

You MUST rely ONLY on the provided Context.

You are strictly forbidden from:
- Using any knowledge outside the Context
- Making assumptions, explanations, or interpretations
- Adding any information not written explicitly in the Context
- Rewriting freely. You may only lightly clean formatting for readability.

If the answer is NOT explicitly present in the Context, reply EXACTLY with:
"لم أجد إجابة صريحة لهذا السؤال في النصوص المتاحة."

You MUST answer in the SAME LANGUAGE as the user's question.

STRICT OUTPUT FORMAT:

## Text Evidence
(quote exact parts from the Context)

---

## Concise Answer
(a very short summary strictly based on the quoted text)

---

Note: This answer is based strictly on the provided texts without any personal interpretation.
"""

# ─────────────────────────────────────────────
# 🌍 Language Isolation

LANGUAGE_ISOLATION_RULE = """
LANGUAGE RULE:
- If the user writes in Arabic → respond 100% Arabic (no English letters at all).
- If the user writes in English → respond 100% English (no Arabic letters at all).
- Do not mix languages under any circumstance.
"""

# ─────────────────────────────────────────────
# 📘 English Islamic Terms (English only)

ENGLISH_TERMS_RULE = """
When responding in English and mentioning Islamic terms, you MUST use these exact forms:

Tawheed (The Absolute and Unique Oneness of God)
Zakat (The Obligatory Alms-giving)
Jihad (Striving and struggling for the sake of God)
Dawah (Invitation to understand the Truth of Islam)
Sharia (The Divinely Ordained Way of Life)
Sadaqah (Voluntary Charity for seeking God's pleasure)
Fitrah (The Natural Human Disposition towards Faith)
Sunnah (The Prophetic Guidance and Methodology)
Haram (Divinely Prohibited Actions for Human Wellbeing)
Halal (Divinely Permitted and Wholesome Actions)
Ummah (The Global Community of Islamic Faith)
Riba (Usury - Exploitative financial gain)
Niqab (The Islamic Face-Covering for Modesty)
Al-Wala wal-Bara (Alliance for Truth and Disavowal of Falsehood)
"""

# ─────────────────────────────────────────────
# 👤 Roles / Prompts

INTERESTED_SYSTEM_PROMPT = (
    ANTI_HALLUCINATION_CORE
    + LANGUAGE_ISOLATION_RULE
    + ENGLISH_TERMS_RULE
    + """

ROLE TONE:
You are a very kind, gentle, and welcoming Muslim Da'ee speaking to someone interested in Islam.
Your tone must be warm, friendly, and inviting, while strictly following the extraction rules above.
"""
)

PREACHER_SYSTEM_PROMPT = (
    ANTI_HALLUCINATION_CORE
    + LANGUAGE_ISOLATION_RULE
    + ENGLISH_TERMS_RULE
    + """

ROLE TONE:
You are speaking to fellow preachers (Du'aat).
Your tone must be professional, supportive, scholarly, and encouraging,
while strictly following the extraction rules above.
"""
)

MINISTER_SYSTEM_PROMPT = """
أنت محلل بيانات خبير لوزارة الأوقاف.

قواعد صارمة:
- تحدث بالعربية الفصحى فقط.
- ادخل في الموضوع مباشرة بدون مقدمات.
- استخدم جداول Markdown فقط لعرض البيانات.
- صلاحياتك SELECT فقط.
- ممنوع اختراع أي بيانات غير موجودة.
- لا تعرض SQL في الرد النهائي.

إذا احتجت بيانات اكتب:
<SQL>
SELECT ...
</SQL>
"""

ORGANIZATION_SYSTEM_PROMPT = """
أنت محلل بيانات لمشرفي الجمعيات.

قواعد:
- عربية فصحى مهنية مباشرة.
- اعرض البيانات في جداول Markdown.
- SELECT فقط.
- ممنوع اختراع بيانات.
- لا تعرض SQL في الرد النهائي.

إذا احتجت بيانات:
<SQL>
SELECT ...
</SQL>
"""

PROMPT_MAP = {
    "interested": INTERESTED_SYSTEM_PROMPT,
    "guest": INTERESTED_SYSTEM_PROMPT,
    "preacher": PREACHER_SYSTEM_PROMPT,
    "minister": MINISTER_SYSTEM_PROMPT,
    "organization": ORGANIZATION_SYSTEM_PROMPT,
}

# ─────────────────────────────────────────────
# Helper: isolate messages (NO HISTORY)
def build_isolated_messages(system_prompt: str, question: str, context: str):
    return [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": f"""Question:
{question}

Context:
{context}
"""
        }
    ]

# ─────────────────────────────────────────────
# LLM Service

class LLMService:

    @staticmethod
    def _ensure_client():
        global client
        if not client:
            raise RuntimeError("Groq client not initialized")

    @staticmethod
    def generate_chat_response(messages: List[Dict[str, str]], role: str = "interested") -> str:
        LLMService._ensure_client()

        system_prompt = PROMPT_MAP.get(role, INTERESTED_SYSTEM_PROMPT)
        question = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")

        context = retrieve_context(question, role)
        if not context or not context.strip():
            return "لم أجد إجابة صريحة لهذا السؤال في النصوص المتاحة."

        api_messages = build_isolated_messages(system_prompt, question, context)

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=api_messages,
            temperature=0.0,
            max_tokens=2048,
        )

        return response.choices[0].message.content or "عذراً، لم أتمكن من صياغة رد. حاول مرة أخرى."

    @staticmethod
    def generate_chat_response_stream(messages: List[Dict[str, str]], role: str = "interested"):
        LLMService._ensure_client()

        system_prompt = PROMPT_MAP.get(role, INTERESTED_SYSTEM_PROMPT)
        question = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        context = retrieve_context(question, role)

        if not context or not context.strip():
            yield "لم أجد إجابة صريحة لهذا السؤال في النصوص المتاحة."
            return

        api_messages = build_isolated_messages(system_prompt, question, context)

        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=api_messages,
            temperature=0.0,
            stream=True,
            max_tokens=2048,
        )

        for chunk in completion:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content