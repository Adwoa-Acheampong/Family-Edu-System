"""Web Scraper Service for Curriculum Enrichment.

Fetches real-world case studies, industry articles, and supplementary 
resources to enrich generated curriculum modules.
"""

from __future__ import annotations

import logging
from typing import Optional

import httpx

logger = logging.getLogger("engine_room.scraper")


async def search_web_resources(
    topic: str,
    query_prefix: str = "case study",
    max_results: int = 5,
) -> list[dict[str, str]]:
    """Search for web resources related to a topic.
    
    Uses DuckDuckGo HTML search (no API key required) to find relevant resources.
    Returns a list of {title, url, summary} dictionaries.
    """
    search_query = f"{query_prefix} {topic} best practices 2024"
    resources = []
    
    try:
        # Using DuckDuckGo HTML search as a fallback
        # In production, you might use Google Custom Search API or similar
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://html.duckduckgo.com/html/",
                params={"q": search_query},
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                },
                timeout=10,
            )
            
            if resp.status_code == 200:
                # Parse basic results from HTML
                # This is a simplified parser - in production use BeautifulSoup
                html_content = resp.text
                
                # Extract result URLs and titles (simplified)
                import re
                result_pattern = r'<a class="result__a" href="(.*?)">(.*?)</a>'
                matches = re.findall(result_pattern, html_content, re.DOTALL)
                
                for url, title in matches[:max_results]:
                    # Clean up the URL (DuckDuckGo uses redirects)
                    clean_url = url.split("&udd=")[-1] if "&udd=" in url else url
                    resources.append({
                        "title": _clean_html(title),
                        "url": clean_url,
                        "summary": f"Resource about {topic}",
                    })
                    
    except Exception as e:
        logger.warning("Web search failed for topic '%s': %s", topic, e)
        # Return placeholder resources instead of failing
        resources = [
            {
                "title": f"Search for '{topic}' on industry sites",
                "url": f"https://www.google.com/search?q={topic.replace(' ', '+')}+case+study",
                "summary": "Click to search for current resources",
            }
        ]
    
    return resources


async def fetch_case_studies(topic: str, domain: Optional[str] = None) -> list[dict[str, str]]:
    """Fetch real-world case studies for a specific topic.
    
    Searches for practical examples and implementation stories.
    """
    query_parts = [topic]
    if domain:
        query_parts.append(domain)
    query_parts.extend(["real world example", "implementation", "lessons learned"])
    
    search_query = " ".join(query_parts)
    
    return await search_web_resources(
        topic=search_query,
        query_prefix="case study",
        max_results=3,
    )


async def enrich_topic_with_web_resources(
    topic_title: str,
    topic_description: str,
    domain: Optional[str] = None,
) -> dict:
    """Enrich a curriculum topic with web resources and case studies.
    
    Returns a dictionary with 'webResources' and 'caseStudies' keys.
    """
    # Fetch general web resources
    web_resources = await search_web_resources(
        topic=f"{topic_title} {topic_description[:50]}",
        query_prefix="tutorial guide",
        max_results=3,
    )
    
    # Fetch case studies
    case_studies = await fetch_case_studies(topic_title, domain)
    
    return {
        "webResources": web_resources,
        "caseStudies": case_studies,
    }


async def enrich_curriculum_modules(modules: list[dict]) -> list[dict]:
    """Enrich all modules in a curriculum with web resources.
    
    Iterates through modules and topics, adding web resources to each.
    """
    enriched_modules = []
    
    for module in modules:
        enriched_topics = []
        for topic in module.get("topics", []):
            # Add web enrichment to each topic
            enrichment = await enrich_topic_with_web_resources(
                topic_title=topic.get("title", ""),
                topic_description=topic.get("description", ""),
                domain=module.get("domain"),
            )
            
            # Merge enrichment into topic
            enriched_topic = {**topic, **enrichment}
            enriched_topics.append(enriched_topic)
        
        enriched_module = {**module, "topics": enriched_topics}
        enriched_modules.append(enriched_module)
    
    return enriched_modules


def _clean_html(text: str) -> str:
    """Remove HTML tags and decode entities from text."""
    import re
    # Remove HTML tags
    clean = re.sub(r'<[^>]+>', '', text)
    # Decode common HTML entities
    clean = clean.replace('&amp;', '&')
    clean = clean.replace('&lt;', '<')
    clean = clean.replace('&gt;', '>')
    clean = clean.replace('&quot;', '"')
    clean = clean.replace('&#39;', "'")
    # Normalize whitespace
    clean = ' '.join(clean.split())
    return clean


# Alternative: Google Custom Search API integration (if API key available)
async def search_with_google_custom_search(
    query: str,
    api_key: str,
    cx: str,
    max_results: int = 5,
) -> list[dict[str, str]]:
    """Use Google Custom Search API for better results (requires API key).
    
    Args:
        query: Search query
        api_key: Google API key
        cx: Custom Search Engine ID
        max_results: Maximum number of results to return
    """
    resources = []
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://www.googleapis.com/customsearch/v1",
                params={
                    "key": api_key,
                    "cx": cx,
                    "q": query,
                    "num": min(max_results, 10),
                },
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
            
            for item in data.get("items", []):
                resources.append({
                    "title": item.get("title", ""),
                    "url": item.get("link", ""),
                    "summary": item.get("snippet", ""),
                })
                
    except Exception as e:
        logger.warning("Google Custom Search failed: %s", e)
        raise
    
    return resources
