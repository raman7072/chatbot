"""Web Search Tool — DuckDuckGo powered real-time search via ddgs."""

from langchain_core.tools import tool
try:
    from ddgs import DDGS
except ImportError:
    from duckduckgo_search import DDGS


@tool
def web_search(query: str) -> str:
    """
    Search the internet for real-time information using DuckDuckGo.
    Use this for current events, news, facts, or anything that requires up-to-date data.

    Args:
        query: The search query string.

    Returns:
        A formatted string with top search results.
    """
    try:
        clean_query = query.strip().strip("'\"")
        if not clean_query:
            return "Please provide a query to search for."

        results = []
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(clean_query, max_results=5))
        except Exception:
            # Fallback to news search if text search encounters rate limits
            try:
                with DDGS() as ddgs:
                    results = list(ddgs.news(clean_query, max_results=5))
            except Exception:
                results = []

        if not results:
            return f"No results found for the query: '{clean_query}'."

        formatted = f"**Web Search Results for:** `{clean_query}`\n\n"
        for i, r in enumerate(results, 1):
            title = r.get("title") or "Untitled Result"
            body = r.get("body") or r.get("snippet") or "No description available."
            href = r.get("href") or r.get("url") or ""
            formatted += f"**{i}. {title}**\n"
            formatted += f"   {body}\n"
            if href:
                formatted += f"   🔗 {href}\n"
            formatted += "\n"

        return formatted

    except Exception as e:
        return f"Web search failed: {str(e)}"

