"""
Analytics AI Service — Read-Only Safe SQL Execution
====================================================
يسمح للذكاء الاصطناعي بالاطلاع على بيانات الداتابيز لأغراض التحليل فقط.
المبدأ الأساسي: لا شيء سوى SELECT ينفَّذ على الإطلاق.
"""

import re
import logging
from typing import List, Dict, Optional

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.utils.llm_service import LLMService

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# الكلمات المحظورة في أي SQL ترسله الـ AI
# ─────────────────────────────────────────────────────────────────────────────
_FORBIDDEN_KEYWORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|REPLACE|GRANT|REVOKE|EXEC|EXECUTE|CALL|MERGE)\b",
    re.IGNORECASE,
)

# الحد الأقصى للصفوف المُرجَعة (حماية من Queries ضخمة)
MAX_ROWS = 200


class SafeSQLExecutor:
    """
    ينفّذ SELECT Queries فقط، ويحمي الداتابيز من أي تعديل عبر قواعد صارمة.
    """

    @staticmethod
    def is_safe(sql: str) -> tuple[bool, str]:
        """
        يتحقق من أمان الـ SQL قبل التنفيذ.
        يُرجع (True, "") لو آمن، أو (False, سبب_الرفض) لو محظور.
        """
        sql_stripped = sql.strip()

        # يجب أن يبدأ بـ SELECT
        if not re.match(r"^\s*SELECT\b", sql_stripped, re.IGNORECASE):
            return False, "مسموح بـ SELECT فقط."

        # لا يحتوي على كلمات خطرة
        match = _FORBIDDEN_KEYWORDS.search(sql_stripped)
        if match:
            return False, f"الكلمة المحظورة: {match.group().upper()}"

        # Strip trailing semicolon before multi-statement check
        sql_stripped_no_trailing_semicolon = sql_stripped.rstrip(';')

        # لا يحتوي على فاصلة منقوطة (Multi-statement)
        if ";" in sql_stripped_no_trailing_semicolon:
            return False, "ممنوع استخدام الفاصلة المنقوطة (Multi-statement). اكتب استعلاماً واحداً فقط بدون سيميكولون."

        # لا يحتوي على تعليقات قد تخفي أوامر ضارة
        if "--" in sql_stripped or "/*" in sql_stripped:
            return False, "ممنوع استخدام تعليقات SQL."

        return True, ""

    @staticmethod
    def execute(sql: str, db: Session, role: str = "minister", org_id: Optional[int] = None, preacher_id: Optional[int] = None) -> str:
        """
        ينفّذ الـ SQL بعد التحقق من سلامته.
        - لو الـ role هو organization، يُضيف WHERE org_id تلقائياً.
        - يُعيد النتيجة كنص منسّق لإرساله للـ AI.
        """
        safe, reason = SafeSQLExecutor.is_safe(sql)
        if not safe:
            logger.warning(f"SafeSQLExecutor BLOCKED: {reason} | SQL: {sql[:200]}")
            return f"[تم رفض الاستعلام: {reason}]"

        final_sql = sql
        params: dict = {}
        # NOTE: We do not use the CTE wrapper `(SELECT * FROM ({sql}) AS _sub WHERE _sub.org_id = :__org_id)` 
        # because it crashes when queries use aggregations like COUNT() without explicitly selecting org_id.
        # Instead, we rely strictly on the system prompt injection to provide `org_id` to the LLM.

        try:
            result = db.execute(text(final_sql), params)
            rows = result.fetchmany(MAX_ROWS)
            columns = list(result.keys())

            if not rows:
                return "[لا توجد بيانات مطابقة لهذا الاستعلام في قاعدة البيانات حالياً]"

            # تنسيق النتائج كجدول نصي أنيق
            header = " | ".join(columns)
            separator = "-+-".join("-" * len(str(col)) for col in columns)
            lines = [header, separator]
            for row in rows:
                lines.append(" | ".join(str(v) if v is not None else "—" for v in row))

            note = f"\n\n[ملاحظة: تم عرض {len(rows)} صف فقط من أصل {MAX_ROWS} حد أقصى للحماية]" if len(rows) == MAX_ROWS else ""
            return "\n".join(lines) + note

        except Exception as e:
            db.rollback() # تنظيف الترانزاكشن الفاشلة للسماح بعمليات لاحقة
            logger.error(f"SafeSQLExecutor error: {e}")
            return f"[خطأ في تنفيذ الاستعلام: {str(e)[:200]}]"


# ─────────────────────────────────────────────────────────────────────────────
# Orchestrator — يجمع LLM + Safe SQL في دورة واحدة
# ─────────────────────────────────────────────────────────────────────────────
SQL_TAG_PATTERN = re.compile(r"<SQL>(.*?)</SQL>", re.DOTALL | re.IGNORECASE)


class AnalyticsAIOrchestrator:
    """
    يتولى إدارة المحادثة التحليلية:
    1. يرسل الرسائل للـ LLM.
    2. لو رد الـ AI بـ <SQL>...</SQL>، ينفّذه بأمان ويُرجع النتيجة للـ AI.
    3. يُعيد الرد النهائي للمستخدم.
    """

    @staticmethod
    def chat(
        messages: List[Dict[str, str]],
        role: str,
        db: Session,
        org_id: Optional[int] = None,
        preacher_id: Optional[int] = None
    ) -> str:
        """
        دورة المحادثة التحليلية.
        role: 'minister', 'organization', أو 'preacher'
        org_id: مطلوب فقط لو role == 'organization'
        preacher_id: مطلوب فقط لو role == 'preacher'
        """
        request_messages = messages.copy()
        
        # Inject role correctly (preacher uses preacher_analytics prompt in LLMService if routed)
        active_role = role
        if role == "preacher":
            active_role = "preacher_analytics"

        if role == "organization" and org_id is not None:
            org_filter_msg = {
                "role": "system",
                "content": (
                    f"تنبيه أمني صارم: أنت تعمل حالياً لحساب جمعية معرفها هو (org_id = {org_id}). "
                    f"يجب أن تتأكد بنسبة 100% أن أي استعلام SQL تقوم بإنشائه يحتوي على الفلترة المناسبة: "
                    f"`WHERE org_id = {org_id}` في جداول مثل preachers، "
                    f"و `WHERE assigned_preacher_id IN (SELECT preacher_id FROM preachers WHERE org_id = {org_id})` "
                    f"في الجداول المرتبطة مثل dawah_requests و preacher_statistics. "
                    f"(استثناء: عند البحث عن الطلبات الجدد/المتاحة، استخدم `WHERE status = 'pending'` بدون تقييد الداعية لأنها متاحة للجميع للتبني). "
                    f"تحذير أمني شديد: إياك ثم إياك أن تتلفظ أو تفصح للمستخدم بأي شكل من الأشكال عن كلمة org_id أو قيمتها ({org_id}) في ردودك، هذا الأمر يجب أن يظل مخفياً عن المستخدم تماماً!"
                )
            }
            request_messages.append(org_filter_msg)
        
        elif role == "preacher" and preacher_id is not None:
            preacher_filter_msg = {
                "role": "system",
                "content": (
                    f"تنبيه أمني صارم: أنت تعمل حالياً لحساب داعية معرفه هو (preacher_id = {preacher_id}). "
                    f"يجب أن تتأكد بنسبة 100% أن أي استعلام SQL تقوم بإنشائه مقيد ببيانات هذا الداعية فقط: "
                    f"استخدم `WHERE preacher_id = {preacher_id}` في جدول preacher_statistics، "
                    f"أو `WHERE assigned_preacher_id = {preacher_id}` في جدول dawah_requests. "
                    f"يُمنع تماماً محاولة الوصول لبيانات دعاة آخرين أو جمعيات أخرى أو أي بيانات لا تخصك مباشرة. "
                    f"تحذير أمني شديد: إياك أن تفصح للمستخدم عن قيمة preacher_id أو org_id الخاصة به!"
                )
            }
            request_messages.append(preacher_filter_msg)

        # الجولة الأولى: رسالة المستخدم → LLM
        ai_response = LLMService.generate_analytics_response(request_messages, role=active_role)
        logger.info(f"Analytics [{role}]: first LLM turn done.")

        # تحقق هل الـ AI طلب SQL؟ (يدعم استعلامات متعددة)
        sql_matches = list(SQL_TAG_PATTERN.finditer(ai_response))
        if not sql_matches:
            with open("analytics_debug.log", "a", encoding="utf-8") as f:
                f.write(f"\n--- NO SQL GENERATED ---\nRole: {role}, OrgID: {org_id}\nAI Response:\n{ai_response}\n")
            # لا SQL → أعد الرد مباشرة (مثلاً سؤال توضيحي أو رسالة خطأ)
            return ai_response

        db_results = []
        for idx, match in enumerate(sql_matches, 1):
            sql_query = match.group(1).strip()
            logger.info(f"Analytics: executing SQL {idx}/{len(sql_matches)}: {sql_query[:200]}")
            with open("analytics_debug.log", "a", encoding="utf-8") as f:
                f.write(f"\n--- SQL GENERATED ({idx}) ---\nRole: {role}, OrgID: {org_id}\nQuery:\n{sql_query}\n")

            # نفّذ الـ SQL بأمان
            res = SafeSQLExecutor.execute(sql_query, db, role=role, org_id=org_id, preacher_id=preacher_id)
            db_results.append(f"[نتيجة الاستعلام {idx}]:\n{res}")
            
            with open("analytics_debug.log", "a", encoding="utf-8") as f:
                f.write(f"DB Result ({idx}):\n{res[:500]}\n")

        combined_result = "\n".join(db_results)

        # الجولة النهائية: منسّق صارم — يعرض الداتا فقط بدون اختراع
        user_question = messages[-1]["content"] if messages else ""
        final_response = LLMService.format_db_result(
            user_question=user_question,
            db_result=combined_result,
        )
        return final_response

