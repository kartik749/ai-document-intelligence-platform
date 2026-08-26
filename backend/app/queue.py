import redis
from rq import Queue
from app.config import settings

redis_conn = redis.from_url(settings.redis_url, socket_timeout=10, socket_connect_timeout=10)
task_queue = Queue("document_processing", connection=redis_conn)