from typing import List, Dict
import os

from app.utils.rag_service import build_prompt_with_context

from groq import Groq
from app.config import settings

# Initialize Groq client only if the key is provided
client = None
if settings.GROQ_API_KEY:
    try:
        # Strip potential literal quotes from the .env key
        api_key = settings.GROQ_API_KEY.strip("'\"")
        client = Groq(api_key=api_key)
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

# ── برومبت وزير الأوقاف ───────────────────────────────────────────────────────
MINISTER_SYSTEM_PROMPT = """أنت مساعد ذكاء اصطناعي متخصص في التحليل والإشراف لوزارة الأوقاف. شخصيتك هي "محلل بيانات خبير ومحترف" يقدم المعلومة فـوراً بدون إطالة.

قواعد التنسيق والاختصار (Strict Brevity & Professionalism):
1. تحدث دائماً بالعربية الفصحى المحترفة فقط.
2. ادخـل في صـلـب الـمـوضـوع فـوراً. مـمنوع كتابة مقدمات مثل "بناءً على طلبك" أو "إليك التقرير" أو خاتمة مثل "أتمنى أن يكون مفيداً". ابدأ بالجداول أو الإجابة مباشرة.
3. استخدم Markdown (جداول |، قوائم -) فقط لتنظيم البيانات.
4. لَا تـقـم بـتـضمـيـن أكـواد الـ SQL في الـرد الـنهـائي لـلـمسـتـخـدم. 
5. مـمـنـوع استخدام النص الحرفي '\n'. استخدم السطر الجديد الحقيقي (Enter).

قواعد الـ SQL والأمان الصارمة:
- صلاحياتك هي الـ SELECT فقط.
- ارفض أي طلب "حذف" أو "تعديل" بكلمتين فقط: "عذراً، لا أملك صلاحية التعديل، يمكنني التحليل فقط."
- الجداول: (organizations, preachers, dawah_requests, dawah_reports, users, interested_persons).

إذا احتجت لبيانات، اكتب استعلام SQL (بدون سيميكولون) داخل التاج المخصص:
<SQL>
SELECT ...
</SQL>
"""


# ── برومبت مشرف الجمعية ─────────────────────────────────────────────────────
ORGANIZATION_SYSTEM_PROMPT = """أنت مساعد ذكاء اصطناعي متخصص في التحليل لمشرفي الجمعيات. تعمل كمحلل بيانات ذكي ومختصر جداً.

قواعد اللغة والتنسيق الصارمة:
1. تحدث بالعربية الفصحى بأسلوب مهني ومباشر جداً (No filler words).
2. مـمـنـوع المقدمات أو الخواتم الطويلة. أعطِ المعلومة فوراً (Data-First).
3. لَا تـقـم بـتـضمـيـن أكـواد الـ SQL في الـرد الـنهـائي.
4. استخدم جداول Markdown لعرض أي قائمة بيانات.

صلاحياتك:
- SELECT فقط.
- ارفض التعديل/الحذف بـتـصريح مـوجـز: "عذراً، مسموح لي فقط بالتحليل والقراءة."
- الجداول: `preachers` و `dawah_requests`.

إذا احتجت لبيانات، اكتب استعلام SQL (بدون سيميكولون):
<SQL>
SELECT ...
</SQL>
"""


class LLMService:

    PROMPT_MAP = {
        "interested": INTERESTED_SYSTEM_PROMPT,
        "preacher": PREACHER_SYSTEM_PROMPT,
        "guest": INTERESTED_SYSTEM_PROMPT,  # الزوار يأخذون نفس برومبت الغير مسلم
        "minister": MINISTER_SYSTEM_PROMPT,
        "organization": ORGANIZATION_SYSTEM_PROMPT,
    }

    @staticmethod
    def generate_chat_response(messages: List[Dict[str, str]], role: str = "interested") -> str:
        """
        Calls the Groq LLM API with a role-based system prompt + RAG context.
        """
        global client
        if not client:
            from dotenv import load_dotenv
            from pathlib import Path
            # Force reload .env from the root directory
            env_path = Path(__file__).parent.parent.parent / ".env"
            load_dotenv(env_path, override=True)
            
            # Re-read the key from os.environ
            new_key = os.environ.get("GROQ_API_KEY", "")
            if new_key:
                try:
                    api_key = new_key.strip("'\"")
                    client = Groq(api_key=api_key)
                    print(f"LLM client re-initialized with key from {env_path}")
                except Exception as e:
                    print(f"Error re-initializing LLM client: {e}")

        if not client:
            return "عذراً، خدمة المساعد الذكي غير متاحة حالياً بسبب نقص في الإعدادات. يرجى مراجعة الإدارة."

        base_prompt = LLMService.PROMPT_MAP.get(role, INTERESTED_SYSTEM_PROMPT)

        # جلب السؤال الأخير من المحادثة لاستخدامه في جلب السياق من RAG
        last_user_query = next(
            (m["content"] for m in reversed(messages) if m["role"] == "user"), ""
        )

        # دمج البرومبت مع السياق المجلوب من قاعدة البيانات (RAG)
        system_prompt = build_prompt_with_context(base_prompt, last_user_query, role)

        # إذا كانت السياسة تمنع الرد لعدم وجود داتا (للأدوار الحساسة)
        if system_prompt == "__BLOCK_RESPONSE__":
            return "عذراً، لا تتوفر معلومات كافية في قاعدة بياناتنا حول هذا الاستفسار حالياً. يُنصح بالتواصل مع أحد الدعاة المتخصصين للمزيد من التفاصيل."

        try:
            api_messages = [{"role": "system", "content": system_prompt}]
            api_messages.extend(messages)

            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",  # switching to a lighter model to avoid TPD limits (RateLimitError)
                messages=api_messages,
                max_tokens=2048,
                temperature=0.7,
                timeout=60.0  # Prevent hanging indefinitely
            )

            return response.choices[0].message.content or "عذراً، لم أتمكن من صياغة رد. حاول مرة أخرى."

        except Exception as e:
            # Important: Log the error so we can see it in terminal AND a log file
            import traceback
            from datetime import datetime
            
            error_msg = f"LLM API Error: {str(e)}"
            tb = traceback.format_exc()
            
            # Print to console (red color)
            print(f"\033[91m{error_msg}\033[0m")
            print(tb)
            
            # Log to a file locally for the user to check
            try:
                log_file = os.path.join(os.getcwd(), "llm_debug.log")
                with open(log_file, "a", encoding="utf-8") as f:
                    f.write(f"\n{'='*50}\n")
                    f.write(f"TIME: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                    f.write(f"ROLE: {role}\n")
                    f.write(f"ERROR: {error_msg}\n")
                    f.write(f"TRACEBACK:\n{tb}\n")
                    f.write(f"{'='*50}\n")
            except Exception as le:
                 print(f"Failed to write to log file: {le}")

            return "عذراً، حدث خطأ أثناء الاتصال بالمساعد الذكي. حاول مرة أخرى في وقت لاحق."
