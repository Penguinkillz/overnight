# Overnight

**Paste tomorrow's call sheet. Overnight searches the live web and drops a one-page risk brief before crew call.**

A production-office agent for the Google Cloud **Agentic Cinema** hackathon. **Track: Parallel.**

Overnight is a web app a coordinator can actually sit down with at 11pm. You load tomorrow's call sheet. A Gemini agent (Google ADK) runs live Parallel Search queries — location, talent/news, competing productions, music cues — then writes a one-page desk brief: **proceed**, **watch**, or **ask legal**, with sources. The UI is a call sheet in, a stamped packet out. Not a chatbot with a film sticker on it.

![Overnight desk](docs/devpost-thumbnail.png)

## The job

The call sheet is done. The research is not.

Before crew call, someone still has to find out whether the street is in the news, whether another unit already owns the block, whether a name on the sheet just became a problem, and whether that needle-drop is going to get legal on the radio. That work is usually tabs, Slack, and hope. It is also the difference between wrapping and losing a day.

Overnight is that night desk.

## What you see

1. Load the sample shoot (**River Line** at the Brooklyn Navy Yard) or paste your own sheet.
2. Click **Run overnight**.
3. Gemini decides which Parallel searches to fire. You see the desk working.
4. A stamped brief lands: headline, verdict, flags, source links.

Sample production is fictional. The location is real on purpose, so Parallel hits live pages instead of a fake database.

## Runtime proof (this is what Stage One checks)

Partner and Google Cloud usage is **imported and called**, not named in this README.

| Requirement | Where it actually runs |
| --- | --- |
| Google ADK agent + runner | [`app/agent.py`](app/agent.py) (`google.adk.agents.llm_agent.Agent`, `InMemoryRunner`) |
| Gemini / `google-genai` | [`app/agent.py`](app/agent.py) (user turn + fallback generate_content) |
| Parallel Search API | [`app/tools.py`](app/tools.py) — `from parallel import Parallel` then `client.search(...)` |

Tools the agent can call (each one hits Parallel):

- `search_location_risks`
- `search_talent_news`
- `search_competing_productions`
- `search_music_clearance`

## Architecture

```
Call sheet UI  ->  FastAPI /api/overnight
                      ->  Google ADK (Gemini)
                            ->  Parallel Search (location)
                            ->  Parallel Search (talent)
                            ->  Parallel Search (productions)
                            ->  Parallel Search (music)
                      ->  JSON brief  ->  stamped packet UI
```

Frontend: React, Vite, Tailwind. [Anime.js](https://animejs.com/) for the masthead and verdict stamp. [React Bits](https://reactbits.dev/get-started/index) Aurora background. [21st.dev](https://21st.dev/)-style shimmer button.

## Local setup

Python 3.11+ and Node 20+.

```powershell
cd C:\Users\ASUS\Projects\overnight
copy .env.example .env
# put GOOGLE_API_KEY and PARALLEL_API_KEY in .env, then:
cmd /c run.cmd
```

`bootstrap.ps1` rewrites source files to UTF-8 (pip cannot read UTF-16), installs Python + Node deps, then starts:

- API: http://127.0.0.1:8080
- UI:  http://127.0.0.1:5173  **open this one**

Keys: [Google AI Studio](https://aistudio.google.com/apikey) and [Parallel platform](https://platform.parallel.ai). Never commit `.env`.

Manual (if you already ran the encoding fix):

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

```powershell
cd frontend
npm install
npm run dev
```

## Hosting

The hackathon needs a public URL of the **running agent**, not a static page.

**Do not use Vercel for the demo.** Overnight is FastAPI + a 30-60s Gemini/Parallel loop. Vercel Hobby functions time out around 10 seconds. A Vercel frontend with a dead API will fail judging.

Railway trial expired: skip it.

**Use Render (free, connects to GitHub):** [render.com](https://render.com) → New Web Service → this repo → Docker (`Dockerfile`). Add `GOOGLE_API_KEY` and `PARALLEL_API_KEY`. That URL is the Devpost "Try it out" link.

Backup: **Google Cloud Run** with the same Docker image. Fits the Google Cloud story if Render waitlists you.

## What we learned

- One giant "search the web" prompt lies. The desk needs separate searches so a location flag does not get mixed up with a music cue.
- Parallel's objective + query list is closer to how a coordinator actually googles than a single keyword box.
- If the brief looks like a model dump, nobody in a production office will trust it. The stamp and the paper matter.

## License

MIT. See [`LICENSE`](LICENSE).
