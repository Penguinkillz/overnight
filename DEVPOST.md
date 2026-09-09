# Devpost paste

## Title

Overnight

## Tagline (109 characters)

Paste tomorrow's call sheet. Overnight searches the live web and drops a one-page risk brief before crew call.

## Track

Parallel

---

## About the project (paste into "Project Story")

## Inspiration

Production offices still treat the night before a shoot like a scavenger hunt. The call sheet is done. The research is not. Someone has to find out if the location is in the news, if another unit already locked the block, if a name on the sheet just became a problem, and if that needle-drop is going to get legal on the radio. That work is tabs, Slack, and hope. We wanted the overnight packet to actually do the googling.

The Agentic Cinema brief asked for a Gemini agent that does a real media job and talks to a partner at runtime. Parallel Search is the partner that fits: the desk needs the live web, not a warehouse of old rows.

## What it does

Overnight is a web desk for a coordinator. You paste tomorrow's call sheet (or load the River Line sample). A Gemini agent on Google ADK fires separate Parallel searches for location, talent/news, competing productions, and music, then writes a one-page brief: proceed, watch, or ask legal, with sources. The UI looks like paperwork, not a chatbot.

## How we built it

- Google ADK + Gemini for the agent (`app/agent.py`)
- Official `parallel-web` SDK: `from parallel import Parallel` then `client.search(...)` (`app/tools.py`)
- FastAPI for `/api/overnight`
- React + Vite + Tailwind for the desk
- Anime.js for the title and verdict stamp
- React Bits Aurora for the night sky
- 21st.dev-style shimmer on Run overnight

Data is the live public web via Parallel. The sample shoot is a fictional indie at a real place (Brooklyn Navy Yard) so searches hit real pages.

## What we learned

A single "search the internet" prompt lies. Location trouble and a music cue are different jobs. Parallel's objective + query list is closer to how a coordinator actually googles. If the brief looks like a model dump, nobody on a set will trust it. The stamp and the paper matter.

## Challenges

Windows saved some repo files as UTF-16, which pip cannot read. We ship a bootstrap that rewrites requirements as UTF-8. The agent can take 30-60 seconds because it runs several live searches; that is honest, not a spinner. Hosting has to be a real process (Render / Cloud Run), not a 10-second serverless function.

---

## Built with (tags, max 25)

Python
FastAPI
React
Vite
Tailwind CSS
Google ADK
Gemini
google-genai
Parallel
parallel-web
Anime.js
Render

Do not tag ClickHouse, IBM, Grafana, Replit, OpenAI, or Vercel.

---

## Try it out links

1. Hosted app (Render or Cloud Run URL) - this is the one judges click
2. GitHub repo (public, MIT LICENSE at root)

---

## Video demo

YouTube or Vimeo, public, English, under 3 minutes, of the **hosted** app working. Script in README / below.

1. 0:00-0:20 This is Overnight. Call sheet is done. Research is not.
2. 0:20-0:40 Load River Line. Brooklyn Navy Yard, hymn needle-drop.
3. 0:40-1:20 Run overnight. Gemini agent. Parallel searches.
4. 1:20-1:50 Stamped brief + source links.
5. 1:50-2:10 Gemini + Parallel. Stop. No keys on screen.

---

## Thumbnail / gallery

File: `docs/devpost-thumbnail.png`
Also: `C:\Users\ASUS\.cursor\projects\c-Users-ASUS-Projects-overnight\assets\devpost-thumbnail.png`
JPG/PNG, under 5MB, 3:2 if you crop. Night desk, call sheet that says OVERNIGHT. No partner logos.

---

## Hosting note

Do not submit a Vercel URL unless the Python agent is actually running there (it will not, on the free timeout). Submit the Render or Cloud Run URL.
