
from io import BytesIO
from pathlib import Path

import chromadb
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer

# Reuse the chunking function from our FastAPI application
from main import chunk_text


# 1. Locate the PDF
pdf_path = Path("Resume Vikraman G.pdf")

if not pdf_path.exists():
    raise FileNotFoundError(f"PDF not found: {pdf_path.resolve()}")


# 2. Connect to persistent ChromaDB storage
client = chromadb.PersistentClient(path="./chroma_db")

collection = client.get_or_create_collection(
    name="knowledge_base",
    metadata={"hnsw:space": "cosine"},
)


# 3. Extract and chunk the PDF
chunks = []

with pdf_path.open("rb") as pdf_file:
    reader = PdfReader(pdf_file)

    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""

        if not text.strip():
            continue

        page_chunks = chunk_text(text)

        for chunk_index, chunk in enumerate(page_chunks, start=1):
            chunks.append({
                "id": f"page_{page_number}_chunk_{chunk_index}",
                "page": page_number,
                "text": chunk,
            })


if not chunks:
    raise ValueError("No text chunks were extracted from the PDF.")


# 4. Prepare the ChromaDB records
ids = [chunk["id"] for chunk in chunks]
documents = [chunk["text"] for chunk in chunks]

metadatas = [
    {
        "page": chunk["page"],
        "source": pdf_path.name,
    }
    for chunk in chunks
]


# 5. Generate embeddings for the actual chunks
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

embeddings = model.encode(
    documents,
    normalize_embeddings=True,
).tolist()


# 6. Remove the old placeholder record, if present
collection.delete(ids=["resume_page1_chunk0"])


# 7. Insert or update the actual PDF chunks
collection.upsert(
    ids=ids,
    documents=documents,
    metadatas=metadatas,
    embeddings=embeddings,
)


# 8. Verify the results
print("\nPDF indexed successfully!")
print("PDF:", pdf_path.name)
print("Pages:", len(reader.pages))
print("Chunks extracted:", len(chunks))
print("Total documents in collection:", collection.count())

print("\nFirst stored chunk:")
print(collection.get(
    ids=[ids[0]],
    include=["documents", "metadatas"],
))
