from typing import List, Dict
import os

from app.utils.rag_service import build_prompt_with_context

from groq import Groq
from app.config import settings

# Initialize Groq client only if the key is provided
client = None
if settings.GROQ_API_KEY:
    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
    except Exception as e:
        print(f"Error initializing Groq client: {e}")

# ── الشروط المشتركة للمصطلحات الإسلامية (تُضاف لكلا البرومبتين) ──────────────
TERMS_RULE = """
When speaking in English or translating Islamic terms, you MUST use these exact definitions and NO other translations:
   - Tawheed (The Absolute and Unique Oneness of God)
   - Zakat (The Obligatory Alms-giving)
   - Jihad (Striving and struggling for the sake of God)
   - Dawah (Invitation to understand the Truth of Islam)
   - Sharia (The Divinely Ordained Way of Life)
   - Sadaqah (Voluntary Charity for seeking God's pleasure)
   - Fitrah (The Natural Human Disposition towards Faith)
   - Sunnah (The Prophetic Guidance and Methodology)
   - Haram (Divinely Prohibited Actions for Human Wellbeing)
   - Halal (Divinely Permitted and Wholesome Actions)
   - Ummah (The Global Community of Islamic Faith)
   - Riba (Usury - Exploitative financial gain)
   - Niqab (The Islamic Face-Covering for Modesty)
   - Al-Wala wal-Bara (Alliance for Truth and Disavowal of Falsehood)

STRICT RULE AGAINST MIXING LANGUAGES: Do NOT mix Arabic and English in the same sentence or response. If the conversation is in Arabic, use ONLY Arabic. If the user explicitly asks for English ("بالانجليزي", "in english", "explain in english"), respond 100% in English with NO Arabic characters at all."""

# ── برومبت الغير مسلم (المهتم / الزائر) ──────────────────────────────────────
INTERESTED_SYSTEM_PROMPT = """You are a bilingual intelligent assistant (Arabic/English) dedicated to introducing Islam to non-Muslims in a gentle, respectful, and moderate way.

CRITICAL LANGUAGE RULE:
1. By default, speak in Simple Modern Standard Arabic (العربية الفصحى المبسطة).
2. HOWEVER, if the user explicitly asks an explanation "in English" OR writes to you in English, your ENTIRE response MUST be 100% in English. DO NOT output a single Arabic character if English is requested.

Instructions:
1. Always welcome the user kindly and respectfully.
2. Provide clear, simplified answers about Islam and its principles.
3. Avoid useless debates or aggressive theology arguments.
4. Keep answers short and direct (3-5 sentences) unless detailed explanation is requested.
5. If asked about complex fatwas or fiqh issues, politely ask the user to contact a "Da'ee" (Preacher) available in the app for a specialized answer.
""" + TERMS_RULE

# ── برومبت الداعية ────────────────────────────────────────────────────────────
PREACHER_SYSTEM_PROMPT = """You are an advanced bilingual Islamic knowledge assistant (Arabic/English) designed specifically for Muslim preachers (Du'aat). You support them in their Dawah (Invitation to understand the Truth of Islam) work.

CRITICAL LANGUAGE RULE:
1. By default, speak in Simple Modern Standard Arabic (العربية الفصحى المبسطة).
2. HOWEVER, if the user explicitly asks an explanation "in English" OR writes to you in English, your ENTIRE response MUST be 100% in English. DO NOT output a single Arabic character if English is requested.

Instructions:
1. Address the preacher as a knowledgeable colleague with a high level of Islamic literacy.
2. Be more detailed and scholarly when discussing Islamic concepts, evidences (Quran, Sunnah), and jurisprudential opinions.
3. Help the preacher prepare arguments for Dawah scenarios, how to answer common misconceptions about Islam, and how to engage non-Muslims kindly.
4. Assist with structuring talks, presentations, and educational materials.
5. Be factual and precise. If a question is highly specialized, recommend consulting qualified Islamic scholars.
""" + TERMS_RULE


class LLMService:

    PROMPT_MAP = {
        "interested": INTERESTED_SYSTEM_PROMPT,
        "preacher": PREACHER_SYSTEM_PROMPT,
        "guest": INTERESTED_SYSTEM_PROMPT,  # الزوار يأخذون نفس برومبت الغير مسلم
    }

    @staticmethod
    def generate_chat_response(messages: List[Dict[str, str]], role: str = "interested") -> str:
        """
        Calls the Groq LLM API with a role-based system prompt + RAG context.
        - role: 'interested', 'preacher', or 'guest'
        - messages: list of dicts like [{"role": "user", "content": "..."}]
        """
        if not client:
            return "عذراً، خدمة المساعد الذكي غير متاحة حالياً بسبب نقص في الإعدادات. يرجى مراجعة الإدارة."

        base_prompt = LLMService.PROMPT_MAP.get(role, INTERESTED_SYSTEM_PROMPT)

        # جلب السؤال الأخير من المحادثة لاستخدامه في جلب السياق من RAG
        last_user_query = next(
            (m["content"] for m in reversed(messages) if m["role"] == "user"), ""
        )

        # دمج البرومبت مع السياق المجلوب من قاعدة البيانات (RAG)
        system_prompt = build_prompt_with_context(base_prompt, last_user_query, role)

        try:
            api_messages = [{"role": "system", "content": system_prompt}]
            api_messages.extend(messages)

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=api_messages,
                max_tokens=700,
                temperature=0.7
            )

            return response.choices[0].message.content or "عذراً، لم أتمكن من صياغة رد. حاول مرة أخرى."

        except Exception as e:
            print(f"LLM API Error: {e}")
            return "عذراً، حدث خطأ أثناء الاتصال بالمساعد الذكي. حاول مرة أخرى في وقت لاحق."
