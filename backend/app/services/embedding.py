import os
from groq import Groq

_client = None

def get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    return _client

def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Generates embeddings using Groq's hosted nomic-embed-text-v1_5 model.
    Returns a list of embedding vectors (768-dim) in the same order as input.
    """
    client = get_client()
    response = client.embeddings.create(
        input=texts,
        model="nomic-embed-text-v1_5",
    )
    return [item.embedding for item in response.data]