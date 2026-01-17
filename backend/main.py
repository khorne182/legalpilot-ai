from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="LegalPilot AI Backend")

# CORS Configuration
origins = ["*"]  # In production, specify your frontend URL

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LegalAnalysis(BaseModel):
    objection: str
    authority: str
    oneLiner: str
    explanation: str

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "LegalPilot AI"}

from services.ai_service import transcribe_audio, analyze_legal_context

@app.post("/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    try:
        # 1. Transcribe
        transcript = await transcribe_audio(file)
        
        # 2. Analyze
        analysis = await analyze_legal_context(transcript)
        
        return {
            "transcript": transcript,
            "analysis": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
