"""
FastAPI Web Server – LLM Prompt Router

Provides:
  - POST /api/chat          → classify + route + respond
  - GET  /api/logs          → retrieve route_log.jsonl entries
  - GET  /api/test-messages → list of test messages for UI
  - GET  /                  → serve the web UI
"""

import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from router import process_message

app = FastAPI(
    title="LLM Prompt Router",
    description="Intent Classification & Expert Routing Service",
    version="1.0.0",
)

# CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

LOG_FILE = os.path.join(os.path.dirname(__file__), "route_log.jsonl")
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")


# ─── Request / Response Models ────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    intent: str
    confidence: float
    response: str


# ─── API Routes ──────────────────────────────────────────────────────────────

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Process a user message: classify intent, route to expert, return response."""
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        result = process_message(message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return ChatResponse(**result)


@app.get("/api/logs")
async def get_logs():
    """Return the last 100 route log entries (most recent first)."""
    if not os.path.exists(LOG_FILE):
        return JSONResponse(content=[])

    entries = []
    with open(LOG_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

    # Return newest first, capped at 100
    return JSONResponse(content=list(reversed(entries[-100:])))


@app.get("/api/test-messages")
async def get_test_messages():
    """Return the predefined test messages for the UI."""
    from test_questions import TEST_QUESTIONS
    return JSONResponse(content=TEST_QUESTIONS)


# ─── Static File Serving & SPA Fallback ──────────────────────────────────────

app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))
