import sys
import os
sys.path.append(os.getcwd())

from rq import SimpleWorker
from app.queue import redis_conn, task_queue

if __name__ == "__main__":
    worker = SimpleWorker([task_queue], connection=redis_conn)
    worker.work()