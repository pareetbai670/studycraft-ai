# 🚀 Deploying StudyCraft AI

StudyCraft AI has **two parts** that deploy to **two different platforms**:

| Part | Folder | Best host | Why |
| --- | --- | --- | --- |
| Frontend (React/Vite) | `frontend/` | **Vercel** / Netlify | Static site hosting — Vercel's sweet spot |
| Backend (FastAPI) | `backend/` | **Render** / Railway | Real Python server; long-running LLM calls |

> ⚠️ **Do not deploy the FastAPI backend to Vercel.** Vercel's Python builder may try to
> compile `pydantic-core` from source (Rust/maturin) and fail with
> `Command "uv pip install" exited with 1`. Use Render/Railway for the backend —
> they install prebuilt wheels on Python 3.12 (pinned via `backend/runtime.txt`).

---

## Step 1 — Deploy the backend to Render (free)

1. Push this repo to GitHub.
2. Go to <https://render.com> → **New → Blueprint**.
3. Connect this repository. Render auto-detects [`render.yaml`](render.yaml) and
   provisions a web service from `backend/` on Python 3.12.
4. Wait for the build (`pip install -r requirements.txt`) and deploy to finish.
5. Copy your backend URL, e.g. `https://studycraft-ai-backend.onrender.com`.
6. Verify it's live: open `https://<your-backend>/health` → should return JSON.

**Manual alternative (no Blueprint):** New → Web Service → Root Directory `backend`,
Build `pip install -r requirements.txt`,
Start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

> It runs in **mock mode** by default (no model needed). To use a real local LLM you
> must host Ollama/vLLM somewhere reachable and set `LLM_PROVIDER` + `OLLAMA_BASE_URL`.

---

## Step 2 — Deploy the frontend to Vercel

1. Go to <https://vercel.com> → **Add New → Project** → import this repo.
2. Set **Root Directory** to `frontend`. Vercel reads
   [`frontend/vercel.json`](frontend/vercel.json) (framework = Vite).
3. Add an **Environment Variable** so the frontend calls your backend:
   - Key: `VITE_API_BASE`
   - Value: your Render backend URL (e.g. `https://studycraft-ai-backend.onrender.com`)
4. Deploy. You'll get a public URL like `https://studycraft-ai.vercel.app`.

---

## Step 3 — Connect the two (CORS)

Lock the backend down to your real frontend origin:

1. In Render → your service → **Environment**, set:
   - `CORS_ORIGINS` = `https://studycraft-ai.vercel.app`
   (The default `render.yaml` ships `*`, which works but is permissive.)
2. Save — Render redeploys automatically.

Done. Open your Vercel URL and generate assets. 🎉

---

## Railway (backend alternative to Render)

- New Project → Deploy from GitHub → set root to `backend`.
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Railway respects `runtime.txt` / `.python-version` (Python 3.12).

## Netlify (frontend alternative to Vercel)

- Base directory: `frontend`, Build: `npm run build`, Publish: `frontend/dist`.
- Add env var `VITE_API_BASE` = your backend URL.
- Add a SPA redirect: `/*  /index.html  200` (via `netlify.toml` or UI).
