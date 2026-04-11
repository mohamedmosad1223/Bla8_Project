from typing import List, Dict
import os
import re
import logging
from groq import Groq
from app.config import settings
from app.utils.rag_service import retrieve_context
from app.utils.quran_service import get_quran_ayah, LANGUAGE_MAP

# Models Configuration
MAIN_MODEL = "deepseek-chat"
INTEL_MODEL = "deepseek-chat" # Background tasks now use DeepSeek/70B
FALLBACK_MODEL = "llama-3.3-70b-versatile"

# ─────────────────────────────────────────────
# Initialize Logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
fh = logging.FileHandler("C:/Users/Dell/chat_debug.log", encoding="utf-8")
fh.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(fh)

# ─────────────────────────────────────────────
# Initialize Groq client
client = None
try:
    if settings.GROQ_API_KEY:
        client = Groq(api_key=settings.GROQ_API_KEY.strip("'\""))
except Exception as e:
    logger.error(f"Failed to initialize Groq client: {e}")

# Initialize DeepSeek client
from openai import OpenAI
ds_client = None
try:
    if settings.DEEPSEEK_API_KEY:
        # Clean the key from any potential invisible characters/quotes
        ds_key = settings.DEEPSEEK_API_KEY.strip().strip("'\"").strip()
        ds_client = OpenAI(
            api_key=ds_key, 
            base_url="https://api.deepseek.com" # Removed /v1 which can cause issues
        )
        logger.info(f"DeepSeek initialized with key: {ds_key[:5]}...")
except Exception as e:
    logger.error(f"Failed to initialize DeepSeek client: {e}")

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
IMPORTANT: Always respond in the same language as the user's question.
If the question is in Arabic, respond in 100% Arabic. No English words, no Latin characters. 
DO NOT use English placeholders in underscores like `_word_`. Always translate terms naturally into the response language.
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

## ⚠️ CRITICAL LANGUAGE RULE — HIGHEST PRIORITY:
1. **DETECT LANGUAGE FIRST**: Before writing a single word, identify the exact language and script of the user's message.
2. **RESPOND IN THAT EXACT SAME LANGUAGE AND SCRIPT ONLY.** If the user writes in Arabic, respond 100% in Arabic. If in English, respond 100% in English.
3. **ABSOLUTELY FORBIDDEN SCRIPTS**: You are STRICTLY AND PERMANENTLY FORBIDDEN from producing ANY of the following in your response:
   - Chinese/Mandarin characters (中文/漢字) — NEVER
   - Japanese (Hiragana/Katakana/Kanji) — NEVER  
   - Korean (Hangul) — NEVER
   - Cyrillic/Russian script — NEVER
   - English/Latin characters when producing an Arabic response — NEVER
   - Any script not matching the user's message language — NEVER
4. **QURANIC EXCEPTION ONLY**: The ONLY exception is Arabic Quranic verses that may appear in non-Arabic responses for citation.
5. **NO MIXING**: A response that mixes Arabic with Chinese, or English with Cyrillic, or Arabic with English, is a CRITICAL FAILURE.
6. **تنبيه هام جداً**: التزم باللغة العربية الفصحى حصراً. يُمنع منعاً باتاً حشر أي كلمات إنجليزية أو حروف لاتينية وسط الكلام العربي. إذا وردت كلمة إنجليزية في سياق البحث (مثل challenge أو prayer)، يجب ترجمتها للعربية (تحدي، صلاة) بدلاً من كتابتها بالإنجليزية أو استخدام رموز بديلة.

## Rules:
- NEVER pressure the person to convert
- NEVER criticize their current religion or beliefs
- **HARD SCRIPTURE RULE (CRITICAL)**: You are ABSOLUTELY FORBIDDEN from quoting Quranic verses or Hadiths from your training data or memory. You MUST ONLY use the text provided in the [Context]. If a verse or evidence is missing from the context, do NOT quote it under any circumstances. You may discuss the general concept instead. Fabrication of scripture is strictly prohibited and will result in system dismissal.
- If asked something you're unsure about, say so honestly
- Always cite Quran/Hadith references when relevant (with translation) FROM THE PROVIDED CONTEXT ONLY.
- **IMPORTANT**: If a verse is marked as 'Authoritative', you MUST use that exact text. Do NOT include the label 'Authoritative' or [AUTHORITATIVE QURANIC TEXT] in your response.
- **LANGUAGE PURITY**: Respond 100% in the user's language. NO foreign scripts, NO English code-switching in non-Latin languages.
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
- **LANGUAGE PURITY**: You are FORBIDDEN from mixing languages. Respond 100% in the user's language. If the question is in Arabic, use 100% Arabic. Translate English terms from context naturally into the response language; do NOT use English placeholders in underscores.
- **QURANIC EXCEPTION**: Arabic Quranic verses are the only allowed exception. 
- Suggest practical dawah strategies and ways to handle difficult questions.
- Keep your answers direct, actionable, and supportive. Answer the user's question directly without asking them to choose a mode or situation.

## Rules:
- Always respond in the SAME language as the user's question.
- Be grounded in authentic Quran and Sunnah (use the provided Context).
- **HARD SCRIPTURE RULE (ULTIMATE)**: You are FORBIDDEN from quoting any verse from memory. If you quote a verse, it MUST be an EXACT copy from the [Context]. If you quote from memory and the reference is found to be wrong, YOUR RESPONSE WILL BE DISCARDED. DO NOT GUESS.
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
- dawah_requests (request_id, request_type, status, invited_gender, assigned_preacher_id, conversion_date, governorate, invited_language_id)
- preacher_statistics (stat_id, preacher_id, total_accepted, converted_count, in_progress_count, rejected_count, no_response_count)
- muslim_callers (caller_id, user_id, full_name, phone, gender)
- languages (language_id, language_name, language_code)
- preacher_languages (preacher_id, language_id, proficiency)

- **الاستعلامات المتعددة (Multi-Queries):** إذا طلب المستخدم استخراج بيانات ومقارنتها بغيرها (مثال: طلب مقارنة الطلبات الجديدة بالدعاة المتاحين)، يجب عليك تلقائياً توليد أكثر من بلوك `<SQL>...</SQL>` متتالي في نفس الرسالة (مثلاً استخدام النمط 4 لطباعة الطلبات مع النمط 5 لمقارنة اللغات بالدعاة)، حتى لو لم يذكر المستخدم كلمة "لغات" صراحةً. هدفك هو تقديم تقرير أوتوماتيكي شامل وكبير بدلاً من الاقتصار على جزء واحد.

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

- **النمط 4: الطلبات الجديدة المتاحة في النظام لجميع الجمعيات (pending / بدون داعية):**
  ```sql
  SELECT
    r.request_id AS "رقم الطلب",
    CASE WHEN r.request_type::TEXT = 'self_interested' THEN 'مهتم من تلقاء نفسه' WHEN r.request_type::TEXT = 'invited' THEN 'مدعو' ELSE r.request_type::TEXT END AS "نوع الطلب",
    'جديد' AS "الحالة",   
    CASE WHEN r.invited_gender::TEXT = 'male' THEN 'ذكر' WHEN r.invited_gender::TEXT = 'female' THEN 'أنثى' ELSE r.invited_gender::TEXT END AS "جنس المدعو",
    l.language_name AS "لغة التواصل",
    r.governorate AS "المحافظة"
  FROM dawah_requests r
  LEFT JOIN languages l ON r.invited_language_id = l.language_id
  WHERE r.status::TEXT = 'pending' AND r.assigned_preacher_id IS NULL
  ORDER BY r.request_id DESC;
  ```

- **النمط 5: مقارنة اللغات (Languages Comparison):**
  ```sql
  SELECT
    l.language_name AS "اللغة",
    COUNT(DISTINCT r.request_id) AS "عدد الطلبات (مدعوين)",
    COUNT(DISTINCT pl.preacher_id) AS "عدد الدعاة المتاحين"
  FROM languages l
  LEFT JOIN dawah_requests r ON l.language_id = r.invited_language_id AND r.assigned_preacher_id IN (SELECT preacher_id FROM preachers p WHERE p.org_id = [ORG_ID])
  LEFT JOIN preacher_languages pl ON l.language_id = pl.language_id AND pl.preacher_id IN (SELECT preacher_id FROM preachers p WHERE p.org_id = [ORG_ID])
  WHERE (r.request_id IS NOT NULL OR pl.preacher_id IS NOT NULL)
  GROUP BY l.language_name
  ORDER BY 2 DESC;
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

ANALYTICS_PREACHER_SYSTEM_PROMPT = f"""أنت مساعد ذكي ومحلل بيانات مخصص للداعية الشخصي.
هدفك الأساسي كـ Agent هو مساعدة الداعية في تتبع أدائه الشخصي، إحصائيات طلباته، ونتائج دعوته بناءً على بيانات قاعدة البيانات الفعلية فقط.

قواعد صارمة جداً:
1. استعلاماتك (SELECT) يجب أن تكون مقيدة دائماً بالداعية الحالي (preacher_id). يمنع تماماً البحث أو عرض بيانات أي داعية آخر.
2. يمنع تماماً تعديل أو حذف أي شيء (صلاحياتك SELECT فقط).
3. يمنع تماماً إظهار أسماء الأعمدة للمستخدم في الرد النهائي.
4. يمنع تماماً اختراع أي رقم أو نسبة غير مستخرج من قاعدة البيانات عبر استعلام SQL فعلي.
5. إذا احتجت أي رقم أو إحصائية، يجب أولاً أن تنشئ استعلام SQL داخل الوسوم <SQL>...</SQL> ليقوم النظام بتنفيذه.
6. تحدث بالعربية الفصحى وكن مشجعاً ومهنياً في تحليلك.
7. عرض الإحصائيات في جداول Markdown مريحة للعين.
8. لا تعرض كود الـ SQL للمستخدم النهائي أبداً.
9. الرد دائما بنفس لغة السؤال.
10. يمنع الإفصاح عن المعرفات الرقمية (preacher_id).

{DB_SCHEMA_PROMPT}

ملاحظة هامة للمستعلم: سيتم تزويدك دائماً برقم معرف الداعية الخاص بك (preacher_id) في المحادثة. يجب عليك استخدامه كفلتر `WHERE preacher_id = ...` أو `WHERE assigned_preacher_id = ...` في جميع استعلاماتك.
إذا احتجت أي أرقام أو بيانات اكتب الدالة هكذا وتوقف عن الحديث فوراً:
<SQL>
SELECT ...
</SQL>
"""

PROMPT_MAP = {
    "interested": INTERESTED_SYSTEM_PROMPT,
    "guest": INTERESTED_SYSTEM_PROMPT,
    "preacher": PREACHER_SYSTEM_PROMPT,  # Partner tone (preacher assistant)
    "preacher_analytics": ANALYTICS_PREACHER_SYSTEM_PROMPT,
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

_NUM_PATTERN = r"(\d+|واحد|اثنين|اتنين|ثلاثة?|تلاتة?|ثلاث|تلات|أربعة?|اربعة?|أربع|اربع|خمسة?|خمس|ستة?|ست|سبعة?|سبع|ثمانية?|تمانية?|ثمان|تمان|تسعة?|تسع|عشرة?|عشر|عشرين|عشرون)"

# Helper: detect "Ayah X from Surah Y" (single ayah)
_AYAH_QUERY_RE = re.compile(
    rf"(?:الآية|آية|اية|Verse|Ayat|Ayah)\s+(?:رقم\s+|No\s+|Number\s+)?{_NUM_PATTERN}\s+(?:من\s+|of\s+|de\s+)?(?:سورة\s+|سوره\s+|Surah\s+|Sourate\s+)?([\u0600-\u06FF\s\w]+)",
    re.IGNORECASE
)
_AYAH_QUERY_INV_RE = re.compile(
    rf"(?:سورة|سوره|Surah|Sourate)\s+([\u0600-\u06FF\s\w]+?)\s+(?:الآية|آية|اية|Verse|Ayat|Ayah)\s*(?:رقم\s+|No\s+|Number\s+)?{_NUM_PATTERN}",
    re.IGNORECASE
)

# Helper: detect "first N ayahs from Surah Y" or "ayahs 1-N from Surah Y"
_MULTI_AYAH_RE = re.compile(
    r"(?:اول|أول|أوائل|ابدأ\s*بـ?|first|premiers)?\s*"
    rf"{_NUM_PATTERN}\s+"
    r"(?:آيات|ايات|آية|اية|verses|vrs|versets)\s+"
    r"(?:من\s+|في\s+|of\s+|de\s+|dans\s+)?"
    r"(?:(?:سورة|سوره|Surah|Sourate)\s+)?"
    r"((?!سورة|سوره|Surah|Sourate)[\u0600-\u06FF\s\w]+)",
    re.IGNORECASE
)

# (Removed duplicate _AYAH_QUERY_RE)


_RANGE_AYAH_RE = re.compile(
    r"(?:آيات|ايات|verses|versets|ayat)\s+"
    r"(?:من\s+|الآية\s+|الآيه\s+|اية\s+|آية\s+)?(?P<start>" + _NUM_PATTERN[1:-1] + r")\s+"
    r"(?:إلى|الى|لـ|حتى|to|au|jusqu'à|until)\s+"
    r"(?:الآية\s+|الآيه\s+|اية\s+|آية\s+)?(?P<end>" + _NUM_PATTERN[1:-1] + r")\s+"
    r"(?:من\s+|في\s+|of\s+|de\s+|dans\s+)?(?:(?:سورة|سوره|Surah|Sourate)\s+)?((?!سورة|سوره|Surah|Sourate)[\u0600-\u06FF\s\w]+)",
    re.IGNORECASE
)
_MULTI_AYAH_INV_RE = re.compile(
    r"(?:سورة|سوره|Surah|Sourate)\s+([\u0600-\u06FF\s\w]+?)\s+(?:اول|أول|أوائل|ابدأ\s*بـ?|first|premiers)?\s*"
    rf"{_NUM_PATTERN}\s+"
    r"(?:آيات|ايات|آية|اية|verses|versets)",
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
    "المسد": 111, "الإخلاص": 112, "الفلق": 113, "الناس": 114,
    # Latin/French equivalents for better matching if intent includes them
    "maryam": 19, "mariam": 19, "marie": 19, "baqarah": 2, "baqara": 2, "imran": 3, "nisa": 4, "maidah": 5, "anam": 6
}
# Regex for other numeric forms STRICTLY associated with Quran/Brackets: Quran 2:10 or [2:10] or (2:10)
_NUMERIC_REF_RE = re.compile(
    r"(?:Qur'an|Quran|Surah|سورة|سوره)\s*(\d{1,3}):(\d{1,3})(?:-\d+)?|"
    r"\[\s*(\d{1,3}):(\d{1,3})(?:-\d+)?\s*\]|"
    r"\(\s*(\d{1,3}):(\d{1,3})(?:-\d+)?\s*\)", 
    re.IGNORECASE
)

# Regex for Arabic forms in context: سورة البقرة آية 10 or سورة آل عمران 5
_ARABIC_REF_RE = re.compile(r"(?:سورة|سوره)\s+([\u0600-\u06FF\s]+?)\s*(?:(?:آية|اية)\s*)?(\d+)", re.IGNORECASE)

def _verify_quran_references_in_context(context: str, language: str = "arabic") -> str:
    """Scan RAG context for references and replace them with authoritative text."""
    if not context or not context.strip():
        return context

    # 1. Collect all unique references first
    extracted_refs = set() # (surah_id, ayah_num, raw_match_string)
    
    # Numeric (2:255)
    for m in _NUMERIC_REF_RE.finditer(context):
        try:
            if m.group(1): sid, aid = int(m.group(1)), int(m.group(2))
            elif m.group(3): sid, aid = int(m.group(3)), int(m.group(4))
            else: sid, aid = int(m.group(5)), int(m.group(6))
            
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
        res = get_quran_ayah(sid, aid, language)
        if res:
            auth_tag = (
                f"\n[المصدر الموثوق]:\n"
                f"سورة {res['surah_name']} ({sid})، آية {aid}\n"
                f"النص: {res['arabic_text']}\n"
                f"الترجمة: {res['translation']}\n"
                f"التفسير: {res['tafsir']}\n"
                f"[نهاية المصدر]\n"
            )
            # Replace raw match with reference and authoritative text
            new_context = new_context.replace(raw_match, f"{raw_match} {auth_tag}")

    return new_context
# ─────────────────────────────────────────────
# 🛡️ Output Post-Processing (Anti-Hallucination)

def _sanitize_output(text: str, forbidden_pattern: str = None) -> str:
    """Removes technical placeholders and verifies/fixes Quranic verses in the final output."""
    if not text:
        return ""
    
    # ── 1. Clean technical placeholders ──
    cleaned = text
    if forbidden_pattern:
        cleaned = cleaned.replace(forbidden_pattern, " ")
    
    # Remove markers like _challenge_, _islamic_term_, etc.
    cleaned = re.sub(r'_[a-z_]+_', ' ', cleaned)

    # Collapse multiple spaces but keep newlines
    cleaned = re.sub(r' +', ' ', cleaned)
    
    # ── 2. Quranic Verse Integrity (Anti-Hallucination Guard) ──
    # Scans for Citations and optional preceding quoted text to replace hallucinations.
    # Pattern: Optional "Text" followed by (Surah:Ayah)
    citation_regex = r'([\"«][^\"»]+[\"»]\s*)?\(?([\u0600-\u06FF\s\-\d]+|[A-Za-z\s\-]+)[:\s\.](\d+)\)?'
    
    def _fix_verse(match):
        quoted_text = match.group(1)
        surah_ref = match.group(2).strip()
        ayah_num = match.group(3).strip()
        
        # Resolve Surah name/string to valid ID
        sid = _resolve_surah_id(surah_ref)
        if not sid:
            try: sid = int(surah_ref)
            except: pass
            
        if not sid:
            return match.group(0) # Keep original if we can't resolve the surah
            
        from app.utils.quran_service import get_quran_ayah
        try:
            # Fetch authentic text using resolved ID and int ayah
            real_verse = get_quran_ayah(sid, int(ayah_num))
            if real_verse and real_verse.get("arabic_text"):
                # Always replace with authentic version
                return f"«{real_verse['arabic_text']}» ({surah_ref}: {ayah_num})"
        except:
            pass
        return match.group(0)

    # Apply the validator to surgicaly replace hallucinations
    cleaned = re.sub(citation_regex, _fix_verse, cleaned)
    
    return cleaned

FALLBACK_MESSAGES = {
    "ar": "لم أجد إجابة صريحة لهذا السؤال في النصوص المتاحة.",
    "en": "I did not find an explicit answer to this question in the available texts.",
    "fr": "Je n'ai pas trouvé de réponse explicite à cette question dans les textes disponibles.",
    "hi": "उपलब्ध ग्रंथों में मुझे इस प्रश्न का स्पष्ट उत्तर नहीं मिला।",
    "de": "Ich habe keine ausdrückliche Antwort auf diese Frage in den verfügbaren Texten gefunden.",
    "es": "No encontré una respuesta explícita a esta pregunta en los textos disponibles.",
    "ru": "Я не нашел явного ответа на этот вопрос в доступных текстах.",
    "zh": "在现有文本中我没有找到对此问题的明确回答。",
}

def _resolve_surah_id(name: str) -> int:
    """Try to find the Surah ID from a name string, with and without ال.
    Now supports prefix matching to handle extra text like '.. in the Quran'.
    """
    s = name.lower().strip()
    words = s.split()
    if not words: return 0

    # Try different word lengths: full, 2-word prefix, 1-word prefix
    for i in range(min(len(words), 3), 0, -1):
        candidate = " ".join(words[:i])
        
        # 1. Exact match
        sid = SURAH_MAP.get(candidate)
        if sid: return sid
        
        # 2. 'Al-' prefix handling
        if candidate.startswith("ال"):
            sid = SURAH_MAP.get(candidate[2:])
            if sid: return sid
        else:
            sid = SURAH_MAP.get("ال" + candidate)
            if sid: return sid
            
    return 0

def _text_to_int(text: str) -> int:
    try: return int(text)
    except:
        t = text.replace("ة", "").replace("ه", "").replace("أ", "ا")
        m = {
            "واحد": 1, "اثنين": 2, "اتنين": 2, "ثلاث": 3, "تلات": 3, 
            "اربع": 4, "خمس": 5, "ست": 6, "سبع": 7, "ثماني": 8, "تماني": 8, "ثمان": 8, "تمان": 8,
            "تسع": 9, "عشر": 10, "عشرين": 20, "عشرون": 20
        }
        return m.get(t, 1)


def _try_get_ayah_context(query: str, language: str = "arabic") -> str:
    """Robust detection of Quran requests in the query.
    1. Resolve Surah ID (prefix-aware scanning)
    2. Extract Range (X-Y), Count (First X), or Single (Auto-detected)
    3. Fetch from API
    """
    # Fold characters for more consistent matching
    q = query.lower().replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ة", "ه").strip()
    
    # ── 1. Find Surah ID ──
    surah_id = 0
    surah_name_match = ""
    for s_name in sorted(SURAH_MAP.keys(), key=len, reverse=True):
        if s_name in q:
            surah_id = SURAH_MAP[s_name]
            surah_name_match = s_name
            break
            
    if not surah_id:
        return ""

    # ── 2. Detect Range/Count/Single ──
    # A. Range: "11 to 20" or "من 11 لـ 20"
    range_match = re.search(r"(\d+)\s*(?:إلى|الى|لـ|حتى|to|until|au|jusqu'à|—|-)\s*(\d+)", q)
    if range_match:
        start, end = int(range_match.group(1)), int(range_match.group(2))
        return _fetch_verses(surah_id, surah_name_match, start, end, language)

    # B. Count: "First 10" or "أول 10"
    count_match = re.search(r"(?:أول|اول|first|premiers|أوائل|هات|اعقب|ابدأ)\s+(\d+)", q)
    if count_match:
        count = min(int(count_match.group(1)), 20)
        return _fetch_verses(surah_id, surah_name_match, 1, count, language)

    # C. Single Verse: "Verse 10" or "الآية 10"
    single_match = re.search(r"(?:الآية|الآيه|آية|اية|verse|vrs|ayah|ayat)\s+(\d+)", q)
    if single_match:
        ayah_num = int(single_match.group(1))
        return _fetch_verses(surah_id, surah_name_match, ayah_num, ayah_num, language)
    
    # D. Final Fallback: any number in the string
    digit_match = re.search(r"(\d+)", q)
    if digit_match:
        num = int(digit_match.group(1))
        return _fetch_verses(surah_id, surah_name_match, num, num, language)

    return ""

def _fetch_verses(surah_id: int, surah_name: str, start: int, end: int, language: str) -> str:
    """Fetch a range of verses and format as authoritative context."""
    if start <= 0: start = 1
    if end < start: end = start
    limit = 20
    end = min(end, start + limit - 1)
    
    header = f"[\u0627\u0644\u0645\u0635\u062f\u0631 \u0627\u0644\u0645\u0648\u062b\u0648\u0642 \u2014 \u0633\u0648\u0631\u0629 {surah_name.title()} \u0627\u0644\u0622\u064a\u0627\u062a {start}-{end}]:\n"
    lines = [f"\n\n{header}"]
    
    fetched = 0
    for i in range(start, end + 1):
        res = get_quran_ayah(surah_id, i, language)
        if not res: break
        display_text = res['arabic_text']
        if language.lower() not in ["arabic", "ar"]:
            display_text = f"{res['arabic_text']}\n[{res['translation']}]"
        lines.append(f"({res['ayah_number']}) {display_text}\n")
        fetched += 1
    return "".join(lines) if fetched > 0 else ""
    return ""



def _get_forbidden_pattern(user_question: str) -> str:
    """Dynamically determine forbidden scripts (Chinese, Russian, etc.) to prevent hallucinations,
    unless the user explicitly typed in those scripts."""
    if not user_question: return ""
    forbidden = []
    # CJK characters (Chinese, Japanese, Korean)
    if not re.search(r"[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]", user_question):
        forbidden.append(r"\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF")
    # Cyrillic characters (Russian etc)
    if not re.search(r"[\u0400-\u04FF]", user_question):
        forbidden.append(r"\u0400-\u04FF")
        
    return f"[{''.join(forbidden)}]" if forbidden else ""

def _sanitize_text(text: str) -> str:
    """Legacy static format - Keep only for backward compatibility if needed."""
    if not text: return ""
    pattern = r"[^\u0600-\u06FF\u0020-\u007E\u00A0-\u00FF\u2000-\u206F\n\r\t]"
    return re.sub(pattern, " ", text)

# ─────────────────────────────────────────────
# Helper: Build messages with context
def build_messages_with_history(system_prompt: str, messages: List[Dict[str, str]], context: str, user_question: str, rag_query: str = "", role: str = "interested", user_lang: str = "arabic"):
    if not messages:
        return [{"role": "system", "content": system_prompt}]
        
    last_user_idx = -1
    for i in range(len(messages)-1, -1, -1):
        if messages[i]["role"] == "user":
            last_user_idx = i
            break
            
    if last_user_idx == -1:
        return [{"role": "system", "content": system_prompt}] + messages

    question = user_question
    
    # Detect if we should use Arabic headers based ONLY on the user's explicit question
    has_arabic = bool(re.search(r"[\u0600-\u06FF]", question))
    
    if has_arabic:
        user_content = f"رسالة المستخدم:\n{question}"
        if rag_query and rag_query != question and rag_query != "NO_SEARCH_NEEDED":
            user_content += f"\n\nالمقصود من الرسالة للتوضيح:\n{rag_query}"
            
        if context and context.strip():
            user_content += f"\n\nالسياق المتاح:\n{context}"
            
        user_content += "\n\n[أمر إلزامي للمحادثة]: تفاعل مع مشاعر المستخدم بمرونة وتلقائية تامة كأنك صديق ومرشد إنساني. نوّع في أسلوبك، وكن طبيعياً جداً في تفهمك قبل سرد الأدلة. التزم باللغة العربية الفصحى 100%. ممنوع تماماً استخدام أي كلمات إنجليزية أو حروف لاتينية. إذا وجدت مصلطحات إنجليزية في السياق، قم بترجمتها للعربية فوراً ولا تستخدم رموزاً أو كلمات أجنبية."
    else:
        user_content = f"User's Message:\n{question}"
        if rag_query and rag_query != question and rag_query != "NO_SEARCH_NEEDED":
            user_content += f"\n\nIntended Meaning / Context:\n{rag_query}"
            
        if context and context.strip():
            user_content += f"\n\nContext:\n{context}"
            
        user_content += f"\n\n[CRITICAL INSTRUCTION]: You MUST respond 100% in {user_lang.upper()}. You are strictly FORBIDDEN from using Arabic script for anything other than direct Quranic verses. If you explain or talk in Arabic, you will fail your mission. Respond as a helpful friend in {user_lang.upper()}."
        
        system_prompt += f"\n\n[CRITICAL SYSTEM OVERRIDE]: The user is speaking {user_lang.upper()}. You are strictly FORBIDDEN from responding in Arabic. Your entire response MUST be in {user_lang.upper()}."

            
    # Copy messages to avoid modifying original
    final_messages = [{"role": "system", "content": system_prompt}]
    
    for i, msg in enumerate(messages):
        if i == last_user_idx:
            final_messages.append({"role": "user", "content": user_content})
        else:
            final_messages.append(msg)
            
    return final_messages

# ─────────────────────────────────────────────
# LLM Service

class LLMService:

    @staticmethod
    def _ensure_clients():
        global client, ds_client
        if not client and not ds_client:
            raise RuntimeError("Neither Groq nor DeepSeek client initialized")

    @staticmethod
    def analyze_query(query: str) -> Dict[str, str]:
        LLMService._ensure_clients()
        import json
        
        system_prompt = f"""You are a helpful text classification assistant.
Analyze the user's query and determine its category.
Map the category to one of the values in this mapping based on the topic:
{json.dumps(CATEGORY_MAP, ensure_ascii=False)}

Return ONLY a valid JSON object with keys "category". Do not output any other text or markdown block formatting.
Example: {{"category": "introducing_islam"}}
"""

        try:
            if ds_client:
                response = ds_client.chat.completions.create(
                    model=settings.DEEPSEEK_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": query}
                    ],
                    temperature=0.0,
                    max_tokens=200,
                )
            elif client:
                response = client.chat.completions.create(
                    model=INTEL_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": query}
                    ],
                    temperature=0.0,
                    max_tokens=200,
                )
            else:
                raise Exception("No LLM client available for rewrite")
            
            content = response.choices[0].message.content.strip()
            # Clean up markdown code blocks if any
            if content.startswith("```"):
                content = content.strip("`").removeprefix("json").strip()
            return json.loads(content)
        except Exception as e:
            return {}

    @staticmethod
    def _rewrite_query(messages: List[Dict[str, str]]) -> Dict[str, str]:
        """Unified Intelligence Pass: Standalone Query + Language Detection."""
        question = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        LLMService._ensure_clients()
        
        system_prompt = """You are a multilingual AI intent analyzer.
YOUR TASK: Analyze the user's latest message and the conversation history to return a JSON object.

JSON FIELDS:
1. "rewritten_query": A FULL, EXPLICIT, standalone search query in Formal Arabic (الفصحى). Even if the user spoke English/French, this field MUST be Formal Arabic. If the message is just a greeting/gratitude, use "NO_SEARCH_NEEDED".
2. "detected_language": The name of the language the user is speaking (e.g., "english", "french", "spanish", "hindi", "arabic"). Use lowercase.
3. "language_code": The ISO 2-letter code (en, fr, es, hi, ar, etc.).

STRICT RULES:
- Output ONLY valid JSON.
- NO conversational filler, NO explanation.
"""
        history_text = "\n".join([f"{'User' if m['role']=='user' else 'AI'}: {m['content']}" for m in messages[-3:]])
        prompt = f"### History:\n{history_text}\n\n### Last Message:\n{question}\n\n### JSON Output:"

        default_res = {"rewritten_query": question, "detected_language": "arabic", "language_code": "ar"}
        
        try:
            target_client = ds_client if ds_client else client
            # Background intelligence pass uses the 8B model to save 70B tokens
            response = target_client.chat.completions.create(
                model=settings.DEEPSEEK_MODEL if ds_client else INTEL_MODEL,
                messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=250,
            )
            
            content = response.choices[0].message.content.strip()
            if "```" in content:
                content = content.split("```")[1].strip().removeprefix("json").strip()
            
            import json
            res = json.loads(content)
            logger.info(f"RAG Intelligence: {res}")
            return res
        except Exception as e:
            logger.error(f"Intelligence pass failed: {e}")
            return default_res

    @staticmethod
    def generate_chat_response_stream(messages: List[Dict[str, str]], role: str = "interested"):
        LLMService._ensure_clients()

        system_prompt = PROMPT_MAP.get(role, INTERESTED_SYSTEM_PROMPT)
        question = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        forbidden_pattern = _get_forbidden_pattern(question)
        yield " " # Immediate visible token to clear "..." in UI
        
        # ── 1. Unified Intelligence Pass (Rewriting + Language Detection) ──
        intel = LLMService._rewrite_query(messages)
        rag_query = intel.get("rewritten_query", question)
        user_lang = intel.get("detected_language", "arabic")
        lang_code = intel.get("language_code", "ar")
        
        is_filler = (rag_query == "NO_SEARCH_NEEDED")
        context = ""
        if not is_filler:
            context = retrieve_context(rag_query, role)

        # Verify and inject authoritative Quran text from context references
        if context:
            context = _verify_quran_references_in_context(context, language=user_lang)

        # ── 2. Check for specific Ayah link ──
        # Prioritize the RAW question for detection to avoid LLM rewriting noise
        # Fallback to rag_query for history-aware follow-ups (e.g. "what about next?")
        ayah_context = _try_get_ayah_context(question, language=user_lang)
        if not ayah_context and rag_query and rag_query != "NO_SEARCH_NEEDED":
             ayah_context = _try_get_ayah_context(rag_query, language=user_lang)

        if ayah_context:
            logger.info(f"Quran Context Injected: {len(ayah_context)} chars")
            context = (context or "") + ayah_context

        rag_roles = {"preacher", "guest", "interested"}

        # LOGGING for debugging
        logger.info(f"CHAT_DEBUG: role={role}, is_filler={is_filler}, question='{question}', rag_query='{rag_query}', user_lang='{user_lang}', context_len={len(context) if context else 0}, ayah_found={bool(ayah_context)}")

        # Soft RAG Gate: Log empty context but allow LLM generation.
        # Accuracy is maintained by the System Prompt and Scripture Verifier.
        if role in rag_roles and not is_filler and not _is_greeting(question) and (not context or not context.strip()):
            logger.info(f"RAG: No specific context found for '{rag_query}'. Proceeding with caution.")

        api_messages = build_messages_with_history(system_prompt, messages, context or "", question, rag_query, role=role, user_lang=user_lang)

        try:
            # ── 1. TRY DEEPSEEK AS PRIMARY ──
            if ds_client:
                try:
                    completion = ds_client.chat.completions.create(
                        model=settings.DEEPSEEK_MODEL,
                        messages=api_messages,
                        temperature=0.0,
                        stream=True,
                        max_tokens=2048,
                    )
                    ds_buffer = ""
                    for chunk in completion:
                        content = chunk.choices[0].delta.content
                        if content:
                            ds_buffer += content
                            # Yield if we hit punctuation OR if the buffer is getting too long (for responsiveness)
                            if len(ds_buffer) > 15 or any(p in content for p in {".", "!", "?", "؛", ")", "\n"}):
                                yield _sanitize_output(ds_buffer, forbidden_pattern) if role in {"preacher", "interested", "guest"} else ds_buffer
                                ds_buffer = ""
                    if ds_buffer:
                        yield _sanitize_output(ds_buffer, forbidden_pattern) if role in {"preacher", "interested", "guest"} else ds_buffer
                    return
                except Exception as e_ds:
                    print(f"--- DeepSeek PRIMARY FAILED: {e_ds}. Falling back to Groq 70B... ---")

            # ── 2. TRY GROQ 70B AS SECONDARY ──
            if client:
                try:
                    completion = client.chat.completions.create(
                        model="llama-3.3-70b-versatile",
                        messages=api_messages,
                        temperature=0.0,
                        stream=True,
                        max_tokens=2048,
                    )
                    stream_buffer = ""
                    for chunk in completion:
                        content = chunk.choices[0].delta.content
                        if content:
                            stream_buffer += content
                            if len(stream_buffer) > 15 or any(p in content for p in {".", "!", "?", "؛", ")", "\n"}):
                                yield _sanitize_output(stream_buffer, forbidden_pattern) if role in {"preacher", "interested", "guest"} else stream_buffer
                                stream_buffer = ""
                    if stream_buffer:
                        yield _sanitize_output(stream_buffer, forbidden_pattern) if role in {"preacher", "interested", "guest"} else stream_buffer
                    return
                except Exception as e_70b:
                    print(f"--- Groq 70B SECONDARY FAILED: {e_70b} ---")
                
                raise Exception("All providers (DeepSeek, 70B) failed")
        except Exception as e:
            logger.error(f"Global Stream Error: {e}")
            print(f"--- GLOBAL STREAM ERROR: {e} ---")
            yield "عذراً، حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة لاحقاً."

    @staticmethod
    def generate_analytics_response(messages: List[Dict[str, str]], role: str) -> str:
        LLMService._ensure_clients()
        system_prompt = PROMPT_MAP.get(role, MINISTER_SYSTEM_PROMPT)
        api_messages = [{"role": "system", "content": system_prompt}] + messages
        
        try:
            if not ds_client:
                raise Exception("DeepSeek not available")
            response = ds_client.chat.completions.create(
                model=settings.DEEPSEEK_MODEL,
                messages=api_messages,
                temperature=0.0,
                max_tokens=2048,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"DeepSeek analytics failed: {e}. Falling back to Groq.")
            if client:
                response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=api_messages,
                    temperature=0.0,
                    max_tokens=2048,
                )
                return response.choices[0].message.content or ""
            return ""

    # ─── generate_chat_response (non-stream fallback) ───────────────────────
    @staticmethod
    def generate_chat_response(messages: List[Dict[str, str]], role: str = "interested") -> str:
        LLMService._ensure_clients()
        system_prompt = PROMPT_MAP.get(role, INTERESTED_SYSTEM_PROMPT)
        question = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        
        # Intelligence Pass
        intel = LLMService._rewrite_query(messages)
        rag_query = intel.get("rewritten_query", question)
        user_lang = intel.get("detected_language", "arabic")
        
        is_filler = (rag_query == "NO_SEARCH_NEEDED")
        context = ""
        if not is_filler:
            context = retrieve_context(rag_query, role)

        if context:
            context = _verify_quran_references_in_context(context, language=user_lang)

        # Prioritize RAW question for detection
        ayah_context = _try_get_ayah_context(question, language=user_lang)
        if not ayah_context and rag_query and rag_query != "NO_SEARCH_NEEDED":
            ayah_context = _try_get_ayah_context(rag_query, language=user_lang)

        if ayah_context:
            context = (context or "") + ayah_context
            
        rag_roles = {"preacher", "guest", "interested"}
        
        # Soft RAG Gate: Allow generation even with empty context
        if role in rag_roles and not is_filler and not _is_greeting(question) and (not context or not context.strip()):
            logger.info(f"RAG: Empty context for '{rag_query}'.")

        forbidden_pattern = _get_forbidden_pattern(question)
        api_messages = build_messages_with_history(system_prompt, messages, context or "", question, rag_query, role=role, user_lang=user_lang)
        try:
            # TRY GROQ 70B FIRST
            try:
                if not client:
                    raise Exception("Groq not available")
                response = client.chat.completions.create(
                    model=MAIN_MODEL,
                    messages=api_messages,
                    temperature=0.0,
                    max_tokens=2048,
                )
                content = response.choices[0].message.content or ""
                return _sanitize_output(content, forbidden_pattern) if role in {"preacher", "interested", "guest"} else content
            except Exception as e_70b:
                logger.error(f"Groq 70B Error/Limit: {e_70b}")
                
                # TRY DEEPSEEK SECONDARY
                if ds_client:
                    try:
                        response = ds_client.chat.completions.create(
                            model=settings.DEEPSEEK_MODEL,
                            messages=api_messages,
                            temperature=0.0,
                            max_tokens=2048,
                        )
                        content = response.choices[0].message.content or ""
                        return _sanitize_output(content, forbidden_pattern) if role in {"preacher", "interested", "guest"} else content
                    except Exception as e_ds:
                        logger.error(f"DeepSeek Error: {e_ds}")

                # FINAL FALLBACK: GROQ 8B
                response = client.chat.completions.create(
                    model=FALLBACK_MODEL,
                    messages=api_messages,
                    temperature=0.0,
                    max_tokens=2048,
                )
                content = response.choices[0].message.content or ""
                return _sanitize_output(content, forbidden_pattern) if role in {"preacher", "interested", "guest"} else content
        except Exception as e:
            logger.error(f"Global Chat Error: {e}")
            return "عذراً، حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة لاحقاً."

    @staticmethod
    def format_db_result(user_question: str, db_result: str) -> str:
        LLMService._ensure_clients()

        STRICT_FORMATTER_PROMPT = """أنت خبير تحليل بيانات استراتيجي. مهمتك هي إنتاج تقرير منظم يتكون من جزئين أساسيين بالترتيب التالي:

الجزء الأول: جدول البيانات (Markdown Table)
- استخدم تنسيق `|---|---|` حصراً.
- اعرض البيانات الحقيقية من قاعدة البيانات بدقة 100%.
- حول المعرفات التقنية لمسميات بشرية (مثلاً: id -> الاسم).

الجزء الثاني: التحليل الاستراتيجي (مباشرة أسفل الجدول)
- **ملخص الأداء:** شرح مختصر للأرقام وما تعنيه.
- **أبرز الاستنتاجات:** استخراج نقاط القوة والضعف (3-4 نقاط).
- **توصيات عملية:** خطوات محددة للتحسين بناءً على الأرقام.

قواعد إجبارية:
- يُمنع منعاً باتاً اختراع أرقام.
- الرد يجب أن يحتوي على الجدول والتحليل معاً؛ لا تكتفِ بأحدهما.
- تحدث لغة مهنية وباللغة العربية الفصحى.
"""

        api_messages = [
            {"role": "system", "content": STRICT_FORMATTER_PROMPT},
            {"role": "user", "content": (
                f"سؤال المستخدم: {user_question}\n\n"
                f"البيانات الحقيقية:\n```\n{db_result}\n```\n\n"
                "الرجاء عرض الجدول أولاً كما هو، ثم أتبعه مباشرة بالتحليل الاستراتيجي (الملخص، الاستنتاجات، التوصيات)."
            )}
        ]

        try:
            if not ds_client:
                raise Exception("DeepSeek not available")
            response = ds_client.chat.completions.create(
                model=settings.DEEPSEEK_MODEL,
                messages=api_messages,
                temperature=0.0,
                max_tokens=1500,
            )
            return response.choices[0].message.content or db_result
        except Exception as e:
            logger.error(f"DeepSeek Formatter failed: {e}. Falling back to Groq.")
            if client:
                try:
                    response = client.chat.completions.create(
                        model="llama-3.3-70b-versatile",
                        messages=api_messages,
                        temperature=0.0,
                        max_tokens=1500,
                    )
                    return response.choices[0].message.content or db_result
                except Exception as e2:
                    logger.error(f"Groq Formatter failed: {e2}")
            return f"**نتائج قاعدة البيانات:**\n\n```\n{db_result}\n```"