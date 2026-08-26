import requests
from app.config import settings

HF_API_URL = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction"


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Generates embeddings using Hugging Face's free Inference API.
    Runs the same all-MiniLM-L6-v2 model remotely instead of loading it
    locally, keeping the deployed container lightweight (no torch needed).
    Returns a list of embedding vectors (384-dim) in the same order as input.
    """
    headers = {"Authorization": f"Bearer {settings.hf_api_token}"}
    response = requests.post(
        HF_API_URL,
        headers=headers,
        json={"inputs": texts, "options": {"wait_for_model": True}},
        timeout=30,
    )
    response.raise_for_status()
    return response.json()