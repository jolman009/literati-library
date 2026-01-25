# main.py
import os

from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

# Initialize Sentry (must be first)
from config.sentry_config import (
    SentryTransaction,
    add_breadcrumb,
    initialize_sentry,
    report_error,
)

initialize_sentry()

from datetime import datetime, timezone
from typing import Annotated, Optional

import google.generativeai as genai
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Configure the Gemini API with your key
# Make sure you have a GOOGLE_API_KEY in your .env file
try:
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
except Exception as e:
    print(f"Error configuring Google AI: {e}")
    # Handle the case where the API key is not set
    # You might want to exit or use a mock service for local development


# This defines the expected input data for our API endpoint
class Note(BaseModel):
    text: Annotated[str, Field(min_length=1)]
    max_length: Optional[Annotated[int, Field(gt=0)]] = None


# Initialize our FastAPI application
app = FastAPI()

# CORS Configuration - use environment-based allowed origins
# In production, set ALLOWED_ORIGINS to your specific domains
ALLOWED_ORIGINS = (
    os.getenv("ALLOWED_ORIGINS", "").split(",")
    if os.getenv("ALLOWED_ORIGINS")
    else [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5000",
        "https://shelfquest.app",
        "https://www.shelfquest.app",
        "https://api.shelfquest.app",
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


@app.get("/")
def read_root():
    """A simple endpoint to check if the service is running."""
    return {"status": "AI Service is running"}


@app.get("/health")
def health_check():
    """Health check endpoint for Docker health checks."""
    try:
        # Basic health check - verify AI service is responsive
        return {
            "status": "healthy",
            "service": "ai-service",
            "version": "1.0.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


@app.post("/summarize-note")
async def summarize_note(note: Note):
    """
    Receives text from a note, sends it to the Gemini API for summarization,
    and returns the summary.
    """
    # Validation is enforced by Pydantic (422 on empty input)

    # Use Sentry transaction for performance monitoring
    with SentryTransaction("summarize_note", "ai.summarization"):
        try:
            # Add breadcrumb for tracking
            add_breadcrumb(
                message="Starting note summarization",
                data={
                    "text_length": len(note.text),
                    "truncated_text": (
                        note.text[:100] + "..." if len(note.text) > 100 else note.text
                    ),
                },
            )

            # The prompt for the AI
            prompt = f"Please provide a concise, one-paragraph summary of the following note:\n\n---\n{note.text}\n---"

            # Call the Gemini API with transaction monitoring
            with SentryTransaction("gemini_api_call", "ai.external_api"):
                # Create model lazily so tests can patch genai.GenerativeModel
                response = genai.GenerativeModel("gemini-2.0-flash").generate_content(
                    prompt
                )

            add_breadcrumb(
                message="Summary generated successfully",
                data={"summary_length": len(response.text) if response.text else 0},
            )

            # Return the generated summary
            return {"summary": response.text}

        except Exception as e:
            # Report error to Sentry with context
            report_error(
                e,
                {
                    "tags": {
                        "service": "ai-summarization",
                        "endpoint": "summarize_note",
                    },
                    "extra": {
                        "input_length": len(note.text),
                        "model": "gemini-2.0-flash",
                    },
                },
            )

            print(f"An error occurred during summarization: {e}")
            status = getattr(e, "code", None) or 500
            # Normalize unexpected codes
            if status not in (400, 401, 403, 404, 408, 413, 415, 422, 429, 500):
                status = 500
            raise HTTPException(
                status_code=status,
                detail=f"Failed to generate summary. Error: {str(e)}",
            )


# Explicit OPTIONS handler to ensure CORS preflight succeeds in tests/environments
@app.options("/summarize-note")
def summarize_note_options():
    return Response(
        status_code=200,
        headers={
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "POST, OPTIONS",
            "access-control-allow-headers": "*",
        },
    )
