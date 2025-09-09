# main.py
import os
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

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
    text: str

# Initialize our FastAPI application
app = FastAPI()

# Create the text generation model instance
model = genai.GenerativeModel('gemini-2.0-flash')

@app.get("/")
def read_root():
    """ A simple endpoint to check if the service is running. """
    return {"status": "AI Service is running"}

@app.get("/health")
def health_check():
    """ Health check endpoint for Docker health checks. """
    try:
        # Basic health check - verify AI service is responsive
        return {"status": "healthy", "service": "ai-service", "version": "1.0.0"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

@app.post("/summarize-note")
async def summarize_note(note: Note):
    """
    Receives text from a note, sends it to the Gemini API for summarization,
    and returns the summary.
    """
    if not note.text:
        raise HTTPException(status_code=400, detail="Text to summarize cannot be empty.")

    try:
        # The prompt for the AI
        prompt = f"Please provide a concise, one-paragraph summary of the following note:\n\n---\n{note.text}\n---"
        
        # Call the Gemini API
        response = model.generate_content(prompt)
        
        # Return the generated summary
        return {"summary": response.text}
        
    except Exception as e:
        print(f"An error occurred during summarization: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate summary. Error: {str(e)}")