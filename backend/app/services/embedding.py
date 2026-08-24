from sentence_transformers import SentenceTransformer
_model = None

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model

def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Generates embeddings locally using a sentence-transformers model.
    Returns a list of embedding vectors (384-dim) in the same order as input.
    """
    model = get_model()
    embeddings = model.encode(texts, show_progress_bar=False)
    return embeddings.tolist()