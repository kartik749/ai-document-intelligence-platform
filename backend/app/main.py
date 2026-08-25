import uuid
import time
import threading
from rq import SimpleWorker
from app.queue import redis_conn, task_queue
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api import auth, documents, chat
from app.core.limiter import limiter
from app.core.login_config import setup_logging, logger

def start_background_worker():
    worker = SimpleWorker([task_queue], connection=redis_conn)
    worker.work(with_scheduler=False)


setup_logging()

app = FastAPI(title="AI Document Intelligence Platform")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    start_time = time.time()

    response = await call_next(request)

    duration_ms = round((time.time() - start_time) * 1000, 2)

    logger.info(
        f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)",
        extra={"request_id": request_id},
    )

    response.headers["X-Request-ID"] = request_id
    return response

@app.on_event("startup")
def launch_worker_thread():
    thread = threading.Thread(target= start_background_worker, daemon=True)
    thread.start()

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chat.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}