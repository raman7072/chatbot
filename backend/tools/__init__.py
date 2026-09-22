"""Tools package — exports all JARVIS tools."""

from .web_search import web_search
from .wikipedia_tool import wikipedia_lookup
from .file_ops import file_read, file_write, list_files
from .code_exec import execute_python
from .system_monitor import get_system_info
from .weather import get_weather
from .notes import save_note, read_notes, delete_note
from .calculator import calculate

ALL_TOOLS = [
    web_search,
    wikipedia_lookup,
    file_read,
    file_write,
    list_files,
    execute_python,
    get_system_info,
    get_weather,
    save_note,
    read_notes,
    delete_note,
    calculate,
]

__all__ = ["ALL_TOOLS"]

