"""Notes Tool — Persistent memory for JARVIS."""

import json
import os
from datetime import datetime
from pathlib import Path
from langchain_core.tools import tool

# Ensure persistent path resolves cleanly regardless of working directory
_DEFAULT_NOTES = Path(__file__).resolve().parent.parent.parent / "jarvis_notes.json"
NOTES_FILE = os.getenv("NOTES_FILE", str(_DEFAULT_NOTES))
if not Path(NOTES_FILE).is_absolute():
    NOTES_FILE = str(Path(__file__).resolve().parent.parent.parent / NOTES_FILE)


def _load_notes() -> dict:
    """Load notes from the JSON file."""
    try:
        path = Path(NOTES_FILE)
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
        return {"notes": []}
    except Exception:
        return {"notes": []}


def _save_notes(data: dict) -> None:
    """Save notes to the JSON file."""
    path = Path(NOTES_FILE)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


@tool
def save_note(title: str, content: str, tags: str = "") -> str:
    """
    Save an important piece of information to JARVIS's persistent memory/notes.
    Use this to remember things the user asks you to, important facts, or task outputs.

    Args:
        title: A short descriptive title for the note.
        content: The content to save.
        tags: Optional comma-separated tags for organization (e.g., "work,important,todo")

    Returns:
        Confirmation that the note was saved.
    """
    try:
        data = _load_notes()
        note = {
            "id": len(data["notes"]) + 1,
            "title": title,
            "content": content,
            "tags": [t.strip() for t in tags.split(",") if t.strip()],
            "created_at": datetime.now().isoformat(),
        }
        data["notes"].append(note)
        _save_notes(data)
        return f"✅ Note saved: **'{title}'** (ID: {note['id']})\nTags: {', '.join(note['tags']) if note['tags'] else 'None'}"
    except Exception as e:
        return f"Failed to save note: {str(e)}"


@tool
def read_notes(search_term: str = "") -> str:
    """
    Retrieve notes from JARVIS's persistent memory.
    Can search by title, content, or tags, or retrieve all notes.

    Args:
        search_term: Optional search term to filter notes. Leave empty to get all notes.

    Returns:
        Formatted list of matching notes.
    """
    try:
        data = _load_notes()
        notes = data.get("notes", [])

        if not notes:
            return "📝 No notes saved yet. Use the save_note tool to remember things."

        if search_term:
            term = search_term.lower()
            notes = [
                n for n in notes
                if term in n["title"].lower()
                or term in n["content"].lower()
                or any(term in tag.lower() for tag in n.get("tags", []))
            ]
            if not notes:
                return f"No notes found matching '{search_term}'."

        result = f"**📝 JARVIS Notes** ({len(notes)} found)\n\n"
        for note in notes[-20:]:  # Show most recent 20
            created = note.get("created_at", "")[:10]
            tags = f" `{'` `'.join(note['tags'])}`" if note.get("tags") else ""
            result += f"### [{note['id']}] {note['title']}{tags}\n"
            result += f"*{created}*\n\n"
            result += f"{note['content']}\n\n"
            result += "---\n\n"

        return result
    except Exception as e:
        return f"Failed to read notes: {str(e)}"


@tool
def delete_note(note_id: int) -> str:
    """
    Delete a note by its ID from JARVIS's persistent memory.

    Args:
        note_id: The integer ID of the note to delete.

    Returns:
        Confirmation message.
    """
    try:
        data = _load_notes()
        notes = data.get("notes", [])
        initial_len = len(notes)
        notes = [n for n in notes if n.get("id") != note_id]

        if len(notes) == initial_len:
            return f"⚠️ Note with ID {note_id} not found."

        data["notes"] = notes
        _save_notes(data)
        return f"🗑️ Note ID {note_id} has been deleted successfully."
    except Exception as e:
        return f"Failed to delete note: {str(e)}"

