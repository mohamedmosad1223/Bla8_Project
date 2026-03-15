import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

class EmailService:
    @staticmethod
    def send_otp_email(to_email: str, otp: str):
        if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
            print("WARNING: SMTP credentials not set. Falling back to console log.")
            print(f"--- EMAIL TO: {to_email} ---")
            print(f"OTP: {otp}")
            return False

        subject = "رمز إعادة تعيين كلمة المرور - منصة بلاغ"
        body = f"""
        <html>
            <body dir="rtl">
                <h2>مرحباً،</h2>
                <p>لقد طلبت إعادة تعيين كلمة المرور الخاصة بك في منصة بلاغ.</p>
                <p>رمز التأكيد الخاص بك هو:</p>
                <h1 style="color: #2e7d32; font-size: 32px; letter-spacing: 5px;">{otp}</h1>
                <p>هذا الرمز صالح لمدة 15 دقيقة.</p>
                <p>إذا لم تطلب هذا الرمز، يرجى تجاهل هذا الإيميل.</p>
                <br>
                <p>مع تحيات فريق منصة بلاغ</p>
            </body>
        </html>
        """

        msg = MIMEMultipart()
        msg['From'] = f"منصة بلاغ <{settings.SMTP_USERNAME}>"
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body, 'html'))

        try:
            with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.send_message(msg)
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
