<div align="center">

# 🎓 StudyCraft AI

**Transform your study material into customized learning assets — powered by local, open-weight LLMs.**

Quizzes · Flashcards · Worksheets · Mind Maps · Summaries

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Hacktoberfest](https://img.shields.io/badge/Hacktoberfest-friendly-ff69b4.svg)
![Backend](https://img.shields.io/badge/backend-FastAPI-009688.svg)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61dafb.svg)
![LLM](https://img.shields.io/badge/LLM-Ollama%20%7C%20vLLM-000000.svg)

</div>

---

## 📖 Overview

**StudyCraft AI** turns raw notes, textbook excerpts, and PDFs into interactive,
exam-ready study assets. Everything runs on **local open-weight models** (Gemma 2,
Llama 3.2, or Mistral via **Ollama** or **vLLM**) — so your notes never leave your
machine. A built-in **Mock Generator Mode** lets you run the whole app instantly
with **zero model downloads**.

### Problem

Students and self-learners spend hours manually turning notes into practice
questions, flashcards, and summaries. Cloud AI tools raise privacy concerns, cost
money per request, and require sending potentially sensitive course material to
third-party servers.

### Solution

A self-hostable, privacy-first web app that generates five types of high-quality
study assets from your own material. It runs entirely on your hardware using
open-weight models, enforces **strict JSON output** for reliable rendering, and
falls back gracefully (mock mode + JSON repair) so a demo never breaks.

---

## 🤖 AI Component Details

StudyCraft AI's generation engine is built around **local open-weight language
models**. No proprietary API keys, no per-token billing.

| Concern | How StudyCraft AI handles it |
| --- | --- |
| **Model hosting** | [Ollama](https://ollama.com) (default) or [vLLM](https://docs.vllm.ai) OpenAI-compatible server |
| **Default models** | `llama3.2` (Ollama) / `google/gemma-2-9b-it` (vLLM) — swap via `.env` |
| **Structured output** | System prompts force a single valid JSON object; Ollama uses `format: "json"`, vLLM uses `response_format: {"type":"json_object"}` |
| **Reliability** | Multi-pass **JSON repair** (strips code fences, isolates the object, removes trailing commas, closes truncated braces) + schema validation + retries |
| **Graceful fallback** | If the model is unreachable or keeps returning invalid JSON, the request falls back to the **Mock Generator** so the UI always renders |
| **Offline demo** | `LLM_PROVIDER=mock` produces content-aware JSON with no weights required |

The strict prompting lives in [`backend/app/prompts/system_prompts.py`](backend/app/prompts/system_prompts.py)
and the repair/validation pipeline in
[`backend/app/services/generator.py`](backend/app/services/generator.py).

---

## 🏗️ Architecture & Technical Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Browser (React SPA)                            │
│  Vite · Tailwind · Shadcn UI                                           │
│                                                                        │
│  InputSection ─▶ AssetTypeSelector ─▶ ConfigPanel ─▶ [Generate]        │
│        │                                                   │           │
│        │  (.txt/.md/.pdf upload)                           │ JSON      │
│        ▼                                                   ▼           │
│   POST /api/extract                                  POST /api/generate │
└────────────────────────────────────────────────────────────┬──────────┘
           │                                                 │
           ▼                                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        FastAPI Backend                                 │
│                                                                        │
│  extract.py (pypdf)        generator.py (orchestrator)                 │
│                               │                                        │
│                   build strict system + user prompt                    │
│                               │                                        │
│          ┌────────────────────┼─────────────────────┐                 │
│          ▼                     ▼                     ▼                 │
│   OllamaClient           VLLMClient            mock_generator          │
│   /api/chat              /v1/chat/completions   (offline JSON)         │
│          └────────────────────┬─────────────────────┘                 │
│                               ▼                                        │
│                    json_repair ─▶ Pydantic schema validation           │
│                               │                                        │
│                    retry on failure, else fall back to mock            │
└───────────────────────────────┬───────────────────────────────────────┘
                                 ▼
                      GenerateResponse (meta + typed asset)
                                 │
                                 ▼
     Rendered by: QuizRenderer · FlashcardRenderer · MindMapRenderer
                  WorksheetRenderer · SummaryRenderer
```

**Request lifecycle:** user material → (optional file extraction) → strict prompt
→ local LLM → JSON repair → schema validation (retry/fallback) → typed asset →
interactive React renderer → export to PDF / Markdown.

---

## ✨ Features

- **Input**: paste raw text/Markdown, or upload `.txt`, `.md`, `.pdf` (drag & drop).
- **Five asset types**: Worksheets, Quizzes, Flashcards, Mind Maps, Main-Point summaries.
- **Dynamic customization**: difficulty, question style, academic level, item count (5–20).
- **Interactive rendering**:
  - Quizzes — clickable choices, instant feedback, live score tracking.
  - Flashcards — 3D flip cards with Next/Previous + keyboard nav.
  - Mind Maps — Mermaid.js diagram **and** hierarchical outline view.
  - Worksheets & Summaries — clean printable layouts with **Export to PDF / Markdown**.
- **Robust backend**: strict JSON prompting, automatic JSON repair, retries, mock fallback.
- **Privacy-first & offline-capable**: runs fully local; mock mode needs no model.

---

## 🚀 Setup & Installation

### Prerequisites

- **Python 3.10+** and **Node.js 18+**
- *(Optional, for real LLM output)* [Ollama](https://ollama.com/download) **or** a vLLM server

### 1. Clone

```bash
git clone https://github.com/<your-org>/studycraft-ai.git
cd studycraft-ai
```

### 2. Backend (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # defaults to mock mode — works immediately
uvicorn app.main:app --reload --port 8000
```

API docs available at <http://localhost:8000/docs>.

### 3. Frontend (React + Vite)

```bash
cd ../frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The Vite dev server proxies `/api` to the backend
on port 8000, so no extra config is needed.

### 4. (Optional) Enable a local LLM via Ollama

```bash
# Install Ollama from https://ollama.com, then pull a model:
ollama pull llama3.2        # or: ollama pull gemma2  /  ollama pull mistral
ollama serve                # usually auto-starts on http://localhost:11434
```

Edit `backend/.env`:

```ini
LLM_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
```

Restart the backend. That's it — StudyCraft AI now generates with your local model.

### 5. (Optional) Use vLLM instead

```bash
pip install vllm
python -m vllm.entrypoints.openai.api_server --model google/gemma-2-9b-it
```

```ini
LLM_PROVIDER=vllm
VLLM_BASE_URL=http://localhost:8000/v1
VLLM_MODEL=google/gemma-2-9b-it
```

> Tip: if you run vLLM on port 8000, move the StudyCraft backend to another port
> (e.g. `uvicorn app.main:app --port 8010`) and update the frontend proxy target.

---

## ⚙️ Configuration Reference (`backend/.env`)

| Variable | Default | Description |
| --- | --- | --- |
| `LLM_PROVIDER` | `mock` | `mock` \| `ollama` \| `vllm` |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3.2` | Ollama model tag |
| `VLLM_BASE_URL` | `http://localhost:8000/v1` | vLLM OpenAI-compatible URL |
| `VLLM_MODEL` | `google/gemma-2-9b-it` | vLLM model name |
| `LLM_TEMPERATURE` | `0.4` | Sampling temperature |
| `LLM_MAX_RETRIES` | `2` | Retries on invalid JSON before mock fallback |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated allowed origins |

---

## 📁 Project Structure

```
studycraft-ai/
├── LICENSE                       # MIT
├── README.md
├── backend/                      # FastAPI service
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py               # app + CORS + routers
│       ├── config.py             # env-driven settings
│       ├── models/schemas.py     # strict JSON contract (Pydantic)
│       ├── prompts/system_prompts.py  # JSON-forcing prompts
│       ├── services/
│       │   ├── llm_client.py     # Ollama + vLLM clients
│       │   ├── json_repair.py    # multi-pass JSON recovery
│       │   ├── mock_generator.py # offline JSON generator
│       │   └── generator.py      # orchestration + retries + fallback
│       ├── routers/{generate,health}.py
│       └── utils/extract.py      # .txt/.md/.pdf text extraction
└── frontend/                     # React + Vite + Tailwind + Shadcn
    └── src/
        ├── App.tsx
        ├── lib/{api,types,utils,export,sample}.ts
        └── components/
            ├── InputSection.tsx
            ├── AssetTypeSelector.tsx
            ├── ConfigPanel.tsx
            ├── AssetView.tsx
            ├── ui/                # Shadcn primitives
            └── renderers/         # one per asset type
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Service + LLM provider reachability |
| `GET` | `/api/config` | Active provider/model + item limits |
| `POST` | `/api/extract` | Multipart file → extracted text |
| `POST` | `/api/generate` | Study material + config → typed asset JSON |

Example:

```bash
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"content":"Mitochondria are the powerhouse of the cell...",
       "asset_type":"flashcards","difficulty":"beginner",
       "question_style":"theoretical","academic_level":"high_school","count":6}'
```

---

## 🧩 Strict JSON Contract (example: quiz)

```json
{
  "title": "Cell Biology Quiz",
  "type": "quiz",
  "questions": [
    {
      "question": "What is the primary function of mitochondria?",
      "type": "multiple_choice",
      "options": ["ATP production", "Protein synthesis", "Photosynthesis", "DNA storage"],
      "answer": "ATP production",
      "explanation": "Mitochondria generate ATP via cellular respiration."
    }
  ]
}
```

Every asset type has a dedicated schema in `backend/app/models/schemas.py`.

---

## 🤝 Contributing (Hacktoberfest-friendly)

1. Fork the repo and create a feature branch.
2. Keep PRs focused; follow the existing code style.
3. New asset types? Add a schema + prompt + mock case + renderer.
4. Open a PR describing the change and how you tested it.

Good first issues: new question styles, additional export formats, dark-mode
toggle, i18n, more robust PDF parsing.

---

## 👥 Team & Acknowledgements

- Built by the **StudyCraft AI contributors** for the open-source community.
- Powered by open-weight models: **Gemma 2** (Google), **Llama 3.2** (Meta),
  **Mistral** (Mistral AI).
- Thanks to [Ollama](https://ollama.com), [vLLM](https://docs.vllm.ai),
  [FastAPI](https://fastapi.tiangolo.com), [React](https://react.dev),
  [Vite](https://vitejs.dev), [Tailwind CSS](https://tailwindcss.com),
  [shadcn/ui](https://ui.shadcn.com), and [Mermaid](https://mermaid.js.org).

## 📄 License

Released under the [MIT License](LICENSE).
