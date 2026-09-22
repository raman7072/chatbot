"""JARVIS conversation memory management."""

from typing import List, Dict, Any
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage


def trim_messages_to_limit(
    messages: List[BaseMessage],
    max_messages: int = 20,
    keep_system: bool = True,
) -> List[BaseMessage]:
    """
    Trim conversation history to stay within token limits.
    Always preserves the system message and the most recent messages.
    """
    if len(messages) <= max_messages:
        return messages

    system_messages = [m for m in messages if isinstance(m, SystemMessage)] if keep_system else []
    non_system = [m for m in messages if not isinstance(m, SystemMessage)]

    # Keep the most recent non-system messages
    recent = non_system[-(max_messages - len(system_messages)):]
    return system_messages + recent


def format_conversation_for_display(messages: List[BaseMessage]) -> List[Dict[str, Any]]:
    """Convert LangChain messages to a serializable format for the frontend."""
    result = []
    for msg in messages:
        if isinstance(msg, HumanMessage):
            result.append({"role": "user", "content": msg.content})
        elif isinstance(msg, AIMessage):
            result.append({"role": "assistant", "content": msg.content})
    return result
