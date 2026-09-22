# ⚡ J.A.R.V.I.S. — STARK INDUSTRIES TACTICAL AI

```
   █████████   █████████  ██████████  ███████████   █████  █████████ 
  ███░░░░░███ ░░███░░░░░  ░░███░░░░███░░███░░░░░███ ░░███  ███░░░░░███
 ░███    ░░░   ░███        ░███   ░░███░███    ░███  ░███ ░███    ░░░ 
 ░░█████████   ░█████████  ░███    ░███░██████████   ░███ ░░█████████ 
  ░░░░░░░░███  ░███░░░░░   ░███    ░███░███░░░░░███  ░███  ░░░░░░░░███
  ███    ░███  ░███        ░███    ███ ░███    ░███  ░███  ███    ░███
 ░░█████████   ░█████████  ██████████  █████   █████ █████░░█████████ 
  ░░░░░░░░░    ░░░░░░░░░  ░░░░░░░░░░  ░░░░░   ░░░░░ ░░░░░  ░░░░░░░░░  
               [ JUST A RATHER VERY INTELLIGENT SYSTEM ]
                   STARK INDUSTRIES · DIVISION 16
```

<div align="center">

[![Stark Industries](https://img.shields.io/badge/SECURITY%20CLEARANCE-LEVEL%209%20STARK-00d4ff?style=for-the-badge&logo=shield)](https://github.com)
[![Arc Reactor](https://img.shields.io/badge/ARC%20REACTOR-STABILIZED%20100%25-ffb800?style=for-the-badge&logo=electron)](https://github.com)
[![Neural Core](https://img.shields.io/badge/NEURAL%20CORE-LLAMA%203.3%2070B%20%40%20GROQ-f97316?style=for-the-badge&logo=groq)](https://groq.com)
[![Tactical Agent](https://img.shields.io/badge/AGENT%20RUNTIME-LANGGRAPH%20ReAct-00ffaa?style=for-the-badge&logo=langchain)](https://langchain-ai.github.io/langgraph/)
[![HUD Interface](https://img.shields.io/badge/HUD%20INTERFACE-REACT%2019%20+%20VITE-61dafb?style=for-the-badge&logo=react)](https://vitejs.dev)

> *"Good day. I am J.A.R.V.I.S. — Just A Rather Very Intelligent System. How may I assist you today, Sir?"*  
> — **J.A.R.V.I.S.**

</div>

---

## 🛰️ Mission Briefing

**J.A.R.V.I.S.** is a production-grade, Marvel-faithful AI operating assistant modeled directly after Tony Stark's legendary companion. Built with the **LangGraph ReAct architecture** and supercharged by **Groq's ultra-low-latency Llama 3.3 70B**, JARVIS blends dry British wit, infallible intelligence, and tactical computing into an immersive Iron Man Heads-Up Display (HUD).

Whether calibrating system diagnostics, executing sandboxed Python subroutines, retrieving global satellite intel, or tracking weather telemetry across worldwide coordinates, JARVIS stands ready at your command.

---

## 🛡️ Armor Protocol Matrix (HUD Themes)

JARVIS features customizable armor colorways with reactive HUD styling, ambient scanlines, and real-time palette shifting:

| Protocol | Designation | Palette | Mission Profile |
|---|---|---|---|
| **MARK IV** | *Arc Cyan* | `#00d4ff` | Standard Malibu Lab diagnostic display |
| **MARK VII** | *Gold Titanium & Hot Rod Red* | `#ffb800` | The Avengers assault & heavy engagement |
| **STEALTH OPS** | *Tactical Emerald* | `#00ffaa` | Night infiltration & low-observable radar ops |
| **MARK L** | *Nano-Tech Violet* | `#c060ff` | Bleeding Edge Infinity War nanoparticle HUD |
| **VERONICA** | *Hulkbuster Amber* | `#ff7700` | Orbital cage deployment & heavy industrial telemetry |

---

## ⚡ Tactical Capabilities & Subsystems

JARVIS is equipped with an integrated **11-tool armamentarium** configured through LangGraph:

| Module | Codename | Description & Tactical Command |
|---|---|---|
| 🌐 **Deep Orbital Recon** | `web_search` | Real-time global web search via DuckDuckGo.<br>*"JARVIS, search for the latest breakthroughs in fusion power."* |
| 📚 **Stark Archives** | `wikipedia_lookup` | Deep encyclopedia queries with contextual summarization.<br>*"Look up Tony Stark on Wikipedia and summarize his arc."* |
| ⚡ **Arc Reactor Telemetry** | `get_system_info` | Real-time hardware diagnostics: CPU cores, RAM, disk, & network bandwidth.<br>*"Run a full system diagnostic and report status."* |
| 🌤️ **Atmospheric Sat-Link** | `get_weather` | Real-time meteorological telemetry & forecasts via Open-Meteo.<br>*"Check the atmospheric conditions and weather in Tokyo."* |
| 🐍 **Repulsor Code Sandbox** | `execute_python` | Safe local Python execution sandbox for math, data analysis, and simulations.<br>*"Write and execute Python to calculate the first 100 Fibonacci numbers."* |
| 🗂️ **Stark Vault File Ops** | `file_read` / `file_write` / `list_files` | Secure filesystem access to browse, inspect, and draft local workspace files.<br>*"List files in the current directory and inspect main.py."* |
| 🧠 **Tactical Memory Bank** | `save_note` / `read_notes` / `delete_note` | Persistent tactical notes preserved locally across sessions in `jarvis_notes.json`.<br>*"Save a note: Arc Reactor running at 100% capacity."* |
| 🧮 **Trajectory Computer** | `calculate` | High-precision scientific computations and mathematical evaluations.<br>*"Calculate 2^16 + sqrt(144) * sin(pi/4)."* |
| 🎙️ **Acoustic Transceiver** | `Web Speech API` | Bi-directional hands-free vocal interface with British speech synthesis and HUD waveform.<br>*Voice recognition with mute & interrupt protocols.* |
| 🔊 **HUD Sound Synthesizer** | `Web Audio API` | Zero-latency procedural audio engine: Arc core hum, repulsor chirps, and telemetry blips. |

---

## 🏗️ Technical Architecture

```
                               ┌─────────────────────────────┐
                               │   MARK HUD (React 19 Vite)  │
                               │  Arc Reactor · Audio Engine │
                               │  Voice Transceiver (STT/TTS)│
                               └──────────────┬──────────────┘
                                              │ SSE Stream (HTTP/2)
                                              ▼
                               ┌─────────────────────────────┐
                               │   FastAPI Server (Port 8000)│
                               │   Session & Event Streaming │
                               └──────────────┬──────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
      ┌───────────────────────────────┐               ┌──────────────────────────────┐
      │     LangGraph ReAct Brain     │               │     11 Stark Tactical Tools  │
      │  Groq Llama 3.3 70B Versatile │◄─────────────►│ Web · Wiki · Code · Hardware │
      │  MemorySaver Session State    │               │ Weather · File System · Notes│
      └───────────────────────────────┘               └──────────────────────────────┘
```

### 📁 Directory Layout

```
jarvis/
├── .env                       ← Stark clearance tokens (Groq API Key)
├── start.sh                   ← One-click ignition sequence
├── main.py                    ← Root launcher script
├── requirements.txt           ← Python core dependencies
├── jarvis_notes.json          ← Long-term tactical memory storage
│
├── backend/                   ← Division 16 Engine
│   ├── main.py                ← FastAPI application with SSE streaming
│   ├── agent/
│   │   ├── graph.py           ← LangGraph ReAct agent compiler
│   │   ├── prompts.py         ← J.A.R.V.I.S. British persona & rules
│   │   └── memory.py          ← Checkpointer session state
│   └── tools/                 ← 11 modular tactical capabilities
│       ├── calculator.py      ← High-precision arithmetic
│       ├── code_exec.py       ← Sandboxed Python execution
│       ├── file_ops.py        ← Workspace file I/O
│       ├── notes.py           ← Persistent memory store
│       ├── system_monitor.py  ← psutil hardware telemetry
│       ├── weather.py         ← Open-Meteo sat-link
│       ├── web_search.py      ← DuckDuckGo intelligence
│       └── wikipedia_tool.py  ← Archive knowledge lookup
│
└── frontend/                  ← Mark Series HUD Interface
    ├── index.html             ← Iron Man HUD container
    ├── src/
    │   ├── App.jsx            ← Core HUD orchestrator
    │   ├── index.css          ← Stark cyan/gold glow & scanline optics
    │   ├── components/
    │   │   ├── ArcReactor.jsx     ← Interactive RT-IV Arc Core SVG
    │   │   ├── BootSequence.jsx   ← Animated Stark OS initialization
    │   │   ├── ChatInterface.jsx  ← Streaming telemetry communication
    │   │   ├── StatusBar.jsx      ← Time, protocol selector & indicators
    │   │   ├── SystemMonitor.jsx  ← Live CPU/RAM/Disk SVG gauges
    │   │   └── VoiceButton.jsx    ← Mic visualizer & speech controls
    │   └── utils/
    │       └── soundEffects.js    ← Procedural Web Audio synthesizer
```

---

## 🚀 Ignition Sequence (Quick Start)

### Step 1: Supply the Arc Reactor Fuel (Groq API Key)
J.A.R.V.I.S. requires an API key for Groq's high-speed LPU inference engine. Obtain one free of charge at [console.groq.com](https://console.groq.com).

Configure your `.env` in the project root:
```bash
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### Step 2: Run the Ignition Protocol
Execute the startup script to initialize the virtual environment, install dependencies, launch the FastAPI server, and deploy the Vite HUD:

```bash
chmod +x start.sh
./start.sh
```

Once initialized, direct your browser to:
```
http://localhost:5173
```

---

## 🛠️ Manual Development Bridge

If you prefer initializing subsystems individually:

### Subsystem Alpha: FastAPI Backend
```bash
# Activate Stark virtual environment
source venv/bin/activate

# Navigate and boot backend engine
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
* **API Gateway**: `http://localhost:8000`
* **Swagger Diagnostics**: `http://localhost:8000/docs`

### Subsystem Beta: Vite HUD Frontend
```bash
cd frontend
npm install
npm run dev
```
* **HUD Display**: `http://localhost:5173`

---

## 💬 Sample Tactical Orders

Try issuing these orders to JARVIS in the HUD or via voice command:

- 📊 **Diagnostics**: *"JARVIS, give me a full system breakdown on memory and processor usage."*
- 🔬 **Calculation**: *"Compute the orbital velocity of a satellite at 400km altitude."*
- 🌐 **Reconnaissance**: *"Search for the latest research papers on room-temperature superconductors."*
- 📝 **Intel Retention**: *"Take a note: Friday 1400 hours, Stark Expo presentation rehearsal."*
- 🐍 **Code Sandbox**: *"Write and run a Python script that benchmarks primes up to 10,000."*
- 🌦️ **Atmospheric**: *"Give me the weather and forecast for Malibu, California."*

---

## 🔐 Stark Security Protocols

- **Code Quarantine**: Python execution takes place within a filtered local sub-process with resource boundaries.
- **Local Sovereignty**: Conversation state and memory notes are maintained exclusively on your local workstation.
- **Zero-Cloud Audio**: Speech recognition and procedural HUD sound effects execute 100% on the client device via standard browser Web APIs.

---

## 📜 Stark Industries Disclaimer

> *"I told you. I don't want to join your super-secret boy band."*  
> — **Tony Stark**

*J.A.R.V.I.S. is an open-source homage inspired by the Marvel Cinematic Universe and Iron Man. Marvel, Iron Man, J.A.R.V.I.S., and Stark Industries are registered trademarks of Marvel Characters, Inc. and The Walt Disney Company.*

<div align="center">

**STARK INDUSTRIES · ADVANCED COMPUTING DIVISION**  
*All Systems Nominal. Good Day, Sir.*

</div>
