"""Code Execution Tool — Safe Python sandbox."""

import sys
import io
import traceback
import ast
import builtins
from langchain_core.tools import tool

# Blocked built-in functions for safety
BLOCKED_BUILTINS = {
    "__import__", "open", "exec", "eval", "compile",
    "breakpoint", "input",
}

# Allowed imports (whitelist)
ALLOWED_IMPORTS = {
    "math", "random", "datetime", "json", "re", "string",
    "collections", "itertools", "functools", "operator",
    "statistics", "decimal", "fractions", "time",
    "hashlib", "base64", "urllib", "os.path",
    "textwrap", "difflib", "heapq", "bisect",
}


def _check_safety(code: str) -> tuple[bool, str]:
    """Check if code is safe to execute using AST analysis."""
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return False, f"Syntax error: {e}"

    for node in ast.walk(tree):
        # Block dangerous imports
        if isinstance(node, ast.Import):
            for alias in node.names:
                module = alias.name.split(".")[0]
                if module not in ALLOWED_IMPORTS and module not in {"math", "random", "datetime", "json", "re", "statistics", "collections", "itertools", "functools", "string", "decimal", "fractions", "time", "hashlib", "base64", "textwrap", "heapq", "bisect", "operator"}:
                    return False, f"Import of '{alias.name}' is not allowed for security reasons."

        if isinstance(node, ast.ImportFrom):
            module = (node.module or "").split(".")[0]
            if module in {"os", "sys", "subprocess", "shutil", "socket", "requests", "urllib3", "pathlib", "glob"}:
                return False, f"Import from '{module}' is not allowed for security reasons."

        # Block certain function calls
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in BLOCKED_BUILTINS:
                return False, f"Call to '{node.func.id}' is not allowed for security reasons."

    return True, ""


import contextlib
import concurrent.futures

@tool
def execute_python(code: str) -> str:
    """
    Execute Python code in a sandboxed environment and return the output.
    Use this for calculations, data analysis, generating content, solving problems, etc.
    Imports are limited to safe standard library modules (math, random, datetime, json, re, statistics, etc.)
    Execution has a 5-second safety timeout.

    Args:
        code: The Python code to execute.

    Returns:
        The stdout output, return value, or error message from the code execution.
    """
    # Safety check
    safe, reason = _check_safety(code)
    if not safe:
        return f"⚠️ Code execution blocked: {reason}"

    def _run_sandbox():
        captured = io.StringIO()
        safe_globals = {
            "__builtins__": {
                k: v for k, v in vars(builtins).items()
                if k not in BLOCKED_BUILTINS
            }
        }
        safe_locals = {}

        with contextlib.redirect_stdout(captured):
            compiled = compile(code, "<jarvis_sandbox>", "exec")
            exec(compiled, safe_globals, safe_locals)

        output = captured.getvalue()
        result = "**Python Execution Result:**\n\n"
        if output:
            result += f"```\n{output.strip()}\n```\n"
        else:
            try:
                lines = code.strip().split("\n")
                last_line = lines[-1].strip()
                if last_line and not last_line.startswith(("#", "import ", "from ", "def ", "class ", "return", "pass")):
                    last_val = eval(last_line, safe_globals, safe_locals)
                    if last_val is not None:
                        result += f"```\n{repr(last_val)}\n```\n"
                    else:
                        result += "*(Code executed successfully with no output)*"
                else:
                    result += "*(Code executed successfully with no output)*"
            except Exception:
                result += "*(Code executed successfully with no output)*"

        return result

    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_run_sandbox)
            return future.result(timeout=5.0)
    except concurrent.futures.TimeoutError:
        return "⚠️ Execution timed out: Code took longer than 5 seconds to run."
    except Exception:
        err = traceback.format_exc()
        clean_err = "\n".join(
            line for line in err.split("\n")
            if "<jarvis_sandbox>" in line or "Error" in line or "line" in line.lower()
        )
        return f"**Execution Error:**\n\n```\n{clean_err.strip() or err.strip()}\n```"

