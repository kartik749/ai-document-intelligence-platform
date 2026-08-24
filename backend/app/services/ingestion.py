import fitz # PyMuPDF
import tiktoken

encoding = tiktoken.get_encoding("cl100k_base")

CHUNK_SIZE_TOKENS = 500
CHUNK_OVERLAP_TOKENS = 50

def extract_pages(file_path: str) -> list[dict]:
    """Returns a list of {page_number, text} dicts, one per page."""
    doc = fitz.open(file_path)
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text().strip()
        pages.append({"page_number": i + 1, "text": text})
    doc.close()
    return pages

def chunk_text(text: str) -> list[str]:
    """Splits text into overlapping chunks based on token count."""
    if not text:
        return []

    tokens = encoding.encode(text)
    chunks = []
    start = 0

    while start < len(tokens):
        end = start + CHUNK_SIZE_TOKENS
        chunk_tokens = tokens[start:end]
        chunk_str = encoding.decode(chunk_tokens)
        chunks.append(chunk_str)
        start += CHUNK_SIZE_TOKENS - CHUNK_OVERLAP_TOKENS

    return chunks

def process_pdf(file_path: str) -> list[dict]:
    """
    Full pipeline: extract pages -> chunk each page's text.
    Returns list of {page_number, chunk_index, chunk_text}.
    """
    pages = extract_pages(file_path)
    all_chunks = []

    for page in pages:
        page_chunks = chunk_text(page["text"])
        for idx, chunk in enumerate(page_chunks):
            all_chunks.append({
                "page_number": page["page_number"],
                "chunk_index": idx,
                "chunk_text": chunk,
            })

    return all_chunks, len(pages)