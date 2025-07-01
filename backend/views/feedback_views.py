import os
import uuid
import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

feedback_router = APIRouter(prefix="/api")


class FeedbackRequest(BaseModel):
    feedback: str


@feedback_router.post("/feedback")
async def submit_feedback(request: FeedbackRequest):
    """
    Submit user feedback and save it to a local file.
    """
    try:
        # Limit feedback to first 5000 characters
        feedback_text = request.feedback[:5000]

        # Generate unique ID for the feedback
        feedback_id = str(uuid.uuid4())

        # Create feedback directory if it doesn't exist
        feedback_dir = "feedback"
        os.makedirs(feedback_dir, exist_ok=True)

        # Create filename with timestamp and ID
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{feedback_id}_{timestamp}.txt"
        filepath = os.path.join(feedback_dir, filename)

        # Prepare feedback content with metadata
        feedback_content = f"""Feedback ID: {feedback_id}
Timestamp: {datetime.now().isoformat()}
Character count: {len(feedback_text)}
---
{feedback_text}
"""

        # Write feedback to file
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(feedback_content)

        logger.info(f"Feedback saved successfully: {filepath}")

        return {
            "success": True,
            "message": "Feedback submitted successfully",
            "feedback_id": feedback_id,
        }

    except Exception as e:
        logger.error(f"Error saving feedback: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save feedback")
