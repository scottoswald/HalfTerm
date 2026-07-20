import resend
import os
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()

class ContactRequest(BaseModel):
    name: str
    email: str
    message: str

@router.post("/contact")
def send_contact_email(request: ContactRequest):
    """
    Receives a contact form submission and sends an email to Scott
    via Resend. The reply-to is set to the sender's email address
    so Scott can reply directly from his email client.
    """
    try:
        resend.api_key = os.getenv("RESEND_API_KEY")

        resend.Emails.send({
            "from": "Halfterm Contact <onboarding@resend.dev>",
            "to": [os.getenv("CONTACT_EMAIL", "fallback@email.com")],
            "reply_to": request.email,
            "subject": f"Halfterm — New message from {request.name}",
            "html": f"""
                <h2>New message from Halfterm contact form</h2>
                <p><strong>Name:</strong> {request.name}</p>
                <p><strong>Email:</strong> {request.email}</p>
                <p><strong>Message:</strong></p>
                <p>{request.message}</p>
                <hr />
                <p style="color: #888; font-size: 12px;">
                    Sent via the Halfterm contact form at halfterm.up.railway.app
                </p>
            """
        })

        logger.info(f"Contact email sent from {request.email}")
        return {"success": True, "message": "Message sent successfully"}

    except Exception as e:
        logger.error(f"Failed to send contact email: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send message. Please try again.")
