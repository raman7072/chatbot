#!/bin/bash
# ============================================================
#  JARVIS — Startup Script
#  Starts both the FastAPI backend and Vite frontend
# ============================================================

set -e

JARVIS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$JARVIS_DIR/backend"
FRONTEND_DIR="$JARVIS_DIR/frontend"
VENV="$JARVIS_DIR/venv"

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "\n${CYAN}╔══════════════════════════════════════════════════╗"
echo -e "║         J.A.R.V.I.S. — Startup Sequence         ║"
echo -e "║         Just A Rather Very Intelligent System    ║"
echo -e "╚══════════════════════════════════════════════════╝${NC}\n"

# Check .env
if ! grep -q "GROQ_API_KEY=your_groq_api_key_here" "$JARVIS_DIR/.env" 2>/dev/null; then
    echo -e "${GREEN}[ OK ] .env configuration found${NC}"
else
    echo -e "${YELLOW}[ WARN ] Please set your GROQ_API_KEY in .env first!${NC}"
    echo -e "         Get a free key at: https://console.groq.com"
    echo ""
fi

# Activate venv
if [ -d "$VENV" ]; then
    source "$VENV/bin/activate"
    echo -e "${GREEN}[ OK ] Python virtual environment activated${NC}"
else
    echo -e "${RED}[ ERR ] Virtual environment not found. Run: python3 -m venv venv && pip install -r backend/requirements.txt${NC}"
    exit 1
fi

# Start backend
echo -e "${CYAN}[ >> ] Starting JARVIS backend on http://localhost:8000${NC}"
cd "$BACKEND_DIR"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

sleep 2

# Start frontend
echo -e "${CYAN}[ >> ] Starting JARVIS frontend on http://localhost:5173${NC}"
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

echo -e "\n${GREEN}╔══════════════════════════════════════════════════╗"
echo -e "║  JARVIS is ONLINE                                ║"
echo -e "║  Frontend: http://localhost:5173                 ║"
echo -e "║  Backend:  http://localhost:8000                 ║"
echo -e "║  API Docs: http://localhost:8000/docs            ║"
echo -e "╚══════════════════════════════════════════════════╝${NC}\n"

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo -e '\n${CYAN}JARVIS offline. Goodbye, Sir.${NC}'" EXIT

wait
