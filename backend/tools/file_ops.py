"""File Operations Tools — Read, write, and list files."""

import os
import aiofiles
from pathlib import Path
from langchain_core.tools import tool

# Safety: restrict file operations to user's home dir and current dir
ALLOWED_BASE_DIRS = [
    str(Path.home()),
    str(Path.cwd()),
    "/tmp/jarvis",
]


def _is_safe_path(path: str) -> bool:
    """Check if a path is within allowed directories."""
    try:
        resolved = str(Path(path).resolve())
        return any(resolved.startswith(base) for base in ALLOWED_BASE_DIRS)
    except Exception:
        return False


@tool
def file_read(file_path: str) -> str:
    """
    Read the contents of a file from the filesystem.

    Args:
        file_path: The absolute or relative path to the file to read.

    Returns:
        The contents of the file as a string.
    """
    try:
        path = Path(file_path).expanduser().resolve()
        if not _is_safe_path(str(path)):
            return f"⚠️ Access denied: '{file_path}' is outside allowed directories."
        if not path.exists():
            return f"File not found: {file_path}"
        if not path.is_file():
            return f"'{file_path}' is not a file."
        if path.stat().st_size > 1_000_000:  # 1MB limit
            return f"File too large to read (> 1MB): {file_path}"

        content = path.read_text(encoding="utf-8", errors="replace")
        return f"**Contents of `{path.name}`:**\n\n```\n{content}\n```"
    except PermissionError:
        return f"Permission denied: Cannot read '{file_path}'"
    except Exception as e:
        return f"Error reading file: {str(e)}"


@tool
def file_write(file_path: str, content: str) -> str:
    """
    Write content to a file. Creates the file if it doesn't exist, overwrites if it does.

    Args:
        file_path: The path where the file should be written.
        content: The text content to write to the file.

    Returns:
        Confirmation message with the file path and size.
    """
    try:
        path = Path(file_path).expanduser().resolve()
        if not _is_safe_path(str(path)):
            return f"⚠️ Access denied: '{file_path}' is outside allowed directories."

        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        size = path.stat().st_size
        return f"✅ File written successfully: `{path}` ({size} bytes)"
    except PermissionError:
        return f"Permission denied: Cannot write to '{file_path}'"
    except Exception as e:
        return f"Error writing file: {str(e)}"


@tool
def list_files(directory_path: str = ".") -> str:
    """
    List all files and directories in a given path.

    Args:
        directory_path: The directory path to list. Defaults to current directory.

    Returns:
        A formatted directory listing.
    """
    try:
        path = Path(directory_path).expanduser().resolve()
        if not _is_safe_path(str(path)):
            return f"⚠️ Access denied: '{directory_path}' is outside allowed directories."
        if not path.exists():
            return f"Directory not found: {directory_path}"
        if not path.is_dir():
            return f"'{directory_path}' is not a directory."

        items = sorted(path.iterdir(), key=lambda x: (x.is_file(), x.name))
        if not items:
            return f"Directory `{path}` is empty."

        result = f"**Directory listing: `{path}`**\n\n"
        for item in items:
            if item.is_dir():
                result += f"📁 {item.name}/\n"
            else:
                size = item.stat().st_size
                size_str = f"{size:,} bytes" if size < 1024 else f"{size/1024:.1f} KB"
                result += f"📄 {item.name} ({size_str})\n"

        return result
    except PermissionError:
        return f"Permission denied: Cannot list '{directory_path}'"
    except Exception as e:
        return f"Error listing directory: {str(e)}"
