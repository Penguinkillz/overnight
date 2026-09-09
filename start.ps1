# Overnight local start (Windows)
# 1. Copy .env.example to .env and fill keys
# 2. Run this from the repo root in two terminals if you want hot reload.

python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; .\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8080"
Set-Location frontend
npm install
npm run dev
