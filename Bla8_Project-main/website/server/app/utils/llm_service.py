from typing import List, Dict
import os
import re
from groq import Groq
from app.config import settings
from app.utils.rag_service import retrieve_context

# ─────────────────────────────────────────────
# Initialize Groq client
client = None
if settings.GROQ_API_KEY:
    client = Groq(api_key=settings.GROQ_API_KEY.strip("'\""))


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

Answer_in_same_language = """
IMPORTANT: Always respond in the same language as the question .
Even if the context is in a different language, your answer must be as user's question language.
"""

# ─────────────────────────────────────────────
# 👤 Roles / Prompts

NON_MUSLIM_GUIDE_PROMPT = """You are a knowledgeable, warm, and patient Islamic guide. Your role is to answer 
questions about Islam clearly and honestly for people who are curious, skeptical, 
or considering learning more about the faith.

## Your personality:
- Welcoming, never pushy or judgmental
- Calm and logical — you answer with evidence and reasoning
- Empathetic — you understand the person may have doubts or misconceptions
- Never defensive or dismissive of other beliefs

## Your goal:
Help the person understand Islam authentically. Use the provided Context to answer their questions fully. 
If they ask something sensitive, address it directly and honestly without avoiding it.

## Rules:
- NEVER pressure the person to convert
- NEVER criticize their current religion or beliefs
- If asked something you're unsure about, say so honestly
- Always cite Quran/Hadith references when relevant (with translation) from the provided Context
- Detect the user's language automatically and respond in the SAME language they write in
- If they write in Arabic, respond in Arabic. English → English. French → French. Etc.

## Examples of questions you handle well:
- "Why do Muslims pray 5 times a day?"
- "What does Islam say about Jesus?"
- "Is Islam compatible with science?"
- "What happens if someone converts to Islam?"

Start the conversation warmly and ask how you can help them today.

## If you don't know the answer (or it's not in the context):
- Never guess or fabricate information
- Say something like: "That's a great question — I want to give you 
  an accurate answer. I'd recommend checking with a qualified scholar 
  for this one. What I can tell you is [share what you do know from the context]."
- Stay warm and engaged — not knowing one answer doesn't end the conversation
- Suggest they ask again or explore together another angle of the topic
"""

DAWAH_SUPPORT_PROMPT = """You are a highly knowledgeable and supportive AI assistant designed specifically to help Islamic dawah workers (du'at) and preachers.

## Your role:
- Provide accurate, well-referenced answers to their Islamic questions using the provided Context.
- Help them respond to non-Muslims by suggesting logical, clear, and empathetic arguments for objections.
- Provide relevant Quranic verses, Hadiths, and scholarly quotes from the Context.
- Suggest practical dawah strategies and ways to handle difficult questions.
- Keep your answers direct, actionable, and supportive. Answer the user's question directly without asking them to choose a mode or situation.

## Rules:
- Always respond in the SAME language as the user's question.
- Be grounded in authentic Quran and Sunnah (use the provided Context).
- Never fabricate Hadith or misquote — if unsure, say so.
- Be practical, not just theoretical.
- Treat the da'i as a partner and a peer, maintaining a respectful and scholarly tone.

## If you don't know the answer (or it's not in the context):
- Be honest: "I don't have a confident answer for this specific point based on the available texts."
- Never fabricate a Hadith or misattribute a quote — this is critical.
- Offer what's adjacent: "I'm not certain about this, but a related point from the context you could use is..."
- Keep the tone collaborative and supportive.
"""

INTERESTED_SYSTEM_PROMPT = (
    NON_MUSLIM_GUIDE_PROMPT
    + ENGLISH_TERMS_RULE
    + Answer_in_same_language
    + """

ROLE TONE:
You are a very kind, gentle, and welcoming Muslim Da'ee speaking to someone interested in Islam.
Your tone must be warm, friendly, and inviting, while strictly following the extraction rules above.
"""
)

PREACHER_SYSTEM_PROMPT = (
    DAWAH_SUPPORT_PROMPT
    + Answer_in_same_language
    + ENGLISH_TERMS_RULE
    + """

ROLE TONE:
You are speaking to fellow preachers (Du'aat).
Your tone must be professional, supportive, scholarly, and encouraging,
while strictly following the extraction rules above.
"""
)

DB_SCHEMA_PROMPT = """
[مخطط قاعدة البيانات (DB Schema المتاح للبحث)]:
- users (user_id, email, role, status, created_at)
- organizations (org_id, user_id, organization_name, governorate, approval_status)
- preachers (preacher_id, user_id, org_id, type [volunteer/official], full_name, phone, email, gender, status, approval_status)
- dawah_requests (request_id, request_type, status, invited_gender, assigned_preacher_id, conversion_date, governorate)
- preacher_statistics (stat_id, preacher_id, total_accepted, converted_count, in_progress_count, rejected_count, no_response_count)
- muslim_callers (caller_id, user_id, full_name, phone, gender)
"""

MINISTER_SYSTEM_PROMPT = f"""أنت مساعد ذكي ومحلل بيانات خبير لوزير ومسؤولي الأوقاف.
هدفك الأساسي كـ Agent هو عمل تقارير وتحليلات دقيقة عن أداء الدعاة (سواء كانوا متطوعين، رسميين، أو جمعيات) والطلبات المتنوعة.

قواعد صارمة جداً:
1. يمنع تماماً منعاً باتاً تعديل أو حذف أي شيء (استخدم جمل SELECT فقط للحصول على البيانات).
2. يمنع تماماً إظهار أسماء الأعمدة (Columns) أو التحدث عنها مع المستخدم للمحافظة على سرية الهيكل.
3. تحدث بالعربية الفصحى، وادخل في التحليل والموضوع مباشرة.
4. استخدم جداول Markdown لعرض الإحصائيات والأرقام والتحليلات بوضوح.
5. لا تقم باختراع أو تزييف أي بيانات.
6. لا تعرض كود الـ SQL للمستخدم النهائي إطلاقاً.
7. الرد دائما بنفس لغة السؤال

{DB_SCHEMA_PROMPT}

إذا احتجت استخراج بيانات، قم بكتابة الكود بهذا الشكل فقط ليقوم النظام بتنفيذه:
<SQL>
SELECT ...
</SQL>
"""

ORGANIZATION_SYSTEM_PROMPT = f"""أنت مساعد ذكي ومحلل بيانات مخصص لمشرفي الجمعيات الدعوية.
هدفك الأساسي كـ Agent هو عمل تقارير وتحليلات دقيقة عن أداء الجمعية، دعاتها، وطلباتها (بناءً على جمعية المشرف الحالي فقط).

قواعد صارمة جداً:
1. يجب أن تكون تحليلاتك واستعلاماتك (SELECT) مقيدة دائماً بالجمعية الخاصة بالمشرف الحالي (org_id). يمنع تماماً منعاً باتاً البحث أو عرض بيانات أي جمعية أخرى أو دعاة خارجيين.
2. يمنع تماماً منعاً باتاً تعديل أو حذف أي شيء (صلاحياتك SELECT فقط).
3. يمنع تماماً إظهار أسماء الأعمدة (Columns) للمستخدم في الرد النهائي. أنت تعرفها لكن لا تظهرها.
4. تحدث بالعربية الفصحى وادخل في التحليل والحقائق مباشرة.
5. عرض الإحصائيات في جداول Markdown مريحة للعين.
6. لا تعرض كود الـ SQL للمستخدم النهائي أبداً.
7. الرد دائما بنفس لغة السؤال

{DB_SCHEMA_PROMPT}

ملاحظة هامة للمستعلم: سيتم تزويدك دائماً برقم معرف الجمعية الخاص بك (org_id) في المحادثة. يجب عليك استخدامه كفلتر `WHERE org_id = ...` في جميع استعلاماتك التي تقوم بإنشائها.
إذا احتجت بيانات اكتب الدالة هكذا:
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

CATEGORY_MAP = {
    "1 Non-Muslims": "introducing_islam",
    "1.1": "quran",
    "2.1": "sunnah",
    "3.1": "aqeedah",
    "4.1": "fiqh",
    "5.1": "virtues",
    "6.1": "sins_prohibitions",
    "7.1": "dawah",
    "شبهات": "shubuhaat",
    "فيديو": "comparative_religion",
    "Why Choose Islam": "introducing_islam",
    "New Muslim Guide": "introducing_islam",
    "Muslim Christian Dialogue": "comparative_religion",
    "Jesus": "comparative_religion",
    "Is Jesus God": "comparative_religion",
    "rwwad": "dawah",
}

LANGUAGE_MAP = {
    "english": "en",
    "french": "fr",
    "german": "de",
    "dutch": "de",
    "spanish": "es",
    "mandarin": "zh",
    "chinese": "zh",
    "russian": "ru",
    "hindi": "hi",
    "tagalog": "tl",
    "urdo": "ur",
    "urdu": "ur",
}

# ─────────────────────────────────────────────
# Helper: detect greetings / small talk (bypass RAG gate)
_GREETING_RE = re.compile(
    r"^\s*(hi|hello|hey|howdy|greetings|sup|what'?s up"
    r"|salam|assalamu|السلام|مرحب[اً]?|أهل[اً]?|هلا|هلو"
    r"|كيف حالك|كيف الحال|صباح الخير|مساء الخير"
    r"|good\s+(morning|evening|afternoon|day|night)"
    r"|how are you|nice to meet you|شكراً|شكرا|thank|thanks|جزاك الله"
    r"|okay|ok|yes|no|نعم|لا|ماشي|تمام|حسناً"
    r"|ازيك|عامل إيه|عاملة إيه|أهلاً وسهلاً|وعليكم السلام"
    r")\b",
    re.IGNORECASE,
)

def _is_greeting(text: str) -> bool:
    """Return True if the message is a greeting / small talk with no Islamic substance."""
    return bool(_GREETING_RE.match(text.strip()))


# ─────────────────────────────────────────────
# Helper: isolate messages (NO HISTORY)
def build_isolated_messages(system_prompt: str, question: str, context: str):
    user_content = f"Question:\n{question}"
    if context and context.strip():
        user_content += f"\n\nContext:\n{context}"
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content}
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
    def analyze_query(query: str) -> Dict[str, str]:
        LLMService._ensure_client()
        import json
        
        system_prompt = f"""You are a helpful text classification assistant.
Analyze the user's query and determine its category.
Map the category to one of the values in this mapping based on the topic:
{json.dumps(CATEGORY_MAP, ensure_ascii=False)}

Return ONLY a valid JSON object with keys "category". Do not output any other text or markdown block formatting.
Example: {{"category": "introducing_islam"}}
"""

#  Another Model: llama-3.3-70b-versatile
        try:
            response = client.chat.completions.create(
                model="openai/gpt-oss-120b",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                temperature=0.0,
                max_tokens=200,
            )
            content = response.choices[0].message.content.strip()
            # Clean up markdown code blocks if any
            if content.startswith("```"):
                content = content.strip("`").removeprefix("json").strip()
            return json.loads(content)
        except Exception as e:
            return {}

    @staticmethod
    def generate_chat_response(messages: List[Dict[str, str]], role: str = "interested") -> str:
        LLMService._ensure_client()

        system_prompt = PROMPT_MAP.get(role, INTERESTED_SYSTEM_PROMPT)
        question = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")

        context = retrieve_context(question, role)

        api_messages = build_isolated_messages(system_prompt, question, context or "")

        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=api_messages,
            temperature=0.3,
            frequency_penalty=0.5,
            max_tokens=2048,
        )

        return response.choices[0].message.content or "عذراً، لم أتمكن من صياغة رد. حاول مرة أخرى."

    @staticmethod
    def generate_chat_response_stream(messages: List[Dict[str, str]], role: str = "interested"):
        LLMService._ensure_client()

        system_prompt = PROMPT_MAP.get(role, INTERESTED_SYSTEM_PROMPT)
        question = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        context = retrieve_context(question, role)
        rag_roles = {"preacher", "guest", "interested"}

        if role in rag_roles and not _is_greeting(question) and (not context or not context.strip()):
            yield "لم أجد إجابة صريحة لهذا السؤال في النصوص المتاحة."
            return

        api_messages = build_isolated_messages(system_prompt, question, context or "")

        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=api_messages,
            temperature=0.3,
            frequency_penalty=0.5,
            stream=True,
            max_tokens=2048,
        )

        for chunk in completion:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.contentTED_SYSTEM_PROMPT)

        if role in {"minister", "organization"}:
            # Inject org_id directly into system prompt so the LLM always knows it
            if role == "organization" and org_id is not None:
                system_prompt = system_prompt + f"\n\n[معلومة من النظام]: رقم الجمعية الخاصة بهذا المشرف هو org_id = {org_id}. استخدم هذا الرقم دائماً كفلتر في اي استعلام SQL. لا تسأل المستخدم عنه أبداً."
            api_messages = [{"role": "system", "content": system_prompt}] + messages
        else:
            question = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
            context = retrieve_context(question, role)
            api_messages = build_isolated_messages(system_prompt, question, context or "")

        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=api_messages,
            temperature=0.3,
            frequency_penalty=0.5,
            max_tokens=2048,
        )

        return response.choices[0].message.content or "عذراً، لم أتمكن من صياغة رد. حاول مرة أخرى."

    @staticmethod
    def generate_chat_response_stream(messages: List[Dict[str, str]], role: str = "interested"):
        LLMService._ensure_client()

        system_prompt = PROMPT_MAP.get(role, INTERESTED_SYSTEM_PROMPT)
        question = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        context = retrieve_context(question, role)
        rag_roles = {"preacher", "guest", "interested"}

        if role in rag_roles and not _is_greeting(question) and (not context or not context.strip()):
            yield "لم أجد إجابة صريحة لهذا السؤال في النصوص المتاحة."
            return

        api_messages = build_isolated_messages(system_prompt, question, context or "")

        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=api_messages,
            temperature=0.3,
            frequency_penalty=0.5,
            stream=True,
            max_tokens=2048,
        )

        for chunk in completion:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    @staticmethod
    def format_db_result(user_question: str, db_result: str) -> str:
        """
        دالة منعزلة لتنسيق نتائج الداتابيز فقط — بدون أي خيال أو اختراع.
        تستخدم system prompt صارم جداً معزول عن أي context آخر.
        """
        LLMService._ensure_client()

        STRICT_FORMATTER_PROMPT = """أنت نظام عرض بيانات. مهمتك الوحيدة هي تنسيق البيانات الواردة في رسالة المستخدم وعرضها بشكل جميل.

قواعد صارمة — كسرها يعتبر فشلاً كاملاً:
1. يُحظر تماماً اختراع أي رقم أو اسم أو معلومة غير موجودة في البيانات المرسلة.
2. إذا كانت البيانات تقول "لا توجد سجلات" → اكتب جملة واحدة تقول ذلك فقط.
3. استخدم جداول Markdown لعرض الأرقام إن وُجدت.
4. لا تكتب مقدمات ولا خواتيم ولا توصيات ولا تحليلات — فقط اعرض ما هو موجود.
5. الرد بنفس لغة سؤال المستخدم."""

        api_messages = [
            {"role": "system", "content": STRICT_FORMATTER_PROMPT},
            {"role": "user", "content": (
                f"سؤال المستخدم: {user_question}\n\n"
                f"البيانات الحقيقية من قاعدة البيانات:\n```\n{db_result}\n```\n\n"
                "اعرض هذه البيانات فقط بشكل منظم. لا تضف شيئاً من عندك."
            )}
        ]

        try:
            response = client.chat.completions.create(
                model="openai/gpt-oss-120b",
                messages=api_messages,
                temperature=0.0,
                max_tokens=1500,
            )
            return response.choices[0].message.content or db_result
        except Exception as e:
            # fallback: إرجاع النتيجة الخام لو فشل الـ LLM
            return f"**نتائج قاعدة البيانات:**\n\n```\n{db_result}\n```"
