
import os
import hashlib
from io import BytesIO

from dotenv import load_dotenv
from google import genai
import chromadb
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from fastapi import FastAPI, UploadFile, File, HTTPException
from pypdf import PdfReader
from google.genai import errors

# Load environment variables
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY is missing from .env")

gemini_client = genai.Client(api_key=api_key)


# Initialize FastAPI
app = FastAPI()


# Initialize ChromaDB
client = chromadb.PersistentClient(path="./chroma_db")

collection = client.get_or_create_collection(
    name="knowledge_base",
    metadata={"hnsw:space": "cosine"},
)


# Initialize embedding model
model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2"
)


# Split text into overlapping chunks
def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100):
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")

    if overlap < 0 or overlap >= chunk_size:
        raise ValueError("overlap must be >= 0 and < chunk_size")

    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        start += chunk_size - overlap

    return chunks


# Upload and index a PDF
@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF file.",
        )

    pdf_bytes = await file.read()

    try:
        reader = PdfReader(BytesIO(pdf_bytes))

        chunks = []
        global_chunk_index = 0

        for page_number, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""

            if not text.strip():
                continue

            page_chunks = chunk_text(text)

            for page_chunk_index, chunk in enumerate(
                page_chunks,
                start=1,
            ):
                global_chunk_index += 1

                chunks.append({
                    "chunk_id": (
                        f"page_{page_number}_chunk_{page_chunk_index}"
                    ),
                    "chunk_index": global_chunk_index,
                    "page": page_number,
                    "text": chunk,
                })

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not read this PDF.",
        )

    if not chunks:
        raise HTTPException(
            status_code=400,
            detail="No extractable text found in this PDF.",
        )

    # Generate stable IDs based on the PDF content
    document_id = hashlib.sha256(pdf_bytes).hexdigest()[:16]

    ids = [
        f"{document_id}_{chunk['chunk_id']}"
        for chunk in chunks
    ]

    documents = [
        chunk["text"]
        for chunk in chunks
    ]

    metadatas = [
        {
            "page": chunk["page"],
            "source": file.filename,
            "chunk_index": chunk["chunk_index"],
        }
        for chunk in chunks
    ]

    # Generate embeddings
    embeddings = model.encode(
        documents,
        normalize_embeddings=True,
    ).tolist()

    # Get existing chunks belonging to this filename
    existing = collection.get(
        where={"source": file.filename},
    )

    old_ids = set(existing["ids"])
    new_ids = set(ids)

    # Store the new PDF chunks
    collection.upsert(
        ids=ids,
        documents=documents,
        metadatas=metadatas,
        embeddings=embeddings,
    )

    # Identify chunks no longer present in this PDF version
    stale_ids = list(old_ids - new_ids)

    # Delete outdated chunks belonging to this filename
    if stale_ids:
        collection.delete(ids=stale_ids)

    return {
        "filename": file.filename,
        "total_pages": len(reader.pages),
        "total_chunks": len(chunks),
        "stored_chunks": len(ids),
        "deleted_stale_chunks": len(stale_ids),
        "collection_count": collection.count(),
    }


# Request model for search
class SearchRequest(BaseModel):
    question: str
    top_k: int = 3
    source: str | None = None


# Search the knowledge base without generating an answer
@app.post("/search")
def search_knowledge_base(request: SearchRequest):
    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    if not 1 <= request.top_k <= 10:
        raise HTTPException(
            status_code=400,
            detail="top_k must be between 1 and 10.",
        )

    # Determine whether to search all documents or one source
    where_filter = (
        {"source": request.source}
        if request.source
        else None
    )

    if where_filter:
        total_documents = len(
            collection.get(where=where_filter)["ids"]
        )
    else:
        total_documents = collection.count()

    if total_documents == 0:
        raise HTTPException(
            status_code=404,
            detail="No matching documents have been indexed.",
        )

    # Embed the question
    question_embedding = model.encode(
        request.question,
        normalize_embeddings=True,
    ).tolist()

    # Retrieve the closest chunks
    query_options = {
        "query_embeddings": [question_embedding],
        "n_results": min(request.top_k, total_documents),
        "include": ["documents", "metadatas", "distances"],
    }

    if where_filter:
        query_options["where"] = where_filter

    results = collection.query(**query_options)

    matches = []

    for i, document in enumerate(results["documents"][0]):
        metadata = results["metadatas"][0][i]

        matches.append({
            "text": document,
            "page": metadata["page"],
            "source": metadata["source"],
            "distance": results["distances"][0][i],
            "chunk_index": metadata.get("chunk_index"),
        })

    return {
        "question": request.question,
        "total_results": len(matches),
        "results": matches,
    }


# Request model for asking questions
class AskRequest(BaseModel):
    question: str
    top_k: int = 3
    source: str | None = None


# Retrieve chunks and generate an answer
@app.post("/ask")
def ask_knowledge_base(request: AskRequest):
    # 1. Validate the question
    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    if not 1 <= request.top_k <= 10:
        raise HTTPException(
            status_code=400,
            detail="top_k must be between 1 and 10.",
        )

    # 2. Determine whether to search all documents or one source
    where_filter = (
        {"source": request.source}
        if request.source
        else None
    )

    if where_filter:
        total_documents = len(
            collection.get(where=where_filter)["ids"]
        )
    else:
        total_documents = collection.count()

    if total_documents == 0:
        raise HTTPException(
            status_code=404,
            detail="No matching documents have been indexed.",
        )

    # 3. Embed the question
    question_embedding = model.encode(
        request.question,
        normalize_embeddings=True,
    ).tolist()

    # 4. Retrieve the closest chunks as retrieval seeds
    query_options = {
        "query_embeddings": [question_embedding],
        "n_results": min(request.top_k, total_documents),
        "include": ["documents", "metadatas", "distances"],
    }

    if where_filter:
        query_options["where"] = where_filter

    results = collection.query(**query_options)

    seed_count = len(results["ids"][0])

    # Store selected chunks by ID to prevent duplicates
    selected_chunks = {}
    source_chunk_cache = {}

    for i in range(seed_count):
        chunk_id = results["ids"][0][i]
        metadata = results["metadatas"][0][i]
        document = results["documents"][0][i]
        distance = results["distances"][0][i]

        selected_chunks[chunk_id] = {
            "id": chunk_id,
            "text": document,
            "metadata": metadata,
            "distance": distance,
        }

    # 5. Load neighboring chunks for each selected seed
    for i in range(seed_count):
        metadata = results["metadatas"][0][i]

        source = metadata["source"]
        chunk_index = metadata.get("chunk_index")

        # Older indexed chunks may not have chunk_index
        if chunk_index is None:
            continue

        # Load this source's chunks only once
        if source not in source_chunk_cache:
            source_data = collection.get(
                where={"source": source},
                include=["documents", "metadatas"],
            )

            source_chunk_cache[source] = {}

            for neighbor_id, neighbor_text, neighbor_metadata in zip(
                source_data["ids"],
                source_data["documents"],
                source_data["metadatas"],
            ):
                neighbor_index = neighbor_metadata.get("chunk_index")

                if neighbor_index is not None:
                    source_chunk_cache[source][neighbor_index] = {
                        "id": neighbor_id,
                        "text": neighbor_text,
                        "metadata": neighbor_metadata,
                        "distance": None,
                    }

        # Add the previous and next chunks, if available
        source_chunks = source_chunk_cache[source]

        for neighbor_index in (
            chunk_index - 1,
            chunk_index + 1,
        ):
            neighbor = source_chunks.get(neighbor_index)

            if neighbor is not None:
                selected_chunks[neighbor["id"]] = neighbor

    # 6. Handle an empty retrieval result
    if not selected_chunks:
        return {
            "question": request.question,
            "answer": (
                "I couldn't find that information in the uploaded documents."
            ),
            "sources": [],
        }

    # 7. Put chunks in document order
    context_chunks = sorted(
        selected_chunks.values(),
        key=lambda item: (
            item["metadata"]["source"],
            item["metadata"].get("chunk_index", float("inf")),
        ),
    )

    # 8. Build context for Gemini
    context_parts = []

    for item in context_chunks:
        metadata = item["metadata"]

        context_parts.append(
            f"Source: {metadata['source']}\n"
            f"Page: {metadata['page']}\n"
            f"Content:\n{item['text']}"
        )

    context = "\n\n---\n\n".join(context_parts)

    # 9. Build the prompt
    prompt = f"""
You are an AI assistant answering questions using uploaded documents.

Rules:
- Answer using only the information in the provided context.
- Do not guess or invent missing facts.
- Combine information from multiple chunks when needed.
- If the context does not contain enough information to answer,
  respond exactly:
  I couldn't find that information in the uploaded documents.

Context:
{context}

Question:
{request.question}
"""

    # 10. Generate the answer
    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
    except errors.APIError as exc:
        if exc.code == 429:
            raise HTTPException(
                status_code=429,
                detail=(
                    "Gemini API quota exceeded. "
                    "Please retry when your quota resets."
                ),
            )
        raise HTTPException(
            status_code=502,
            detail="Gemini API request failed.",
        )

    # 11. Return the answer and the context sources
    sources = []

    for item in context_chunks:
        metadata = item["metadata"]

        source_item = {
            "source": metadata["source"],
            "page": metadata["page"],
            "text": item["text"],
        }

        # Neighboring chunks don't have a query distance
        if item["distance"] is not None:
            source_item["distance"] = item["distance"]

        sources.append(source_item)

    return {
        "question": request.question,
        "answer": response.text,
        "sources": sources,
    }
