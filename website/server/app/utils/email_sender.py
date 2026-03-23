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
    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = to_email

    part = MIMEText(html_content, "html")
    msg.attach(part)

    try:
        # Connect to SMTP server
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        server.quit()
        logger.info(f"Welcome email successfully sent to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
