import sys
import os
import json

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.database import SessionLocal
from app.models.document import Document
from app.services.retrieval import retrieve_relevant_chunks
from app.services.llm import generate_answer


def load_eval_dataset():
    path = os.path.join(os.path.dirname(__file__), "eval_dataset.json")
    with open(path, "r") as f:
        return json.load(f)


def run_evaluation(document_id: str):
    db = SessionLocal()
    dataset = load_eval_dataset()

    results = []
    retrieval_hits = 0
    answer_matches = 0

    for item in dataset:
        question = item["question"]
        expected_page = item["expected_page"]
        expected_keywords = item["expected_keywords"]

        chunks = retrieve_relevant_chunks(db, document_id, question)
        retrieved_pages = [c["page_number"] for c in chunks]
        retrieval_hit = expected_page in retrieved_pages

        answer = generate_answer(question, chunks) if chunks else "I couldn't find this in the provided document."
        answer_lower = answer.lower()
        keyword_matches = [kw for kw in expected_keywords if kw.lower() in answer_lower]
        answer_match = len(keyword_matches) > 0

        if retrieval_hit:
            retrieval_hits += 1
        if answer_match:
            answer_matches += 1

        results.append({
            "question": question,
            "expected_page": expected_page,
            "retrieved_pages": retrieved_pages,
            "retrieval_hit": retrieval_hit,
            "expected_keywords": expected_keywords,
            "matched_keywords": keyword_matches,
            "answer_match": answer_match,
            "answer": answer,
        })

    db.close()

    total = len(dataset)
    summary = {
        "total_questions": total,
        "retrieval_hit_rate": round(retrieval_hits / total * 100, 1),
        "answer_match_rate": round(answer_matches / total * 100, 1),
        "results": results,
    }

    return summary


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python run_eval.py <document_id>")
        sys.exit(1)

    document_id = sys.argv[1]
    summary = run_evaluation(document_id)

    print(f"\n{'='*50}")
    print(f"RAG EVALUATION RESULTS")
    print(f"{'='*50}")
    print(f"Total questions:      {summary['total_questions']}")
    print(f"Retrieval hit rate:   {summary['retrieval_hit_rate']}%")
    print(f"Answer match rate:    {summary['answer_match_rate']}%")
    print(f"{'='*50}\n")

    for r in summary["results"]:
        status_r = "✓" if r["retrieval_hit"] else "✗"
        status_a = "✓" if r["answer_match"] else "✗"
        print(f"[{status_r} retrieval | {status_a} answer] {r['question']}")
        if not r["retrieval_hit"]:
            print(f"    Expected page {r['expected_page']}, got {r['retrieved_pages']}")
        if not r["answer_match"]:
            print(f"    Expected keywords: {r['expected_keywords']}")
            print(f"    Got answer: {r['answer'][:100]}...")

    output_path = os.path.join(os.path.dirname(__file__), "eval_results.json")
    with open(output_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\nFull results saved to {output_path}")