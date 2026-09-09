"""Parallel Search tools. Judges: this module imports and calls parallel-web at runtime."""

from __future__ import annotations

from typing import Any

from parallel import Parallel

from app.config import parallel_api_key


def _client() -> Parallel:
    key = parallel_api_key()
    if not key:
        raise RuntimeError("PARALLEL_API_KEY is missing. Copy .env.example to .env.")
    return Parallel(api_key=key)


def _run_search(objective: str, search_queries: list[str]) -> dict[str, Any]:
    queries = [q.strip() for q in search_queries if q and q.strip()]
    if not queries:
        queries = [objective[:120]]
    client = _client()
    try:
        search = client.search(
            objective=objective,
            search_queries=queries[:5],
            mode="fast",
        )
    except TypeError:
        search = client.search(
            objective=objective,
            search_queries=queries[:5],
        )
    hits: list[dict[str, Any]] = []
    for result in list(getattr(search, "results", []) or [])[:8]:
        excerpts = list(getattr(result, "excerpts", None) or [])[:2]
        hits.append(
            {
                "title": getattr(result, "title", "") or "",
                "url": getattr(result, "url", "") or "",
                "publish_date": getattr(result, "publish_date", None),
                "excerpts": excerpts,
            }
        )
    return {
        "search_id": getattr(search, "search_id", None),
        "hit_count": len(hits),
        "hits": hits,
    }


def search_location_risks(objective: str, query_one: str, query_two: str = "") -> dict[str, Any]:
    """Search the live web for location, permit, and neighborhood issues on this shoot.

    Args:
        objective: What the production office needs to know about this location tonight.
        query_one: First concrete search query (place name + filming, news, permits).
        query_two: Optional second query (other productions, closures, protests).
    """
    queries = [query_one, query_two]
    return _run_search(objective, queries)


def search_talent_news(objective: str, query_one: str, query_two: str = "") -> dict[str, Any]:
    """Search the live web for public news that could affect cast or a name on the sheet.

    Args:
        objective: Why this name matters to tomorrow's shoot.
        query_one: First news query.
        query_two: Optional second query.
    """
    return _run_search(objective, [query_one, query_two])


def search_music_clearance(objective: str, query_one: str, query_two: str = "") -> dict[str, Any]:
    """Search the live web for music cue / needle-drop clearance context.

    Args:
        objective: What legal or music needs to know about this cue.
        query_one: First query (song, composer, public domain, publisher).
        query_two: Optional second query.
    """
    return _run_search(objective, [query_one, query_two])


def search_competing_productions(objective: str, query_one: str, query_two: str = "") -> dict[str, Any]:
    """Search for other productions, lockups, or filming at the same place or city.

    Args:
        objective: Whether another unit already owns this block or news cycle.
        query_one: First query.
        query_two: Optional second query.
    """
    return _run_search(objective, [query_one, query_two])
