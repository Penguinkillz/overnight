import os
from pathlib import Path

def _load_env():
    path = Path(__file__).resolve().parent.parent / ".env"
    if not path.exists():
        return
    raw = path.read_bytes()
    text = ""
    for enc in ("utf-8-sig", "utf-8", "utf-16", "utf-16-le", "utf-16-be"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    if not text:
        return
    if text.startswith("\ufeff"):
        text = text[1:]
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value

_load_env()

def google_api_key():
    return os.environ.get("GOOGLE_API_KEY", "").strip()

def parallel_api_key():
    return os.environ.get("PARALLEL_API_KEY", "").strip()

def gemini_model():
    m = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash").strip()
    if m.startswith("models/"):
        m = m[7:]
    if m in ("gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"):
        return "gemini-3.6-flash"
    return m or "gemini-3.6-flash"
