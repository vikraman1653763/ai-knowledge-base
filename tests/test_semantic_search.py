
from pathlib import Path

from pypdf import PdfReader
from sentence_transformers import SentenceTransformer, util

from main import chunk_text


# 1. Read the PDF
pdf_path = Path("Resume Vikraman G.pdf")

if not pdf_path.exists():
    raise FileNotFoundError(
        f"PDF not found: {pdf_path.resolve()}"
    )

reader = PdfReader(str(pdf_path))

chunks = []

# 2. Extract text and split it into chunks
for page_number, page in enumerate(reader.pages, start=1):
    text = page.extract_text() or ""

    if not text.strip():
        continue

    page_chunks = chunk_text(text)

    for chunk_index, chunk in enumerate(page_chunks, start=1):
        chunks.append({
            "chunk_id": f"page_{page_number}_chunk_{chunk_index}",
            "page": page_number,
            "text": chunk,
        })

if not chunks:
    raise ValueError("No readable text found in the PDF.")

print(f"Loaded {len(chunks)} chunks.")


# 3. Load the embedding model
model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2"
)


# 4. Generate embeddings for all chunks ONCE
chunk_texts = [chunk["text"] for chunk in chunks]

chunk_embeddings = model.encode(
    chunk_texts,
    convert_to_tensor=True
)

while True:
    question = input("\nAsk a question (or type 'exit'): ")

    if question.lower() == "exit":
        break

    question_embedding = model.encode(
        question,
        convert_to_tensor=True
    )

    similarity_scores = util.cos_sim(
        question_embedding,
        chunk_embeddings
    )[0]

    top_results = similarity_scores.topk(
        k=min(3, len(chunks))
    )

    for score, index in zip(
        top_results.values,
        top_results.indices
    ):
        chunk = chunks[index.item()]
        print(f"\nPage: {chunk['page']}")
        print(f"Similarity: {score.item():.4f}")
        print(f"Text: {chunk['text']}")