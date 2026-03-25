import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings
import logging

logger = logging.getLogger(__name__)

def send_welcome_email(to_email: str, preacher_name: str, org_name: str, raw_password: str):
    """
    Sends a welcome email to a newly assigned preacher with their credentials.
    """
    # Attempting real SMTP sending with configured credentials
    pass

    subject = "مرحباً بك في منصة إبلاغ - تم إنشاء حساب داعية لك"
    
    html_content = f"""
    <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6; color: #333;">
        <h2 style="color: #0056b3;">السلام عليكم ورحمة الله وبركاته،</h2>
        <p>الأخ الكريم/ة الفاضل/ة <strong>{preacher_name}</strong>،</p>
        <p>نرجو أن يوفقك الله في دعوة الناس للإسلام وأن يجعله في ميزان حسناتك.</p>
        <p>لقد قامت <strong>{org_name}</strong> بإضافتك كداعية رسمي تابع لها في منصة <strong>إبلاغ</strong>.</p>
        <p>يمكنك الآن تسجيل الدخول لمنصة إبلاغ وبدء استقبال طلبات الدعوة ومتابعة الحالات.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>بيانات تسجيل الدخول الخاصة بك:</strong></p>
            <ul style="list-style-type: none; padding: 0;">
                <li>📧 <strong>البريد الإلكتروني:</strong> {to_email}</li>
                <li>🔑 <strong>كلمة المرور المؤقتة:</strong> {raw_password}</li>
            </ul>
        </div>
        
        <p><em>(يرجى تغيير كلمة المرور بمجرد تسجيل الدخول لأسباب أمنية)</em></p>
        
        <p><a href="https://eblagh.com/login" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">تسجيل الدخول الآن</a></p>
        
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 0.9em; color: #666;">إذا كانت لديك أي استفسارات، يمكنك التواصل معنا دائماً.</p>
        <p style="font-size: 0.9em; color: #666;">إدارة منصة إبلاغ</p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    from_addr = settings.SMTP_USERNAME # استخدم اليوزر بتاع الجيميل كالأصل
    msg["From"] = f"منصة إبلاغ <{from_addr}>"
    msg["To"] = to_email

    part = MIMEText(html_content, "html")
    msg.attach(part)

    print(f"DEBUG: Attempting to send welcome email to {to_email} via {settings.SMTP_SERVER}:{settings.SMTP_PORT}...")

    try:
        # Connect to SMTP server
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(from_addr, to_email, msg.as_string())
        
        print(f"DEBUG: Welcome email SUCCESSFULLY sent to {to_email}")
        logger.info(f"Welcome email successfully sent to {to_email}")
        return True
    except Exception as e:
        print(f"DEBUG: ERROR SENDING EMAIL: {e}")
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False
