from groq import Groq
from app.config import settings

client = Groq(api_key=settings.groq_api_key)

MODEL = "openai/gpt-oss-120b"

SYSTEM_PROMPT = """You are a document assistant. Answer the user's question using ONLY the provided context excerpts below.

Rules:
- Base your answer strictly on the given context. Do not use outside knowledge.
- If the context does not contain enough information to answer, respond exactly with: "I couldn't find this in the provided document."
- When you use information from a context excerpt, note which page it came from.
- Be concise and direct."""


def generate_answer(question: str, context_chunks: list[dict]) -> str:
    """
    context_chunks: list of {chunk_text, page_number}
    Returns the generated answer as a string.
    """
    context_str = "\n\n".join(
        f"[Page {c['page_number']}]: {c['chunk_text']}"
        for c in context_chunks
    )

    user_message = f"""Context excerpts:
{context_str}

Question: {question}"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.2,
    )

    return response.choices[0].message.content