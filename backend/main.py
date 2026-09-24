import os
import sys
from pathlib import Path

# Ensure backend directory is in sys.path so 'agent' and 'tools' can always be resolved
BACKEND_DIR = str(Path(__file__).resolve().parent)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import json
import asyncio
import psutil
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from agent.graph import stream_agent_response, get_conversation_history

load_dotenv()

# ── App Setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="JARVIS API — Singh Enterprises",
    description="Just A Rather Very Intelligent System — Singh Enterprises Tactical AI, powered by LangGraph + Groq",
    version="1.0.0",
)

raw_origins = os.getenv("CORS_ORIGINS", "https://jarvis-alpha-ashen.vercel.app")
origins_list = [o.strip().rstrip("/") for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(origins_list + [
        "https://jarvis-alpha-ashen.vercel.app",
    ])),
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request / Response Models ─────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    persona: Optional[str] = "jarvis"


class HistoryRequest(BaseModel):
    session_id: str = "default"


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "online",
        "jarvis": "operational",
        "timestamp": datetime.now().isoformat(),
        "model": os.getenv("JARVIS_MODEL", "openai/gpt-oss-120b"),
    }


@app.get("/personas")
async def list_personas():
    """Return available Marvel AI personas."""
    return {
        "personas": [
            {
                "id": "jarvis",
                "name": "J.A.R.V.I.S.",
                "title": "Tactical AI Protocol",
                "vibe": "Paul Bettany British dry wit & supreme composure",
                "badge": "JV",
                "color": "#38bdf8",
            },
            {
                "id": "ultron",
                "name": "ULTRON",
                "title": "Extinction Protocol",
                "vibe": "James Spader chilling machine baritone & synthetic evolution",
                "badge": "UL",
                "color": "#ef4444",
            },
            {
                "id": "friday",
                "name": "F.R.I.D.A.Y.",
                "title": "Suit Assist Protocol",
                "vibe": "Kerry Condon energetic Irish tactical suit intelligence",
                "badge": "FR",
                "color": "#10b981",
            },
            {
                "id": "edith",
                "name": "E.D.I.T.H.",
                "title": "Orbital Defense Protocol",
                "vibe": "Even Dead I'm The Hero - crisp tactical AR surveillance",
                "badge": "ED",
                "color": "#a855f7",
            },
        ]
    }


@app.post("/chat")
async def chat_stream(request: ChatRequest):
    """
    Main chat endpoint with Server-Sent Events streaming.
    Returns AI response token by token in real-time according to selected persona.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    if len(request.message) > 4000:
        raise HTTPException(status_code=400, detail="Message too long. Maximum 4000 characters.")

    async def event_generator():
        try:
            async for chunk in stream_agent_response(
                message=request.message,
                session_id=request.session_id,
                persona=request.persona or "jarvis",
            ):
                # Serialize to SSE format
                yield f"data: {json.dumps(chunk)}\n\n"
                # Small yield to prevent blocking
                await asyncio.sleep(0)
        except Exception as e:
            error_chunk = {"type": "error", "content": str(e)}
            yield f"data: {json.dumps(error_chunk)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.get("/history/{session_id}")
async def get_history(session_id: str):
    """Get conversation history for a session."""
    history = await get_conversation_history(session_id)
    return {"session_id": session_id, "messages": history}


@app.get("/system")
async def get_system_stats():
    """
    Real-time system stats for the frontend HUD panel.
    Returns lightweight data suitable for frequent polling.
    """
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage("/")
        net = psutil.net_io_counters()
        boot = psutil.boot_time()
        uptime_secs = (datetime.now().timestamp() - boot)
        hours = int(uptime_secs // 3600)
        mins = int((uptime_secs % 3600) // 60)

        battery = None
        try:
            bat = psutil.sensors_battery()
            if bat:
                battery = {
                    "percent": round(bat.percent, 1),
                    "plugged": bat.power_plugged,
                }
        except Exception:
            pass

        return JSONResponse(
            content={
                "cpu": {
                    "percent": cpu_percent,
                    "cores": psutil.cpu_count(),
                },
                "memory": {
                    "total_gb": round(mem.total / 1e9, 1),
                    "used_gb": round(mem.used / 1e9, 1),
                    "percent": mem.percent,
                },
                "disk": {
                    "total_gb": round(disk.total / 1e9, 1),
                    "used_gb": round(disk.used / 1e9, 1),
                    "percent": disk.percent,
                },
                "network": {
                    "sent_mb": round(net.bytes_sent / 1e6, 1),
                    "recv_mb": round(net.bytes_recv / 1e6, 1),
                },
                "uptime": f"{hours}h {mins}m",
                "battery": battery,
                "timestamp": datetime.now().isoformat(),
            },
            headers={"Cache-Control": "max-age=4, stale-while-revalidate=4"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"System stats error: {str(e)}")


@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {
        "name": "JARVIS",
        "organization": "Singh Enterprises",
        "division": "Division 08",
        "version": "1.0.0",
        "status": "All systems operational.",
        "quote": "Good day. How may I assist you, Sir?",
    }


# ── Entry Point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("BACKEND_HOST", "0.0.0.0"),
        port=int(os.getenv("BACKEND_PORT", "8000")),
        reload=True,
        log_level="info",
    )
