# JARVIS — Marvel-Inspired AI Assistant

> *"Good day. I am J.A.R.V.I.S. — Just A Rather Very Intelligent System. How may I assist you today, Sir?"*

A fully functional, Marvel-faithful JARVIS AI assistant powered by **LangGraph + Groq (Llama 3.3 70B)** with an Iron Man HUD interface.

---

## 🚀 Quick Start

### 1. Set Your Groq API Key
Get a free key at [console.groq.com](https://console.groq.com), then edit `.env`:
```env
GROQ_API_KEY=gsk_your_key_here
```

### 2. Start JARVIS
```bash
chmod +x start.sh && ./start.sh
```

Then open **http://localhost:5173** in your browser.

---

## ✨ Capabilities

| Capability | Command Example |
|---|---|
| 🌐 **Web Search** | "Search for the latest AI news" |
| 📖 **Wikipedia** | "Look up quantum computing on Wikipedia" |
| 💻 **System Monitor** | "Run a full system diagnostic" |
| 🌤️ **Weather** | "What's the weather in Mumbai?" |
| 🐍 **Code Execution** | "Write Python to solve the Fibonacci sequence" |
| 📁 **File Operations** | "List files in my home directory" |
| 📝 **Notes/Memory** | "Save a note: meeting at 3pm" |
| 🔢 **Calculator** | "Calculate factorial(20) + sqrt(144)" |
| 🎙️ **Voice Input/Output** | Click the mic button |

---

## 🏗️ Architecture

```
jarvis/
├── .env                    ← API keys
├── start.sh                ← One-command startup
├── backend/
│   ├── main.py             ← FastAPI + SSE streaming
│   ├── agent/
│   │   ├── graph.py        ← LangGraph ReAct agent (Groq)
│   │   ├── prompts.py      ← JARVIS Marvel persona
│   │   └── memory.py       ← Conversation memory
│   ├── tools/              ← 11 tools
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.jsx
        ├── index.css       ← Iron Man HUD design system
        └── components/
            ├── ChatInterface.jsx    ← Main chat w/ streaming
            ├── BootSequence.jsx     ← Animated startup
            ├── StatusBar.jsx        ← Live clock & status
            ├── SystemMonitor.jsx    ← CPU/RAM/disk arcs
            └── VoiceButton.jsx      ← STT + TTS
```

---

## 🛠️ Manual Start (Development)

**Backend:**
```bash
source venv/bin/activate
cd backend
uvicorn main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs (Swagger UI)
```

**Frontend:**
```bash
cd frontend
npm run dev
# → http://localhost:5173
```

---

## 🔧 Tech Stack

- **LLM**: Groq Llama 3.3 70B (ultra-fast)
- **Agent**: LangGraph ReAct pattern
- **Backend**: FastAPI + SSE streaming
- **Frontend**: React + Vite (Iron Man HUD)
- **Voice**: Web Speech API (no external service)
- **Tools**: DuckDuckGo, Wikipedia, psutil, Open-Meteo

---

*Stark Industries · JARVIS v5.0 · All systems nominal.*
