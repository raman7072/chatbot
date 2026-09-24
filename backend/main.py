import os
import sys
from pathlib import Path

BACKEND_DIR = str(Path(__file__).resolve().parent)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import json
import asyncio
import psutil
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from dotenv import load_dotenv

from agent.graph import stream_agent_response
from auth import (
    signup, login, get_user_by_id, update_user_profile, verify_token,
    save_session_to_history, get_user_history, get_session_messages, delete_session,
    clear_user_history, AuthError,
)

load_dotenv()

# ── App Setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="JARVIS API — Singh Enterprises",
    description="Just A Rather Very Intelligent System — Singh Enterprises Tactical AI, powered by LangGraph + Groq",
    version="2.0.0",
)

raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173")
origins_list = [o.strip().rstrip("/") for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "https://jarvis-alpha-ashen.vercel.app",
    ] + origins_list,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auth Helpers ──────────────────────────────────────────────────────────────

bearer_scheme = HTTPBearer(auto_error=False)

def get_current_user_id(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)) -> Optional[str]:
    """Extract user_id from Bearer JWT. Returns None if missing/invalid (no exception)."""
    if not credentials:
        return None
    return verify_token(credentials.credentials)

def require_user(user_id: Optional[str] = Depends(get_current_user_id)) -> str:
    """Strict auth dependency — raises 401 if not authenticated."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required.")
    return user_id


# ── Request / Response Models ─────────────────────────────────────────────────

class SignupRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str = ""

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    preferred_persona: Optional[str] = None
    preferred_theme: Optional[str] = None
    avatar_initials: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    persona: Optional[str] = "jarvis"

class SaveHistoryRequest(BaseModel):
    session_id: str
    messages: list
    persona: str = "jarvis"


# ── Auth Endpoints ────────────────────────────────────────────────────────────

@app.post("/auth/signup")
async def auth_signup(req: SignupRequest):
    """Register a new Singh Enterprises user."""
    try:
        user, token = signup(req.username, req.email, req.password, req.full_name)
        return {"user": user, "token": token, "message": "Welcome to Singh Enterprises, Commander."}
    except AuthError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login")
async def auth_login(req: LoginRequest):
    """Authenticate and receive a JWT token."""
    try:
        user, token = login(req.username_or_email, req.password)
        return {"user": user, "token": token, "message": f"Welcome back, {user['full_name']}."}
    except AuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.get("/auth/me")
async def auth_me(user_id: str = Depends(require_user)):
    """Return current authenticated user profile."""
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"user": user}

@app.patch("/auth/profile")
async def update_profile(req: UpdateProfileRequest, user_id: str = Depends(require_user)):
    """Update user profile preferences."""
    try:
        updates = {k: v for k, v in req.model_dump().items() if v is not None}
        user = update_user_profile(user_id, updates)
        return {"user": user, "message": "Profile updated successfully."}
    except AuthError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── History Endpoints ─────────────────────────────────────────────────────────

@app.post("/history/save")
async def history_save(req: SaveHistoryRequest, user_id: str = Depends(require_user)):
    """Save chat session to user's persistent history."""
    save_session_to_history(user_id, req.session_id, req.messages, req.persona)
    return {"message": "Session saved to tactical archive."}

@app.get("/history")
async def history_list(
    search: Optional[str] = None,
    persona: Optional[str] = None,
    user_id: str = Depends(require_user),
):
    """List all saved sessions for the current user with optional filters."""
    sessions = get_user_history(user_id, search=search, persona=persona)
    return {"sessions": sessions}

@app.delete("/history")
async def history_clear_all(user_id: str = Depends(require_user)):
    """Clear all saved sessions for the current user."""
    clear_user_history(user_id)
    return {"message": "All tactical archives cleared."}

@app.get("/history/{session_id}")
async def history_get(session_id: str, user_id: str = Depends(require_user)):
    """Get messages from a specific saved session."""
    messages = get_session_messages(user_id, session_id)
    return {"session_id": session_id, "messages": messages}

@app.get("/history/{session_id}/export")
async def history_export(
    session_id: str,
    format: str = "markdown",
    user_id: str = Depends(require_user),
):
    """Export mission session as formatted Markdown or JSON."""
    messages = get_session_messages(user_id, session_id)
    if not messages:
        raise HTTPException(status_code=404, detail="Session not found or empty.")
    user = get_user_by_id(user_id)
    user_name = (user.get("full_name") or user.get("username")) if user else "Commander"

    if format == "json":
        return JSONResponse(
            content={
                "session_id": session_id,
                "exported_at": datetime.now().isoformat(),
                "commander": user_name,
                "organization": "Singh Enterprises · Division 08",
                "messages": messages,
            },
            headers={"Content-Disposition": f'attachment; filename="jarvis_mission_{session_id}.json"'},
        )

    # Markdown export
    log = f"# ⚡ J.A.R.V.I.S. Mission Transcript — Singh Enterprises Division 08\n\n"
    log += f"- **Commander**: {user_name}\n"
    log += f"- **Session ID**: `{session_id}`\n"
    log += f"- **Export Timestamp**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}\n\n---\n\n"
    for m in messages:
        sender = "AI PROTOCOL" if m.get("role") == "assistant" else f"COMMANDER ({user_name.upper()})"
        log += f"### {sender}\n\n{m.get('content', '')}\n\n"
    return StreamingResponse(
        iter([log]),
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="jarvis_mission_{session_id}.md"'},
    )

@app.delete("/history/{session_id}")
async def history_delete(session_id: str, user_id: str = Depends(require_user)):
    """Delete a saved session from history."""
    deleted = delete_session(user_id, session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found.")
    return {"message": "Session deleted from tactical archive."}


# ── Core Endpoints ────────────────────────────────────────────────────────────

@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    return {
        "status": "online",
        "jarvis": "operational",
        "timestamp": datetime.now().isoformat(),
        "model": os.getenv("JARVIS_MODEL", "openai/gpt-oss-120b"),
        "auth": "enabled",
        "version": "2.0.0",
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
async def chat_stream(request: ChatRequest, user_id: Optional[str] = Depends(get_current_user_id)):
    """
    Main chat endpoint with Server-Sent Events streaming.
    Returns AI response token by token in real-time according to selected persona.
    Works for both authenticated and anonymous users.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    if len(request.message) > 4000:
        raise HTTPException(status_code=400, detail="Message too long. Maximum 4000 characters.")

    # Prefix session with user_id for isolation when authenticated
    session_id = f"{user_id}_{request.session_id}" if user_id else request.session_id

    # Retrieve user's name if authenticated
    user_name = None
    if user_id:
        user = get_user_by_id(user_id)
        if user:
            user_name = user.get("full_name") or user.get("username")

    async def event_generator():
        try:
            async for chunk in stream_agent_response(
                message=request.message,
                session_id=session_id,
                persona=request.persona or "jarvis",
                user_name=user_name,
            ):
                yield f"data: {json.dumps(chunk)}\n\n"
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


@app.get("/system")
async def get_system_stats():
    """Real-time system stats for the frontend HUD panel."""
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
                "cpu": {"percent": cpu_percent, "cores": psutil.cpu_count()},
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
        "version": "2.0.0",
        "status": "All systems operational.",
        "quote": "Good day. How may I assist you, Sir?",
        "auth": "JWT Bearer Token required for history & profile endpoints.",
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
