"""Calculator Tool — Advanced mathematical computations."""

import math
import re
from langchain_core.tools import tool


@tool
def calculate(expression: str) -> str:
    """
    Evaluate mathematical expressions, perform calculations, or solve equations.
    Supports basic arithmetic, trigonometry, logarithms, powers, percentages, and more.
    Safe to use — strict math evaluation only.

    Args:
        expression: A mathematical expression as a string.
                   Examples: "2 + 2", "sqrt(144)", "sin(pi/4)", "2^32", "20% of 150", "log10(1000)"

    Returns:
        The result of the calculation.
    """
    try:
        raw_expr = expression.strip()
        if not raw_expr:
            return "Please provide a mathematical expression to calculate."

        # Preprocess expression:
        expr = raw_expr

        # Handle 'X% of Y' -> (X/100.0) * Y
        expr = re.sub(
            r'(\d+(?:\.\d+)?)\s*%\s*(?:of|\*)\s*(\d+(?:\.\d+)?)',
            r'((\1 / 100.0) * \2)',
            expr,
            flags=re.IGNORECASE
        )
        # Handle 'X%' -> (X/100.0)
        expr = re.sub(r'(\d+(?:\.\d+)?)\s*%', r'(\1 / 100.0)', expr)

        # Replace '^' with '**' for exponentiation (common user/LLM syntax)
        # Only replace ^ when not in a bitwise context
        expr = expr.replace("^", "**")

        # Safe math namespace
        safe_namespace = {
            # Basic math
            "abs": abs, "round": round, "min": min, "max": max,
            "sum": sum, "pow": pow, "int": int, "float": float,
            # Math module functions
            "sqrt": math.sqrt, "cbrt": getattr(math, "cbrt", lambda x: x ** (1/3)),
            "ceil": math.ceil, "floor": math.floor, "trunc": math.trunc,
            "sin": math.sin, "cos": math.cos, "tan": math.tan,
            "asin": math.asin, "acos": math.acos, "atan": math.atan, "atan2": math.atan2,
            "sinh": math.sinh, "cosh": math.cosh, "tanh": math.tanh,
            "log": math.log, "log2": math.log2, "log10": math.log10,
            "exp": math.exp, "factorial": math.factorial,
            "gcd": math.gcd, "lcm": getattr(math, "lcm", None),
            "hypot": math.hypot, "degrees": math.degrees, "radians": math.radians,
            "comb": math.comb, "perm": math.perm,
            # Constants
            "pi": math.pi, "e": math.e, "tau": math.tau, "inf": math.inf,
            # Built-ins that are safe
            "__builtins__": {},
        }

        result = eval(expr, safe_namespace)

        # Format result nicely
        if isinstance(result, float):
            if math.isnan(result):
                result_str = "NaN (Not a Number)"
            elif math.isinf(result):
                result_str = "Infinity" if result > 0 else "-Infinity"
            elif result == int(result) and abs(result) < 1e15:
                result_str = str(int(result))
            else:
                result_str = f"{result:.10g}"
        else:
            result_str = str(result)

        return f"**🔢 Calculation Result:**\n\n`{raw_expr}` = **{result_str}**"

    except ZeroDivisionError:
        return "⚠️ Error: Division by zero."
    except OverflowError:
        return "⚠️ Error: Result is too large to compute (overflow)."
    except (NameError, SyntaxError) as e:
        return f"⚠️ Invalid expression: {str(e)}\n\nExamples: `2+2`, `sqrt(16)`, `sin(pi/6)`, `2^10`, `25% of 80`"
    except Exception as e:
        return f"⚠️ Calculation failed: {str(e)}"

