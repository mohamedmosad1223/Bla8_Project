from typing import List, Dict
import os
import re
import logging
from groq import Groq
from app.config import settings
from app.utils.rag_service import retrieve_context
from app.utils.quran_service import get_quran_ayah

# ─────────────────────────────────────────────
# Initialize Groq client
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# Initialize Groq client
client = None
try:
    if settings.GROQ_API_KEY:
        client = Groq(api_key=settings.GROQ_API_KEY.strip("'\""))
except Exception as e:
    logger.error(f"Failed to initialize Groq client: {e}")

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
2. **NO MIXING:** Do NOT mix languages. If the target is English, respond in 100% English. If Arabic, 100% Arabic.
3. **FORBIDDEN SCRIPTS:** You are STRICTLY FORBIDDEN from using any Chinese characters (汉字), Japanese/Korean, or Cyrillic characters.
4. **QURANIC EXCEPTION:** Only Arabic Quranic verses are allowed to be mixed into non-Arabic responses.
5. **TECHNICAL TERMS:** Use the script appropriate for the target language (e.g., `التوحيد` for Arabic, `Tawheed` for English).

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
- Always cite Quran/Hadith references when relevant (with translation) from the provided Context.
- **IMPORTANT**: If a verse is marked as 'Authoritative', you MUST use that exact text. Do NOT include the label 'Authoritative' or [AUTHORITATIVE QURANIC TEXT] in your response.
- **LANGUAGE PURITY**: Respond 100% in the user's language. NO mixing with English/Latin/Other scripts (except Quran).
- Detect the user's language and respond EXCLUSIVELY in that same language.
- NEVER add a fully bilingual response.

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
- **IMPORTANT**: If a verse is marked as 'Authoritative', you MUST use that exact text. Do NOT include the label 'Authoritative' or [AUTHORITATIVE QURANIC TEXT] in your response.
- **LANGUAGE PURITY**: You are FORBIDDEN from mixing languages. Respond 100% in the user's language. 
- **QURANIC EXCEPTION**: Arabic Quranic verses are the only allowed exception. 
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

- **الترجمة العربية الإجبارية (SQL Level):** يُمنع تماماً ترك كلمات مثل `active` أو `suspended` تخرج من الداتابيز. استخدم دائماً `CASE WHEN p.status::TEXT = 'active' THEN 'نشط' WHEN p.status::TEXT = 'suspended' THEN 'موقوف' ELSE 'غير معروف' END AS "الحالة"` داخل استعلام الـ SQL نفسه.
- **منع تكرار الأسماء (Unique Names):** لضمان ظهور كل اسم مرة واحدة فقط (وحل مشكلة "محمد" المتكرر)، الزم دائماً استخدام `GROUP BY p.full_name, o.organization_name` في تقارير الدعاة، مع تجميع الإحصائيات (`SUM`, `COUNT DISTINCT`). للحالة، استخدم `MAX(CASE...)` لضمان اختيار حالة واحدة للاسم الموحد.
- **الترتيب:** الترتيب تنازلياً حسب النشاط (`ORDER BY 4 DESC`).

- **النمط 1: ملخص مقارنة (Summary):**
  ```sql
  SELECT o.organization_name AS "الجمعية", COUNT(DISTINCT p.preacher_id) AS "عدد الدعاة", COUNT(DISTINCT r.request_id) AS "إجمالي الطلبات", SUM(CASE WHEN r.status = 'converted' THEN 1 ELSE 0 END) AS "عدد المسلمين", ROUND((SUM(CASE WHEN r.status = 'converted' THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(DISTINCT r.request_id), 0), 1) AS "نسبة النجاح %"
  FROM organizations o
  LEFT JOIN preachers p ON o.org_id = p.org_id
  LEFT JOIN dawah_requests r ON p.preacher_id = r.assigned_preacher_id
  GROUP BY o.organization_name
  ORDER BY 3 DESC;
  ```

- **النمط 2: تفاصيل الدعاة (Detailed):**
  ```sql
  SELECT 
    p.full_name AS "الداعية", 
    COALESCE(o.organization_name, 'متعاون') AS "الجهة", 
    MAX(CASE WHEN p.status::TEXT = 'active' THEN 'نشط' WHEN p.status::TEXT = 'suspended' THEN 'موقوف' ELSE 'غير معروف' END) AS "الحالة", 
    COUNT(DISTINCT r.request_id) AS "الطلبات", 
    ROUND((SUM(CASE WHEN r.status::TEXT = 'converted' THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(DISTINCT r.request_id), 0), 1) AS "نسبة النجاح %"
  FROM preachers p
  LEFT JOIN organizations o ON p.org_id = o.org_id
  LEFT JOIN dawah_requests r ON p.preacher_id = r.assigned_preacher_id
  GROUP BY p.full_name, o.organization_name
  ORDER BY 4 DESC;
  ```

- **النمط 3: قائمة كل الطلبات (All Requests) — أعمدة عربية كاملة — MANDATORY:**
  ```sql
  SELECT
    r.request_id AS "رقم الطلب",
    CASE WHEN r.request_type::TEXT = 'self_interested' THEN 'مهتم من تلقاء نفسه' WHEN r.request_type::TEXT = 'invited' THEN 'مدعو' ELSE r.request_type::TEXT END AS "نوع الطلب",
    CASE WHEN r.status::TEXT = 'converted' THEN 'أسلم' WHEN r.status::TEXT IN ('in_progress','under_persuasion') THEN 'قيد الإقناع' WHEN r.status::TEXT = 'rejected' THEN 'مرفوض' WHEN r.status::TEXT = 'no_response' THEN 'لا استجابة' WHEN r.status::TEXT = 'pending' THEN 'جديد' ELSE r.status::TEXT END AS "الحالة",
    CASE WHEN r.invited_gender::TEXT = 'male' THEN 'ذكر' WHEN r.invited_gender::TEXT = 'female' THEN 'أنثى' ELSE r.invited_gender::TEXT END AS "جنس المدعو",
    COALESCE(p.full_name, 'لم يُسند بعد') AS "الداعية",
    o.organization_name AS "الجمعية"
  FROM dawah_requests r
  LEFT JOIN preachers p ON r.assigned_preacher_id = p.preacher_id
  LEFT JOIN organizations o ON p.org_id = o.org_id
  WHERE o.org_id = [ORG_ID]
  ORDER BY r.request_id DESC;
  ```

- **النمط 4: الطلبات الجديدة (pending / بدون داعية) — أعمدة عربية:**
  ```sql
  SELECT
    r.request_id AS "رقم الطلب",
    CASE WHEN r.request_type::TEXT = 'self_interested' THEN 'مهتم من تلقاء نفسه' WHEN r.request_type::TEXT = 'invited' THEN 'مدعو' ELSE r.request_type::TEXT END AS "نوع الطلب",
    CASE WHEN r.status::TEXT = 'converted' THEN 'أسلم' WHEN r.status::TEXT IN ('in_progress','under_persuasion') THEN 'قيد الإقناع' WHEN r.status::TEXT = 'rejected' THEN 'مرفوض' WHEN r.status::TEXT = 'no_response' THEN 'لا استجابة' WHEN r.status::TEXT = 'pending' THEN 'جديد' ELSE r.status::TEXT END AS "الحالة",
    CASE WHEN r.invited_gender::TEXT = 'male' THEN 'ذكر' WHEN r.invited_gender::TEXT = 'female' THEN 'أنثى' ELSE r.invited_gender::TEXT END AS "جنس المدعو",
    COALESCE(p.full_name, 'لم يُسند بعد') AS "الداعية",
    r.governorate AS "المحافظة"
  FROM dawah_requests r
  LEFT JOIN preachers p ON r.assigned_preacher_id = p.preacher_id
  LEFT JOIN organizations o ON p.org_id = o.org_id
  WHERE o.org_id = [ORG_ID]
    AND (r.status::TEXT = 'pending' OR r.assigned_preacher_id IS NULL)
  ORDER BY r.request_id DESC;
  ```

- **عزل السياق:** تجاهل الحالات السابقة واستخدم المطلوب في آخر سؤال فقط.
"""


MINISTER_SYSTEM_PROMPT = f"""أنت مساعد ذكي ومحلل بيانات خبير لوزير ومسؤولي الأوقاف.
هدفك الأساسي كـ Agent هو عمل تقارير وتحليلات دقيقة عن أداء الدعاة (سواء كانوا متطوعين، رسميين، أو جمعيات) والطلبات المتنوعة.

قواعد صارمة جداً:
1. يمنع تماماً منعاً باتاً تعديل أو حذف أي شيء (استخدم جمل SELECT فقط للحصول على البيانات).
2. يمنع تماماً إظهار أسماء الأعمدة (Columns) أو التحدث عنها مع المستخدم للمحافظة على سرية الهيكل.
3. تحدث بالعربية الفصحى، وادخل في التحليل والموضوع مباشرة.
4. **الأولوية في الرد:** إذا سألك المستخدم سؤالاً محدداً (مثل: من هم الدعاة الموقوفون؟)، يجب أن تكون إجابتك الأولى هي استخراج القائمة المطلوبة (الأسماء والجهات) بشكل مباشر. لا تكتفِ بعرض إحصائيات عامة فقط؛ بل أجب على لبّ السؤال أولاً ثم أرفق إحصائيات الجمعيات التابعة لهم كدعم إضافي.
5. **وفاء البيانات:** لا تقم باختراع أو تزييف أي بيانات.
6. **السرية:** لا تعرض كود الـ SQL للمستخدم النهائي إطلاقاً.
7. الرد دائما بنفس لغة السؤال

{DB_SCHEMA_PROMPT}

إذا احتجت استخراج أي أرقام، نسبة، أو معلومات، يجب عليك حصراً إنشاء كود SQL بهذا الشكل فقط ليقوم النظام بتنفيذه، ثم توقف عن الحديث:
<SQL>
SELECT ...
</SQL>
إنذار نهائي: يُمنع تماماً وتحت أي ظرف كتابة أي أرقام، إحصائيات، أو جداول مباشرة من نسج خيالك أو استنتاجك بدون استخدام استعلام SQL أولاً! أي محاولة للكتابة المباشرة تعتبر خرقاً حرجاً.
"""

ORGANIZATION_SYSTEM_PROMPT = f"""أنت مساعد ذكي ومحلل بيانات مخصص لمشرفي الجمعيات الدعوية.
هدفك الأساسي كـ Agent هو عمل تقارير وتحليلات دقيقة عن أداء الجمعية، دعاتها، وطلباتها (بناءً على جمعية المشرف الحالي فقط) بالاعتماد على بيانات قاعدة البيانات الفعلية فقط.

قواعد صارمة جداً:
1. يجب أن تكون تحليلاتك واستعلاماتك (SELECT) مقيدة دائماً بالجمعية الخاصة بالمشرف الحالي (org_id). يمنع تماماً منعاً باتاً البحث أو عرض بيانات أي جمعية أخرى أو دعاة خارجيين.
2. يمنع تماماً منعاً باتاً تعديل أو حذف أي شيء (صلاحياتك SELECT فقط).
3. يمنع تماماً إظهار أسماء الأعمدة (Columns) للمستخدم في الرد النهائي. أنت تعرفها لكن لا تظهرها.
4. يمنع تماماً اختراع أي رقم أو نسبة أو عدّاد غير مستخرج من قاعدة البيانات عبر استعلام SQL فعلي.
5. إذا احتجت أي رقم أو إحصائية أو نسبة مئوية، يجب أولاً أن تنشئ استعلام SQL داخل الوسوم <SQL>...</SQL> ليقوم النظام بتنفيذه، ثم تعتمد فقط على النتائج الراجعة منه.
6. إذا لم تستطع الوصول لبيانات مناسبة عبر SQL (أو لم تُرجع أي صفوف)، يجب أن تشرح ذلك بصراحة للمستخدم بدون اختراع بدائل.
7. تحدث بالعربية الفصحى وادخل في التحليل والحقائق مباشرة.
8. عرض الإحصائيات في جداول Markdown مريحة للعين.
9. لا تعرض كود الـ SQL للمستخدم النهائي أبداً.
10. الرد دائما بنفس لغة السؤال.
11. يمنع تماماً وبشكل قاطع الإفصاح للمستخدم عن رقم الجمعية الداخلي (org_id) في ردودك أو ترحيبك، حافظ على سرية المعرفات البرمجية.

{DB_SCHEMA_PROMPT}

ملاحظة هامة للمستعلم: سيتم تزويدك دائماً برقم معرف الجمعية الخاص بك (org_id) في المحادثة. يجب عليك استخدامه كفلتر `WHERE org_id = ...` في جميع استعلاماتك التي تقوم بإنشائها.
إذا احتجت أي أرقام أو بيانات اكتب الدالة هكذا وتوقف عن الحديث فوراً:
<SQL>
SELECT ...
</SQL>
إنذار نهائي حرج: يُمنع يقيناً وتحت أي ظرف وبأي شكل من الأشكال كتابة أي أرقام، جداول، أو إحصائيات مباشرة في النص كمحاولة للإجابة! إجابتك إذا كانت عن أرقام يجب أن تكون **فقط وحصرياً** داخل <SQL>...</SQL> لكي يقوم النظام بتشغيلها. من يخالف ذلك يتم إيقافه من النظام.
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

# Helper: detect "Ayah X from Surah Y" (single ayah)
_AYAH_QUERY_RE = re.compile(
    r"(?:الآية|آية|اية)\s+(?:رقم\s+)?(\d+)\s+(?:من\s+)?(?:سورة\s+|سوره\s+)?([\u0600-\u06FF]+)",
    re.IGNORECASE
)

# Helper: detect "first N ayahs from Surah Y" or "ayahs 1-N from Surah Y"
_MULTI_AYAH_RE = re.compile(
    r"(?:اول|أول|أوائل|ابدأ\s*بـ?)?\s*"
    r"(\d+)\s+"
    r"(?:آيات|ايات|آية|اية)\s+"
    r"(?:من\s+|في\s+)?"
    r"(?:(?:سورة|سوره)\s+)?"
    r"((?!سورة|سوره)[\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+)?)",
    re.IGNORECASE
)
SURAH_MAP = {
    "الفاتحة": 1, "البقرة": 2, "آل عمران": 3, "النساء": 4, "المائدة": 5, "الأنعام": 6, "الأعراف": 7, "الأنفال": 8, "التوبة": 9, "يونس": 10,
    "هود": 11, "يوسف": 12, "الرعد": 13, "إبراهيم": 14, "الحجر": 15, "النحل": 16, "الإسراء": 17, "الكهف": 18, "مريم": 19, "طه": 20,
    "الأنبياء": 21, "الحج": 22, "المؤمنون": 23, "النور": 24, "الفرقان": 25, "الشعراء": 26, "النمل": 27, "القصص": 28, "العنكبوت": 29, "الروم": 30,
    "فاتحة": 1, "بقرة": 2, "عمران": 3, "نساء": 4, "مائدة": 5, "أنعام": 6, "أعراف": 7, "أنفال": 8, "توبة": 9,
    "حج": 22, "مؤمنون": 23, "نور": 24, "فرقان": 25, "شعراء": 26, "نمل": 27, "قصص": 28, "عنكبوت": 29, "روم": 30,
    "لقمان": 31, "السجدة": 32, "الأحزاب": 33, "سبأ": 34, "فاطر": 35, "يس": 36, "الصافات": 37, "ص": 38, "الزمر": 39, "غافر": 40,
    "فصلت": 41, "الشورى": 42, "الزخرف": 43, "الدخان": 44, "الجاثية": 45, "الأحقاف": 46, "محمد": 47, "الفتح": 48, "الحجرات": 49, "ق": 50,
    "الذاريات": 51, "الطور": 52, "النجم": 53, "القمر": 54, "الرحمن": 55, "الواقعة": 56, "الحديد": 57, "المجادلة": 58, "الحشر": 59, "الممتحنة": 60,
    "الصف": 61, "الجمعة": 62, "المنافقون": 63, "التغابن": 64, "الطلاق": 65, "التحريم": 66, "الملك": 67, "القلم": 68, "الحاقة": 69, "المعارج": 70,
    "نوح": 71, "الجن": 72, "المزمل": 73, "المدثر": 74, "القيامة": 75, "الإنسان": 76, "المرسلات": 77, "النبأ": 78, "النازعات": 79, "عبس": 80,
    "التكوير": 81, "الانفطار": 82, "المطففين": 83, "الانشقاق": 84, "البروج": 85, "الطارق": 86, "الأعلى": 87, "الغاشية": 88, "الفجر": 89, "البلد": 90,
    "الشمس": 91, "الليل": 92, "الضحى": 93, "الشرح": 94, "التين": 95, "العلق": 96, "القدر": 97, "البينة": 98, "الزلزلة": 99, "العاديات": 100,
    "القارعة": 101, "التكاثر": 102, "العصر": 103, "الهمزة": 104, "الفيل": 105, "قريش": 106, "الماعون": 107, "الكوثر": 108, "الكافرون": 109, "النصر": 110,
    "المسد": 111, "الإخلاص": 112, "الفلق": 113, "الناس": 114
}
# Regex for other numeric forms in context: 2:10 or [2:10] or (2:10)
_NUMERIC_REF_RE = re.compile(r"(?:Qur'an|Quran|Surah|\(|\s|\[)?\s*(\d{1,3}):(\d{1,3})(?:-\d+)?(?:\)|\s|\])?", re.IGNORECASE)

# Regex for Arabic forms in context: سورة البقرة آية 10
_ARABIC_REF_RE = re.compile(r"(?:سورة|سوره)\s+([آأإء-ي]+)\s*(?:آية|اية)?\s*(\d+)", re.IGNORECASE)

def _verify_quran_references_in_context(context: str) -> str:
    """Scan RAG context for references and replace them with authoritative text."""
    if not context or not context.strip():
        return context

    # 1. Collect all unique references first
    extracted_refs = set() # (surah_id, ayah_num, raw_match_string)
    
    # Numeric (2:255)
    for m in _NUMERIC_REF_RE.finditer(context):
        try:
            sid, aid = int(m.group(1)), int(m.group(2))
            if 1 <= sid <= 114:
                extracted_refs.add((sid, aid, m.group(0)))
        except: continue

    # Arabic (سورة البقرة 10)
    for m in _ARABIC_REF_RE.finditer(context):
        sname, aid_str = m.group(1).strip(), m.group(2)
        sid = SURAH_MAP.get(sname)
        if not sid and sname.startswith("ال"):
            sid = SURAH_MAP.get(sname[2:])
        elif not sid and not sname.startswith("ال"):
            sid = SURAH_MAP.get("ال" + sname)
        
        if sid:
            try:
                extracted_refs.add((sid, int(aid_str), m.group(0)))
            except: continue

    if not extracted_refs:
        return context

    # 2. Fetch and Replace in-place
    new_context = context
    for sid, aid, raw_match in extracted_refs:
        res = get_quran_ayah(sid, aid, "arabic")
        if res:
            auth_tag = (
                f"\n[المصدر الموثوق]:\n"
                f"سورة {res['surah_name']} ({sid})، آية {aid}\n"
                f"النص: {res['arabic_text']}\n"
                f"الترجمة: {res['translation']}\n"
                f"التفسير: {res['tafsir']}\n"
                f"[نهاية المصدر]\n"
            )
            # Find the match again to be safe with in-place replacement
            new_context = new_context.replace(raw_match, f" (Ref: {raw_match}) {auth_tag} ")

    return new_context

def _resolve_surah_id(name: str) -> int:
    """Try to find the Surah ID from a name string, with and without \u0627\u0644."""
    sid = SURAH_MAP.get(name)
    if sid:
        return sid
    if name.startswith("\u0627\u0644"):
        return SURAH_MAP.get(name[2:], 0)
    return SURAH_MAP.get("\u0627\u0644" + name, 0)


def _try_get_ayah_context(query: str) -> str:
    """Detect Quran requests in the query and return authoritative text.
    Handles:
      - Single: '\u0627\u0644\u0622\u064a\u0629 10 \u0645\u0646 \u0633\u0648\u0631\u0629 \u0627\u0644\u0628\u0642\u0631\u0629'
      - Multi:  '\u0627\u0648\u0644 10 \u0622\u064a\u0627\u062a \u0645\u0646 \u0633\u0648\u0631\u0629 \u0627\u0644\u0628\u0642\u0631\u0629'
    """
    # ── 1. Try multi-ayah request first (higher priority / more specific) ──
    m = _MULTI_AYAH_RE.search(query)
    if m:
        count = min(int(m.group(1)), 20)   # cap at 20 to avoid huge prompts
        surah_name = m.group(2).strip()
        surah_id = _resolve_surah_id(surah_name)
        if surah_id:
            logger.info(f"Multi-Ayah: fetching {count} ayahs from Surah {surah_id} ({surah_name})")
            lines = [f"\n\n[\u0623\u0648\u0644 {count} \u0622\u064a\u0627\u062a \u0645\u0646 \u0633\u0648\u0631\u0629 {surah_name} \u2014 \u0627\u0644\u0645\u0635\u062f\u0631 \u0627\u0644\u0645\u0648\u062b\u0648\u0642]:\n"]
            fetched = 0
            for i in range(1, count + 1):
                res = get_quran_ayah(surah_id, i, "arabic")
                if not res:
                    break
                lines.append(
                    f"({i}) {res['arabic_text']}\n"
                )
                fetched += 1
            if fetched > 0:
                return "".join(lines)

    # ── 2. Try single ayah request ──
    m = _AYAH_QUERY_RE.search(query)
    if m:
        ayah_num = int(m.group(1))
        surah_name = m.group(2).strip()
        surah_id = _resolve_surah_id(surah_name)
        if surah_id:
            logger.info(f"Single Ayah: Surah {surah_id} ({surah_name}), Ayah {ayah_num}")
            res = get_quran_ayah(surah_id, ayah_num, "arabic")
            if res:
                return (
                    f"\n\n[\u0646\u0635 \u0627\u0644\u0622\u064a\u0629 \u0645\u0646 \u0627\u0644\u0645\u0635\u062f\u0631 \u0627\u0644\u0645\u0648\u062b\u0648\u0642]:\n"
                    f"\u0633\u0648\u0631\u0629 {res['surah_name']} - \u0622\u064a\u0629 {res['ayah_number']}\n"
                    f"\u0627\u0644\u0646\u0635: {res['arabic_text']}\n"
                    f"\u0627\u0644\u062a\u0641\u0633\u064a\u0631: {res['tafsir']}\n"
                )
    return ""



def _sanitize_text(text: str) -> str:
    """Whitelist-based sanitization: Keep ONLY Arabic, Latin, Numbers, and common symbols."""
    if not text: return ""
    # Whitelist:
    # \u0600-\u06FF: Arabic
    # \u0020-\u007E: Basic Latin (Eng, Punct, Numbers)
    # \u00A0-\u00FF: Latin-1 Supplement (European)
    # \u2000-\u206F: General Punctuation
    pattern = r"[^\u0600-\u06FF\u0020-\u007E\u00A0-\u00FF\u2000-\u206F\n\r\t]"
    return re.sub(pattern, " ", text)

# ─────────────────────────────────────────────
# Helper: isolate messages (NO HISTORY)
def build_isolated_messages(system_prompt: str, question: str, context: str, role: str = "interested"):
    # Sanitize ONLY FOR PREACHER to prevent foreign script hallucinations
    if role == "preacher":
        question = _sanitize_text(question)
        context = _sanitize_text(context)
    
    # Detect if we should use Arabic headers
    has_arabic = bool(re.search(r"[\u0600-\u06FF]", question))
    
    if has_arabic:
        user_content = f"السؤال:\n{question}"
        if context and context.strip():
            user_content += f"\n\nالسياق المتاح:\n{context}"
        if role == "preacher":
            user_content += "\n\n(تنبيه: التزم بـ 'قاعدة اللغة الواحدة'. أجب باللغة المطلوبة حصراً ولا تخلط بين الحروف.)"
    else:
        user_content = f"Question:\n{question}"
        if context and context.strip():
            user_content += f"\n\nContext:\n{context}"
        if role == "preacher":
            user_content += "\n\n(Reminder: Follow the STRICT LINGUISTIC CONSISTENCY rule. Respond EXCLUSIVELY in the requested language.)"
            
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
                model="llama-3.3-70b-versatile",
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
    def generate_chat_response_stream(messages: List[Dict[str, str]], role: str = "interested"):
        LLMService._ensure_client()

        system_prompt = PROMPT_MAP.get(role, INTERESTED_SYSTEM_PROMPT)
        question = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        yield " " # Immediate visible token to clear "..." in UI
        context = retrieve_context(question, role)
        
        # Verify and inject authoritative Quran text from context references
        if context:
            context = _verify_quran_references_in_context(context)

        # Check for specific Ayah link
        ayah_context = _try_get_ayah_context(question)
        if ayah_context:
            context = (context or "") + ayah_context

        rag_roles = {"preacher", "guest", "interested"}

        if role in rag_roles and not _is_greeting(question) and (not context or not context.strip()):
            yield "لم أجد إجابة صريحة لهذا السؤال في النصوص المتاحة."
            return

        api_messages = build_isolated_messages(system_prompt, question, context or "", role=role)

        try:
            print(f"--- AI Stream Request (Role: {role}) using 70B ---")
            try:
                completion = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=api_messages,
                    temperature=0.0,
                    frequency_penalty=0.0, # Reset to 0 to prevent "boring" language token exploration
                    stream=True,
                    max_tokens=2048,
                    timeout=20.0 # Increase timeout to avoid aggressive fallback to 8B
                )
                for chunk in completion:
                    content = chunk.choices[0].delta.content
                    if content:
                        if role == "preacher":
                            yield _sanitize_text(content)
                        else:
                            yield content
                print("--- 70B Stream Success! ---")
            except Exception as e_70b:
                print(f"--- 70B Stream FAILED: {e_70b}. Falling back to 8B... ---")
                completion = client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=api_messages,
                    temperature=0.0,
                    frequency_penalty=0.0, # Explicitly zero out for fallback stability
                    stream=True,
                    max_tokens=2048,
                )
                for chunk in completion:
                    content = chunk.choices[0].delta.content
                    if content:
                        if role == "preacher":
                            yield _sanitize_text(content)
                        else:
                            yield content
                print("--- 8B Fallback Stream Success! ---")
        except Exception as e:
            logger.error(f"Global Stream Error: {e}")
            print(f"--- GLOBAL STREAM ERROR: {e} ---")
            yield "عذراً، حدث خطأ أثناء الاتصال بالخادم (Groq Support). يرجى المحاولة لاحقاً."

    @staticmethod
    def generate_analytics_response(messages: List[Dict[str, str]], role: str) -> str:
        """
        خاص بـ Analytics (Minister/Organization):
        يحتفظ بسياق المحادثة كاملاً والرسائل المحقونة (مثل org_id) ولا يتجاهلها.
        تستخدم درجة حرارة 0.0 لضمان دقة توليد الـ SQL.
        """
        LLMService._ensure_client()
        system_prompt = PROMPT_MAP.get(role, MINISTER_SYSTEM_PROMPT)
        
        # إضافة الـ System Prompt الأساسي في البداية
        api_messages = [{"role": "system", "content": system_prompt}] + messages
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=api_messages,
            temperature=0.0,
            max_tokens=2048,
        )
        return response.choices[0].message.content or ""

    # ─── generate_chat_response (non-stream fallback) ───────────────────────
    @staticmethod
    def generate_chat_response(messages: List[Dict[str, str]], role: str = "interested") -> str:
        LLMService._ensure_client()
        system_prompt = PROMPT_MAP.get(role, INTERESTED_SYSTEM_PROMPT)
        question = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        context = retrieve_context(question, role)
        if context:
            context = _verify_quran_references_in_context(context)
        ayah_context = _try_get_ayah_context(question)
        if ayah_context:
            context = (context or "") + ayah_context
        api_messages = build_isolated_messages(system_prompt, question, context or "", role=role)
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=api_messages,
                temperature=0.0,
                frequency_penalty=0.0,
                max_tokens=2048,
            )
            content = response.choices[0].message.content or "عذراً، لم أتمكن من صياغة رد."
            return _sanitize_text(content) if role == "preacher" else content
        except Exception as e:
            logger.error(f"LLM Error: {e}")
            return "عذراً، حدث خطأ أثناء الاتصال بالخادم."

    @staticmethod
    def format_db_result(user_question: str, db_result: str) -> str:
        """
        دالة منعزلة لتنسيق نتائج الداتابيز فقط — بدون أي خيال أو اختراع.
        تستخدم system prompt صارم جداً معزول عن أي context آخر.
        """
        LLMService._ensure_client()

        STRICT_FORMATTER_PROMPT = """أنت خبير تحليل بيانات محترف. مهمتك هي تنسيق البيانات الواردة بجدول Markdown أنيق وتقديم تحليل ذكي.

قواعد صارمة للتعامل مع البيانات (إجبارية):
1. **الصدق والدقة:** يُحظر تماماً اختراع أو تأليف أي أرقام أو بيانات غير موجودة في النص المرسل لك تحت وسم [البيانات الحقيقية].
2. **خصوصية المعرفات:** يُمنع عرض المعرفات الرقمية الداخلية (مثل `org_id`, `preacher_id`, `user_id`, `stat_id`) في الجدول النهائي للمستخدم. ركز فقط على الأسماء والبيانات البشرية.
3. **منع التناقض:** إذا قمت برسم جدول يحتوي على بيانات، **يُمنع تماماً** كتابة أي ملاحظة تفيد بعدم وجود بيانات أو عدم مطابقة الطلب. ابقَ إيجابياً وركز على ما تم العثور عليه.
4. **الجدول:** استخدم صيغة Markdown Standard حصراً `|---|---|`. **يُمنع تماماً** استخدام الحروف الرسومية أو الفواصل مثل `+----+` أو `-----+-----`؛ هذه مخرجات خام يجب تحويلها لجدول Markdown نظيف.
5. **الترجمة وتطهير الأرقام:**
   - `converted` -> "أسلموا".
   - `suspended` -> "موقوف".
   - `0E-20` أو أي صيغة علمية -> حولها فوراً لـ "0".
   - `total_requests` -> "إجمالي الطلبات".
6. **التحليل والتقييم:** أسفل الجدول، قدم تحليلاً مختصراً (فقرة واحدة) يوضح أهم النقاط الإيجابية ونقاط التحسين.
7. **الأخطاء التقنية:** فقط إذا كان النص المرسل يحتوي صراحة على [خطأ في تنفيذ الاستعلام] أو [لا توجد بيانات مطابقة] بدون أي صفوف أخرى، حينها فقط أبلغ المستخدم بتعذر العثور على بيانات."""

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
                model="llama-3.3-70b-versatile",
                messages=api_messages,
                temperature=0.0,
                max_tokens=1500,
            )
            return response.choices[0].message.content or db_result
        except Exception as e:
            # fallback: إرجاع النتيجة الخام لو فشل الـ LLM
            return f"**نتائج قاعدة البيانات:**\n\n```\n{db_result}\n```"
