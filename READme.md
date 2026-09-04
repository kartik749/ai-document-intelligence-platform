# AI Document Intelligence Platform

A full-stack, production-style **RAG (Retrieval-Augmented Generation)** application that lets users upload PDF documents and ask natural-language questions about them — with every answer grounded in the source document and cited by page number.

**🔗 Live demo:** [ai-document-intelligence-platform-liart.vercel.app](https://ai-document-intelligence-platform-liart.vercel.app/)
**🔗 API (Swagger docs):** [doc-backend-bi5o.onrender.com/docs](https://doc-backend-bi5o.onrender.com/docs)

> **Note on the live demo:** the backend runs on Render's free tier, which spins down after inactivity. The first request may take 30–60 seconds while the server wakes up — subsequent requests are fast.

---

## Overview

Users register, upload a PDF, and the system extracts text page-by-page, chunks it, generates embeddings, and stores everything in a vector index. When a user asks a question, the system retrieves the most relevant chunks, sends them to an LLM with strict grounding instructions, and returns an answer with citations back to the exact source page — reducing hallucination and making every answer verifiable.

## Features

- 🔐 JWT authentication with access + refresh tokens and server-side revocation
- 📄 PDF upload with page-aware text extraction and token-based chunking (with overlap)
- 🔎 Semantic search via vector embeddings stored in PostgreSQL (pgvector)
- 💬 RAG-based chat with multi-turn conversation memory
- 📌 Source citations — every answer links back to the originating page(s)
- 🧵 Background job processing for document ingestion (RQ + Redis)
- 🚦 Rate limiting on expensive endpoints (chat, upload)
- 📊 Structured JSON logging with per-request tracing
- ✅ 16 automated tests (auth, authorization, RAG pipeline with mocked LLM calls)
- 📈 A measured RAG evaluation pipeline (retrieval hit-rate + answer correctness)
- 🐳 Fully containerized with Docker Compose (Postgres, Redis, backend, worker)
- 🔄 CI pipeline via GitHub Actions running the full test suite on every push
- ☁️ Deployed publicly (Vercel + Render)

## Architecture

```
                     ┌─────────────┐
        User ───────▶│  React/Next │
                     │  (Vercel)   │
                     └──────┬──────┘
                            │ REST API (JWT)
                     ┌──────▼──────┐
                     │   FastAPI   │
                     │  (Render)   │
                     └──┬───────┬──┘
              ┌─────────┘       └─────────┐
      ┌───────▼────────┐          ┌───────▼───────┐
      │  PostgreSQL     │          │     Redis     │
      │  + pgvector     │          │ (rate limits, │
      │ (users, docs,   │          │  job queue)   │
      │ chunks, chats)  │          └───────────────┘
      └────────┬────────┘
               │
     ┌─────────▼──────────┐        ┌─────────────────┐
     │  Ingestion Pipeline │───────▶│ HF Inference API │
     │ (extract → chunk →  │        │  (embeddings)    │
     │  embed → store)     │        └─────────────────┘
     └──────────────────────┘

     ┌──────────────────────┐        ┌─────────────────┐
     │   RAG Chat Pipeline   │───────▶│    Groq API     │
     │ (retrieve → prompt →  │        │  (LLM inference) │
     │  generate → cite)     │        └─────────────────┘
     └───────────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS |
| Backend | Python, FastAPI |
| Database | PostgreSQL + pgvector |
| Cache / Queue | Redis, RQ |
| Embeddings | Hugging Face Inference API (`all-MiniLM-L6-v2`, 384-dim) |
| LLM | Groq (`openai/gpt-oss-120b`) |
| Auth | JWT (access + refresh tokens), bcrypt |
| PDF Processing | PyMuPDF, tiktoken |
| Testing | pytest, httpx |
| DevOps | Docker, Docker Compose, GitHub Actions |
| Deployment | Vercel (frontend), Render (backend, worker*, Postgres, Redis) |

## Project Structure

```
ai-document-intelligence-platform/
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers (auth, documents, chat)
│   │   ├── core/         # Security, logging, rate limiting
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── services/     # Ingestion, embeddings, retrieval, LLM, jobs
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── alembic/          # Database migrations
│   ├── evaluation/       # RAG evaluation dataset + runner
│   ├── tests/            # Automated test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/app/           # Pages (login, register, dashboard, upload, chat)
│   └── src/lib/           # API client, auth guard
├── docker-compose.yml
├── render.yaml
└── README.md
```

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create a new user |
| POST | `/auth/login` | Get access + refresh tokens |
| POST | `/auth/refresh` | Exchange refresh token for a new access token |
| POST | `/auth/logout` | Revoke a refresh token |
| POST | `/documents/upload` | Upload and process a PDF |
| GET | `/documents` | List the current user's documents |
| GET | `/documents/{id}` | Get a document's status/metadata |
| DELETE | `/documents/{id}` | Delete a document and its data |
| POST | `/chat` | Ask a question about a document |
| GET | `/chat/{conversation_id}` | Get conversation history |

Full interactive documentation: [`/docs`](https://doc-backend-bi5o.onrender.com/docs) (Swagger UI).

## Running Locally

### Option A — Docker Compose (recommended, fewest moving parts)

```bash
git clone https://github.com/kartik749/ai-document-intelligence-platform.git
cd ai-document-intelligence-platform
cp backend/.env.example backend/.env   # fill in your API keys
docker compose up --build
```

This starts Postgres (with pgvector), Redis, the FastAPI backend, and the RQ worker together. Backend will be available at `http://localhost:8000`.

Then, in a separate terminal, run the frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:3000`.

### Option B — Manual setup

<details>
<summary>Expand for manual backend + frontend setup without Docker</summary>

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

**Worker (separate terminal):**
```bash
python worker.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

</details>

### Required environment variables (`backend/.env`)

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/docintel
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-random-secret-key
GROQ_API_KEY=your-groq-key
HF_API_TOKEN=your-huggingface-token
```

### Running tests

```bash
cd backend
pytest -v
```

## Evaluation

A small evaluation set was used to measure retrieval and answer quality against real documents:

| Metric | Result |
|---|---|
| Retrieval hit-rate | 100% |
| Answer match rate | 100% |

*(Measured on a 6-question evaluation set — see `backend/evaluation/`. This is a directional sanity check on a small, self-authored dataset, not a claim of universal accuracy; expanding the evaluation set with a larger, more adversarial question set is a natural next step.)*

## Key Design Decisions & Trade-offs

Being upfront about the real engineering decisions and constraints behind this project:

- **pgvector over a dedicated vector database (Qdrant/Pinecone):** avoids running an extra service at this scale; a dedicated vector store would be the next step for larger datasets or advanced index tuning.
- **RQ over Celery:** Celery's default process pool has known reliability issues on Windows; RQ was simpler to run reliably in local development.
- **Hugging Face Inference API for embeddings (not local `sentence-transformers`):** the free-tier deployment host has limited RAM, which can't reliably load a local embedding model. Using a remote inference API keeps the deployed container lightweight while still using the same model class (`all-MiniLM-L6-v2`, 384 dimensions).
- **Synchronous document processing on the live deployment\*:** the full background-worker architecture (separate RQ worker process + Redis queue) is implemented and demonstrated via Docker Compose. The public Render deployment processes documents synchronously within the request instead, to avoid the cost of a paid worker service tier and threading/signal-handling constraints specific to Render's free tier.
- **Keyword-based answer matching in evaluation:** simple and transparent rather than an LLM-as-judge approach; sufficient for catching major retrieval/grounding failures in a small evaluation set.

## Known Limitations & Future Improvements

- Hybrid (keyword + vector) search and reranking are not yet implemented — currently pure vector similarity search.
- No OCR support for scanned/image-only PDFs.
- Chat is scoped to a single document per conversation; multi-document reasoning is a planned extension.
- Evaluation set is small (6 questions); a larger, more adversarial set would give a more robust accuracy signal.
- Live deployment processes uploads synchronously (see trade-offs above); the queued background-worker version is fully functional in the Docker Compose setup.

## License

MIT