"""
Response Messages — ثوابت الردود لكل عملية CRUD لكل Role.
كل عملية ليها رسالة نجاح ورسالة خطأ ثابتة.
"""

import enum


class UserMessages(str, enum.Enum):
    # Success
    LISTED            = "تم جلب قائمة المستخدمين بنجاح"
    FETCHED           = "تم جلب بيانات المستخدم بنجاح"
    UPDATED           = "تم تحديث بيانات المستخدم بنجاح"
    DELETED           = "تم حذف المستخدم بنجاح"
    # Errors
    NOT_FOUND         = "المستخدم غير موجود"
    EMAIL_EXISTS      = "البريد الإلكتروني مستخدم بالفعل"
    EMAIL_REGISTERED  = "البريد الإلكتروني مسجل بالفعل"


class AdminMessages(str, enum.Enum):
    # Success
    REGISTERED = "تم تسجيل الأدمن بنجاح"
    LISTED     = "تم جلب قائمة الأدمنز بنجاح"
    FETCHED    = "تم جلب بيانات الأدمن بنجاح"
    UPDATED    = "تم تحديث بيانات الأدمن بنجاح"
    DELETED    = "تم حذف الأدمن بنجاح"
    # Errors
    NOT_FOUND  = "الأدمن غير موجود"


class OrganizationMessages(str, enum.Enum):
    # Success
    REGISTERED = "تم تسجيل الجمعية بنجاح"
    LISTED     = "تم جلب قائمة الجمعيات بنجاح"
    FETCHED    = "تم جلب بيانات الجمعية بنجاح"
    UPDATED    = "تم تحديث بيانات الجمعية بنجاح"
    DELETED    = "تم حذف الجمعية بنجاح"
    # Errors
    NOT_FOUND  = "الجمعية غير موجودة"


class PreacherMessages(str, enum.Enum):
    # Success
    REGISTERED = "تم تسجيل الداعية بنجاح"
    LISTED     = "تم جلب قائمة الدعاة بنجاح"
    FETCHED    = "تم جلب بيانات الداعية بنجاح"
    UPDATED    = "تم تحديث بيانات الداعية بنجاح"
    DELETED    = "تم حذف الداعية بنجاح"
    # Errors
    NOT_FOUND  = "الداعية غير موجود"


class MuslimCallerMessages(str, enum.Enum):
    # Success
    REGISTERED = "تم تسجيل المسلم الداعي بنجاح"
    LISTED     = "تم جلب قائمة المسلمين الدعاة بنجاح"
    FETCHED    = "تم جلب بيانات المسلم الداعي بنجاح"
    UPDATED    = "تم تحديث بيانات المسلم الداعي بنجاح"
    DELETED    = "تم حذف المسلم الداعي بنجاح"
    # Errors
    NOT_FOUND  = "المسلم الداعي غير موجود"


class InterestedPersonMessages(str, enum.Enum):
    # Success
    REGISTERED = "تم تسجيل الشخص المهتم بنجاح"
    LISTED     = "تم جلب قائمة المهتمين بنجاح"
    FETCHED    = "تم جلب بيانات الشخص المهتم بنجاح"
    UPDATED    = "تم تحديث بيانات الشخص المهتم بنجاح"
    DELETED    = "تم حذف الشخص المهتم بنجاح"
    # Errors
    NOT_FOUND  = "الشخص المهتم غير موجود"
