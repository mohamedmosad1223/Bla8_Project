"""
SMS Service — Sends SMS notifications via Twilio using Alpha Sender ID.
"""

import os
import logging
import threading
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

logger = logging.getLogger(__name__)

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN  = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_SENDER_ID   = os.getenv("TWILIO_SENDER_ID", "منصة بلاغ")


def _do_send(to_phone: str, body: str):
    """Internal function that runs in a background thread to avoid blocking the API."""
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            to=to_phone,
            from_=TWILIO_SENDER_ID,
            body=body,
        )
        logger.info(f"[SMS] Sent successfully to {to_phone} | SID: {message.sid}")
    except TwilioRestException as e:
        logger.error(f"[SMS] Twilio error sending to {to_phone}: {e}")
    except Exception as e:
        logger.error(f"[SMS] Unexpected error sending to {to_phone}: {e}")


def send_conversion_sms(to_phone: str, invited_name: str):
    """
    Sends a congratulatory SMS to the Muslim Caller when a person they
    invited converts to Islam.

    Args:
        to_phone:     The Muslim Caller's phone number (E.164 format, e.g. +96512345678).
        invited_name: The name of the person who converted.
    """
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        logger.warning("[SMS] Twilio credentials not configured — SMS skipped.")
        return

    if not to_phone:
        logger.warning("[SMS] No phone number provided — SMS skipped.")
        return

    name_part = f'"{invited_name}"' if invited_name else "الشخص الذي دعوته"

    body = (
        f"قام الشخص {name_part} الذي دعوته بالدخول للإسلام، "
        f"تهانيا لك وأعانك الله على مساعدة الناس في الهداية "
        f"وعلى مساعدتنا، واستمر في دعوة الآخرين للإسلام ووفقك الله."
    )

    # Fire and forget — runs in background so API response is not delayed
    thread = threading.Thread(target=_do_send, args=(to_phone, body), daemon=True)
    thread.start()
