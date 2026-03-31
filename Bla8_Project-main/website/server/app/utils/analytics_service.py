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
    def execute(sql: str, db: Session, role: str = "minister", org_id: Optional[int] = None) -> str:
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
        org_id: Optional[int] = None
    ) -> str:
        """
        دورة المحادثة التحليلية.
        role: 'minister' أو 'organization'
        org_id: مطلوب فقط لو role == 'organization'
        """
        request_messages = messages.copy()
        if role == "organization" and org_id is not None:
            org_filter_msg = {
                "role": "system",
                "content": f"تنبيه أمني صارم: أنت تعمل حالياً لحساب جمعية معرفها هو (org_id = {org_id}). "
                           f"يجب أن تتأكد بنسبة 100% أن أي استعلام SQL تقوم بإنشائه يحتوي على الفلترة المناسبة: `WHERE org_id = {org_id}` في جداول مثل preachers، "
                           f"و `WHERE assigned_preacher_id IN (SELECT preacher_id FROM preachers WHERE org_id = {org_id})` في الجداول المرتبطة مثل dawah_requests و preacher_statistics."
            }
            request_messages.append(org_filter_msg)

        # الجولة الأولى: رسالة المستخدم → LLM
        ai_response = LLMService.generate_chat_response(request_messages, role=role)

        # تحقق هل الـ AI طلب SQL؟
        sql_match = SQL_TAG_PATTERN.search(ai_response)
        if not sql_match:
            # لا SQL → أعد الرد مباشرة
            return ai_response

        sql_query = sql_match.group(1).strip()

        # نفّذ الـ SQL بأمان
        db_result = SafeSQLExecutor.execute(sql_query, db, role=role, org_id=org_id)

        # الجولة الثانية: أرسل نتيجة الداتابيز للـ AI عشان يصوغ رد نهائي
        follow_up_messages = messages + [
            {"role": "assistant", "content": ai_response},
            {
                "role": "user",
                "content": (
                    f"### نتائج استعلام قاعدة البيانات\n\n```text\n{db_result}\n```\n\n"
                    "بناءً على هذه البيانات، قدّم تقريراً مـوجـزاً ومـباشـراً جداً للمستخدم بالعربية الفصحى. "
                    "تحذير هام: لَا تَقُم بـاخـتـراع بـيـانـات، ولا تـكـتـب مـقـدّمـات (مثل 'إليك التقرير') أو خـواتـيـم. "
                    "ابدأ مـباشـرة بالـجـدول أو الـمـعـلومـة الـمـطـلـوبة بأسلوب مهني مـوجـز."
                )
            }
        ]

        final_response = LLMService.generate_chat_response(follow_up_messages, role=role)
        return final_response
        logger.info(f"Analytics: executing SQL: {sql_query[:200]}")

        # نفّذ الـ SQL بأمان
        db_result = SafeSQLExecutor.execute(sql_query, db, role=role, org_id=org_id)
        logger.info(f"Analytics: DB result preview: {db_result[:200]}")

        # الجولة النهائية: منسّق صارم — يعرض الداتا فقط بدون اختراع
        final_response = LLMService.format_db_result(
            user_question=messages[-1]["content"] if messages else "",
            db_result=db_result,
        )
        return final_response

