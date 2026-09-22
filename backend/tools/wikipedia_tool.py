"""Wikipedia Lookup Tool — Modernized in-depth knowledge retrieval."""

import urllib.parse
import requests
from langchain_core.tools import tool

WIKI_SEARCH_URL = "https://en.wikipedia.org/w/api.php"
WIKI_SUMMARY_BASE = "https://en.wikipedia.org/api/rest_v1/page/summary/"
HEADERS = {
    "User-Agent": "JarvisAI-Assistant/2.0 (https://github.com/langgraph-jarvis; jarvis@assistant.ai) python-requests/2.32"
}


@tool
def wikipedia_lookup(topic: str) -> str:
    """
    Look up detailed information about any topic on Wikipedia.
    Best used for encyclopedic knowledge, historical events, scientific concepts, biographies, etc.

    Args:
        topic: The topic or subject to look up on Wikipedia.

    Returns:
        A comprehensive summary of the Wikipedia article on the topic.
    """
    try:
        clean_topic = topic.strip().strip("'\"")
        if not clean_topic:
            return "Please provide a topic to look up."

        # Step 1: Search Wikipedia for the closest article title
        params = {
            "action": "query",
            "list": "search",
            "srsearch": clean_topic,
            "format": "json",
            "srlimit": 3,
        }
        resp = requests.get(WIKI_SEARCH_URL, params=params, headers=HEADERS, timeout=10)
        if not resp.ok:
            return f"Wikipedia search temporarily unavailable (Status {resp.status_code})."

        data = resp.json()
        search_results = data.get("query", {}).get("search", [])
        if not search_results:
            return f"No Wikipedia articles found for '{clean_topic}'."

        matched_title = search_results[0].get("title", clean_topic)

        # Step 2: Fetch clean extract from Wikipedia REST summary API
        encoded_title = urllib.parse.quote(matched_title.replace(" ", "_"))
        summary_resp = requests.get(f"{WIKI_SUMMARY_BASE}{encoded_title}", headers=HEADERS, timeout=10)

        if summary_resp.ok:
            summary_data = summary_resp.json()
            title = summary_data.get("title", matched_title)
            description = summary_data.get("description", "")
            extract = summary_data.get("extract", "")
            page_url = summary_data.get("content_urls", {}).get("desktop", {}).get("page", "")

            result = f"**Wikipedia: {title}**"
            if description:
                result += f" *({description})*"
            result += f"\n\n{extract}\n\n"
            if page_url:
                result += f"📖 Full article: {page_url}"
            return result

        # Fallback to snippet from search if summary endpoint fails
        snippet = search_results[0].get("snippet", "").replace("<span class=\"searchmatch\">", "").replace("</span>", "")
        return f"**Wikipedia: {matched_title}**\n\n{snippet}...\n\n🔗 https://en.wikipedia.org/wiki/{encoded_title}"

    except requests.Timeout:
        return "Wikipedia request timed out. Please try again."
    except Exception as e:
        return f"Wikipedia lookup failed: {str(e)}"

