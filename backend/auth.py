"""
auth.py — Simple JWT-based authentication for JARVIS Singh Enterprises.
Uses bcrypt for password hashing and stores users in a JSON file (no DB dependency).
"""

import os
import json
import time
import hmac
import hashlib
import base64
import secrets
from pathlib import Path
from typing import Optional

# ── Storage ──────────────────────────────────────────────────────────────────

DATA_DIR = Path(__file__).resolve().parent / "data"
USERS_FILE = DATA_DIR / "users.json"
HISTORY_FILE = DATA_DIR / "history.json"

DATA_DIR.mkdir(exist_ok=True)

_cached_users: Optional[dict] = None
_cached_history: Optional[dict] = None

def _load_users() -> dict:
    global _cached_users
    if _cached_users is not None:
        return _cached_users
    if USERS_FILE.exists():
        try:
            _cached_users = json.loads(USERS_FILE.read_text())
        except Exception:
            _cached_users = {}
    else:
        _cached_users = {}
    _seed_demo_user(_cached_users)
    return _cached_users

def _save_users(users: dict):
    global _cached_users
    _cached_users = users
    USERS_FILE.write_text(json.dumps(users, indent=2))

def _load_history() -> dict:
    global _cached_history
    if _cached_history is not None:
        return _cached_history
    if HISTORY_FILE.exists():
        try:
            _cached_history = json.loads(HISTORY_FILE.read_text())
        except Exception:
            _cached_history = {}
    else:
        _cached_history = {}
    return _cached_history

def _save_history(history: dict):
    global _cached_history
    _cached_history = history
    HISTORY_FILE.write_text(json.dumps(history, indent=2))

def _seed_demo_user(users: dict):
    demo_id = "demo_stark_id"
    if demo_id not in users and not any(u.get("username") == "demo" for u in users.values()):
        users[demo_id] = {
            "id": demo_id,
            "username": "demo",
            "email": "demo@singhenterprises.com",
            "full_name": "Tony Stark",
            "password_hash": _hash_password("password123"),
            "avatar_initials": "TS",
            "preferred_persona": "jarvis",
            "preferred_theme": "mark-iv",
            "created_at": time.time(),
            "last_login": time.time(),
        }
        USERS_FILE.write_text(json.dumps(users, indent=2))


# ── Password Hashing (pure-stdlib PBKDF2) ────────────────────────────────────

def _hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 260000)
    return f"{salt}:{base64.b64encode(dk).decode()}"

def _verify_password(password: str, hashed: str) -> bool:
    try:
        salt, b64_dk = hashed.split(":", 1)
        dk_stored = base64.b64decode(b64_dk)
        dk_attempt = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 260000)
        return hmac.compare_digest(dk_stored, dk_attempt)
    except Exception:
        return False


# ── JWT (simple HS256 implementation, no external library) ───────────────────

_SECRET = os.getenv("JWT_SECRET", "singh-enterprises-jarvis-secret-2024-div08")
_TOKEN_TTL = int(os.getenv("JWT_TTL_HOURS", "168")) * 3600  # 7 days default

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _b64url_decode(s: str) -> bytes:
    pad = 4 - len(s) % 4
    return base64.urlsafe_b64decode(s + "=" * (pad % 4))

def create_token(user_id: str) -> str:
    header = _b64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = _b64url_encode(json.dumps({
        "sub": user_id,
        "iat": int(time.time()),
        "exp": int(time.time()) + _TOKEN_TTL,
    }).encode())
    sig_input = f"{header}.{payload}".encode()
    sig = hmac.new(_SECRET.encode(), sig_input, hashlib.sha256).digest()
    return f"{header}.{payload}.{_b64url_encode(sig)}"

def verify_token(token: str) -> Optional[str]:
    """Returns user_id if valid, else None."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header, payload, sig = parts
        sig_input = f"{header}.{payload}".encode()
        expected_sig = hmac.new(_SECRET.encode(), sig_input, hashlib.sha256).digest()
        if not hmac.compare_digest(_b64url_decode(sig), expected_sig):
            return None
        data = json.loads(_b64url_decode(payload))
        if data.get("exp", 0) < time.time():
            return None
        return data.get("sub")
    except Exception:
        return None


# ── User CRUD ─────────────────────────────────────────────────────────────────

class AuthError(Exception):
    pass

def signup(username: str, email: str, password: str, full_name: str = "") -> dict:
    users = _load_users()
    username = username.strip().lower()
    email = email.strip().lower()

    if len(username) < 3:
        raise AuthError("Username must be at least 3 characters.")
    if len(password) < 6:
        raise AuthError("Password must be at least 6 characters.")
    if "@" not in email:
        raise AuthError("Invalid email address.")

    # Check for existing username or email
    for uid, u in users.items():
        if u["username"] == username:
            raise AuthError("Username already taken.")
        if u["email"] == email:
            raise AuthError("Email already registered.")

    user_id = secrets.token_hex(12)
    now = time.time()
    users[user_id] = {
        "id": user_id,
        "username": username,
        "email": email,
        "full_name": full_name.strip() or username,
        "password_hash": _hash_password(password),
        "avatar_initials": (full_name.strip() or username)[:2].upper(),
        "preferred_persona": "jarvis",
        "preferred_theme": "mark-iv",
        "created_at": now,
        "last_login": now,
    }
    _save_users(users)
    token = create_token(user_id)
    return _safe_user(users[user_id]), token

def login(username_or_email: str, password: str) -> tuple[dict, str]:
    users = _load_users()
    query = username_or_email.strip().lower()

    matched = None
    matched_id = None
    for uid, u in users.items():
        if u["username"] == query or u["email"] == query:
            matched = u
            matched_id = uid
            break

    if not matched or not _verify_password(password, matched["password_hash"]):
        raise AuthError("Invalid credentials.")

    # Update last login
    users[matched_id]["last_login"] = time.time()
    _save_users(users)
    token = create_token(matched_id)
    return _safe_user(matched), token

def get_user_by_id(user_id: str) -> Optional[dict]:
    users = _load_users()
    u = users.get(user_id)
    if u:
        return _safe_user(u)
    return None

def update_user_profile(user_id: str, updates: dict) -> dict:
    users = _load_users()
    u = users.get(user_id)
    if not u:
        raise AuthError("User not found.")

    allowed = {"full_name", "preferred_persona", "preferred_theme", "avatar_initials"}
    for key, val in updates.items():
        if key in allowed:
            u[key] = val

    _save_users(users)
    return _safe_user(u)

def _safe_user(u: dict) -> dict:
    """Strip sensitive fields before returning to client."""
    return {k: v for k, v in u.items() if k != "password_hash"}


# ── Chat History per User ────────────────────────────────────────────────────

def save_session_to_history(user_id: str, session_id: str, messages: list, persona: str = "jarvis"):
    history = _load_history()
    user_history = history.get(user_id, [])

    # Update if session already exists
    for i, sess in enumerate(user_history):
        if sess["session_id"] == session_id:
            user_history[i]["messages"] = messages
            user_history[i]["updated_at"] = time.time()
            user_history[i]["persona"] = persona
            history[user_id] = user_history
            _save_history(history)
            return

    # New session
    user_history.insert(0, {
        "session_id": session_id,
        "persona": persona,
        "title": _extract_title(messages),
        "messages": messages,
        "created_at": time.time(),
        "updated_at": time.time(),
    })

    # Keep latest 50 sessions per user
    history[user_id] = user_history[:50]
    _save_history(history)

def get_user_history(user_id: str, search: Optional[str] = None, persona: Optional[str] = None) -> list:
    history = _load_history()
    sessions = history.get(user_id, [])
    if search:
        q = search.lower().strip()
        sessions = [s for s in sessions if q in s.get("title", "").lower()]
    if persona:
        p = persona.lower().strip()
        sessions = [s for s in sessions if s.get("persona", "").lower() == p]
    # Return list without full messages for index (lighter payload)
    return [
        {
            "session_id": s["session_id"],
            "title": s["title"],
            "persona": s["persona"],
            "created_at": s["created_at"],
            "updated_at": s["updated_at"],
            "message_count": len(s.get("messages", [])),
        }
        for s in sessions
    ]

def get_session_messages(user_id: str, session_id: str) -> list:
    history = _load_history()
    user_history = history.get(user_id, [])
    for sess in user_history:
        if sess["session_id"] == session_id:
            return sess.get("messages", [])
    return []

def delete_session(user_id: str, session_id: str) -> bool:
    history = _load_history()
    user_history = history.get(user_id, [])
    new_history = [s for s in user_history if s["session_id"] != session_id]
    if len(new_history) == len(user_history):
        return False
    history[user_id] = new_history
    _save_history(history)
    return True

def clear_user_history(user_id: str) -> bool:
    history = _load_history()
    if user_id in history:
        history[user_id] = []
        _save_history(history)
        return True
    return False

def _extract_title(messages: list) -> str:
    for m in messages:
        if m.get("role") == "user":
            content = m.get("content", "")[:60]
            return content if content else "Untitled Session"
    return "Untitled Session"
