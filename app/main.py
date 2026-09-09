from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app.agent import run_overnight
from app.config import google_api_key, parallel_api_key
from app.data import EMPTY_CALL_SHEET, SAMPLE_CALL_SHEET

app = FastAPI(title="Overnight", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"


class CallSheet(BaseModel):
    production: str = ""
    shoot_date: str = ""
    unit: str = "Main unit"
    location: str = ""
    scenes: str = ""
    cast: str = ""
    music_cues: str = ""
    notes: str = ""


class OvernightRequest(BaseModel):
    call_sheet: CallSheet = Field(default_factory=CallSheet)


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "google": bool(google_api_key()),
        "parallel": bool(parallel_api_key()),
    }


@app.get("/api/sample")
def sample() -> dict[str, Any]:
    return {"call_sheet": SAMPLE_CALL_SHEET, "blank": EMPTY_CALL_SHEET}


@app.post("/api/overnight")
async def overnight(payload: OvernightRequest) -> dict[str, Any]:
    sheet = payload.call_sheet.model_dump()
    if not sheet.get("location") and not sheet.get("production"):
        raise HTTPException(400, "Need at least a production title or a location.")
    if not google_api_key() or not parallel_api_key():
        raise HTTPException(
            503,
            "Server is missing GOOGLE_API_KEY or PARALLEL_API_KEY.",
        )
    try:
        return await run_overnight(sheet)
    except Exception as exc:
        raise HTTPException(500, str(exc)) from exc


@app.get("/")
def root() -> Any:
    index = DIST / "index.html"
    if index.exists():
        return FileResponse(index)
    return {
        "ok": True,
        "service": "overnight",
        "hint": "Start the Vite app in frontend/ or run npm run build so FastAPI can serve the UI.",
    }


if DIST.exists():
    assets = DIST / "assets"
    if assets.exists():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    @app.get("/{path:path}")
    def spa(path: str) -> FileResponse:
        if path.startswith("api/"):
            raise HTTPException(404, "Not found")
        candidate = DIST / path
        if path and candidate.is_file():
            return FileResponse(candidate)
        index = DIST / "index.html"
        if not index.exists():
            raise HTTPException(404, "Frontend is not built yet.")
        return FileResponse(index)
