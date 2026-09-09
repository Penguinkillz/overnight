"""Gemini agent via Google ADK. Parallel tools are invoked at runtime."""

from __future__ import annotations

import json
import re
from typing import Any

from google import genai
from google.adk.agents.llm_agent import Agent
from google.adk.runners import InMemoryRunner
from google.genai import types

from app.config import gemini_model, google_api_key
from app.tools import (
    search_competing_productions,
    search_location_risks,
    search_music_clearance,
    search_talent_news,
)

INSTRUCTION = """
You are Overnight, the night desk in a film production office.

A coordinator gives you tomorrow's call sheet. Your job is to research it
on the live web and write a one-page risk brief they can hand the 1st AD
before crew call.

You MUST call the search tools. Do not invent news, URLs, or legal advice.
If a search comes back thin, say so. Use at least three tools on a full sheet
(location, then talent or competing productions, then music if a cue exists).

After the searches, reply with ONLY a JSON object (no markdown fences):
{
  "headline": "short desk headline",
  "verdict": "proceed" | "watch" | "ask_legal",
  "summary": "8-12 sentences, production-office voice, cite what you found",
  "flags": [
    {
      "severity": "red" | "amber" | "green",
      "title": "short flag",
      "detail": "what we know and what to do",
      "sources": [{"title": "source title", "url": "https://..."}]
    }
  ],
  "sources": [{"title": "source title", "url": "https://..."}]
}

verdict:
- proceed: nothing blocking cameras
- watch: 1st AD should keep an eye on it
- ask_legal: stop and talk to legal / music / location before lockup
""".strip()


def _parse_brief(text: str) -> dict[str, Any]:
    raw = (text or "").strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        raw = match.group(0)
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError("Brief was not an object")
    data.setdefault("headline", "Overnight brief")
    data.setdefault("verdict", "watch")
    data.setdefault("summary", raw[:1200])
    data.setdefault("flags", [])
    data.setdefault("sources", [])
    return data


def _part_function_call(part: Any) -> Any:
    fc = getattr(part, "function_call", None)
    if fc:
        return fc
    return None


async def _run_adk(user_text: str) -> dict[str, Any]:
    root_agent = Agent(
        name="overnight_desk",
        model=gemini_model(),
        description="Production-office overnight research desk.",
        instruction=INSTRUCTION,
        tools=[
            search_location_risks,
            search_talent_news,
            search_music_clearance,
            search_competing_productions,
        ],
    )

    try:
        runner = InMemoryRunner(agent=root_agent, app_name="overnight")
    except TypeError:
        runner = InMemoryRunner(agent=root_agent)

    session = await runner.session_service.create_session(
        app_name=getattr(runner, "app_name", "overnight") or "overnight",
        user_id="coordinator",
    )

    steps: list[dict[str, Any]] = []
    chunks: list[str] = []

    async for event in runner.run_async(
        user_id="coordinator",
        session_id=session.id,
        new_message=types.Content(
            role="user",
            parts=[types.Part.from_text(text=user_text)],
        ),
    ):
        content = getattr(event, "content", None)
        parts = getattr(content, "parts", None) if content is not None else None
        if not parts:
            continue
        for part in parts:
            fc = _part_function_call(part)
            if fc is not None:
                args = getattr(fc, "args", None) or {}
                if hasattr(args, "items"):
                    args = dict(args)
                steps.append(
                    {
                        "tool": getattr(fc, "name", "search"),
                        "args": args,
                    }
                )
            text = getattr(part, "text", None)
            if text:
                chunks.append(text)

    return {"steps": steps, "text": "\n".join(chunks).strip()}


def _run_genai(user_text: str) -> dict[str, Any]:
    client = genai.Client(api_key=google_api_key())
    response = client.models.generate_content(
        model=gemini_model(),
        contents=user_text,
        config=types.GenerateContentConfig(
            system_instruction=INSTRUCTION,
            tools=[
                search_location_risks,
                search_talent_news,
                search_music_clearance,
                search_competing_productions,
            ],
        ),
    )
    steps: list[dict[str, Any]] = []
    history = getattr(response, "automatic_function_calling_history", None) or []
    for content in history:
        for part in getattr(content, "parts", None) or []:
            fc = getattr(part, "function_call", None)
            if fc is not None:
                args = getattr(fc, "args", None) or {}
                if hasattr(args, "items"):
                    args = dict(args)
                steps.append({"tool": getattr(fc, "name", "search"), "args": args})
    return {"steps": steps, "text": (response.text or "").strip()}


async def run_overnight(call_sheet: dict[str, Any]) -> dict[str, Any]:
    if not google_api_key():
        raise RuntimeError("GOOGLE_API_KEY is missing. Copy .env.example to .env.")

    user_text = (
        "Run the overnight on this call sheet. Search the live web, then write the JSON brief.\n\n"
        + json.dumps(call_sheet, indent=2)
    )

    try:
        raw = await _run_adk(user_text)
        path = "google-adk"
    except Exception:
        raw = _run_genai(user_text)
        path = "google-genai"

    try:
        brief = _parse_brief(raw["text"])
    except Exception:
        brief = {
            "headline": "Desk notes (unparsed)",
            "verdict": "watch",
            "summary": raw.get("text") or "The agent returned an empty brief.",
            "flags": [],
            "sources": [],
        }

    return {
        "brief": brief,
        "steps": raw.get("steps") or [],
        "model": gemini_model(),
        "partner": "parallel-web",
        "runtime": path,
    }
