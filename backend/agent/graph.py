import os
from typing import AsyncGenerator, Any
from dotenv import load_dotenv

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
try:
    from langchain.agents import create_agent
    HAS_CREATE_AGENT = True
except ImportError:
    from langgraph.prebuilt import create_react_agent
    HAS_CREATE_AGENT = False

from langgraph.checkpoint.memory import MemorySaver

try:
    from .prompts import JARVIS_SYSTEM_PROMPT, get_persona_prompt
    from ..tools import ALL_TOOLS
except ImportError:
    # Running as top-level module (uvicorn main:app from backend/ dir)
    from agent.prompts import JARVIS_SYSTEM_PROMPT, get_persona_prompt
    from tools import ALL_TOOLS

load_dotenv()


def _create_llm() -> ChatGroq:
    """Create the Groq LLM instance."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError(
            "GROQ_API_KEY not set in environment. "
            "Please add it to your .env file."
        )
    return ChatGroq(
        api_key=api_key,
        model=os.getenv("JARVIS_MODEL", "openai/gpt-oss-120b"),
        temperature=float(os.getenv("JARVIS_TEMPERATURE", "0.7")),
        streaming=True,
    )


# Agent registry with persistent in-memory checkpointer
_llm = None
_agents = {}
_memory = MemorySaver()


def get_agent(persona: str = "jarvis"):
    """Get or create agent instance for specified persona."""
    global _llm, _agents
    persona_key = (persona or "jarvis").lower()
    if persona_key not in _agents:
        if _llm is None:
            _llm = _create_llm()
        system_prompt = get_persona_prompt(persona_key)
        if HAS_CREATE_AGENT:
            _agents[persona_key] = create_agent(
                model=_llm,
                tools=ALL_TOOLS,
                checkpointer=_memory,
                system_prompt=system_prompt,
            )
        else:
            _agents[persona_key] = create_react_agent(
                model=_llm,
                tools=ALL_TOOLS,
                checkpointer=_memory,
                prompt=system_prompt,
            )
    return _agents[persona_key]


async def stream_agent_response(
    message: str,
    session_id: str = "default",
    persona: str = "jarvis",
) -> AsyncGenerator[dict[str, Any], None]:
    """
    Stream AI response token by token for the requested persona.

    Yields dicts with keys:
      - type: "token" | "tool_start" | "tool_end" | "error" | "done"
      - content: the token text or tool name / result
      - tool: name of tool (for tool events)
      - input / output: metadata for tool call
    """
    agent = get_agent(persona)
    config = {
        "configurable": {"thread_id": session_id},
        "recursion_limit": 25,
    }
    input_messages = {"messages": [HumanMessage(content=message)]}

    try:
        async for event in agent.astream_events(
            input_messages,
            config=config,
            version="v2",
        ):
            kind = event.get("event", "")
            name = event.get("name", "")
            data = event.get("data", {})

            # Stream AI text tokens
            if kind == "on_chat_model_stream":
                chunk = data.get("chunk")
                if chunk and hasattr(chunk, "content") and chunk.content:
                    yield {"type": "token", "content": chunk.content}

            # Tool call started
            elif kind == "on_tool_start":
                tool_input = data.get("input", {})
                if isinstance(tool_input, dict) and tool_input:
                    preview = ", ".join(f"{k}={repr(v)[:50]}" for k, v in tool_input.items())
                else:
                    preview = str(tool_input)[:80]

                yield {
                    "type": "tool_start",
                    "tool": name,
                    "content": f"Executing {name}: {preview}",
                    "input": preview,
                }

            # Tool call finished
            elif kind == "on_tool_end":
                output = data.get("output", "")
                if hasattr(output, "content"):
                    output_str = str(output.content)
                else:
                    output_str = str(output)

                clean_preview = output_str.strip()
                if len(clean_preview) > 300:
                    clean_preview = clean_preview[:300] + "..."

                yield {
                    "type": "tool_end",
                    "tool": name,
                    "content": clean_preview,
                    "full_output": output_str[:1500],
                }

        yield {"type": "done", "content": ""}

    except Exception as e:
        yield {"type": "error", "content": f"Agent error: {str(e)}"}


async def get_conversation_history(session_id: str = "default") -> list[dict]:
    """Get conversation history for a session."""
    try:
        agent = get_agent()
        config = {"configurable": {"thread_id": session_id}}
        state = await agent.aget_state(config)
        messages = state.values.get("messages", [])
        history = []
        for msg in messages:
            if isinstance(msg, HumanMessage):
                history.append({"role": "user", "content": msg.content})
            elif isinstance(msg, AIMessage) and msg.content:
                history.append({"role": "assistant", "content": msg.content})
        return history
    except Exception:
        return []


def clear_conversation(session_id: str = "default") -> bool:
    """Clear conversation history for a session."""
    return True

