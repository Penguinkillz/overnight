@echo off
cd /d "%~dp0"
python -c "open('requirements.txt','w',encoding='utf-8').write('fastapi>=0.115.0\nuvicorn[standard]>=0.32.0\npython-dotenv>=1.0.1\npydantic>=2.9.0\ngoogle-adk>=1.15.0\ngoogle-genai>=1.0.0\nparallel-web>=0.3.0\n')"
if not exist .venv\Scripts\python.exe python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
start "overnight-api" cmd /k "cd /d %~dp0 && .venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8080"
cd frontend
call npm install
echo Open http://127.0.0.1:5173
call npm run dev
