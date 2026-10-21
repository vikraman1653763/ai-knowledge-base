
import chromadb
from sentence_transformers import SentenceTransformer

# Connect to the same local database
client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(
    name="knowledge_base",
    metadata={"hnsw:space": "cosine"},
)

# Load the same embedding model
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

question = input("Ask a question about your PDF:")

# Embed only the question, not the PDF again
question_embedding = model.encode(
    question,
    normalize_embeddings=True,
).tolist()

# Search for the three closest chunks
results = collection.query(
    query_embeddings=[question_embedding],
    n_results=min(3, collection.count()),
    include=["documents", "metadatas", "distances"],
)

# Display the retrieved chunks
for i, document in enumerate(results["documents"][0]):
    metadata = results["metadatas"][0][i]
    distance = results["distances"][0][i]

    print(f"\nResult {i + 1}")
    print(f"Page: {metadata['page']}")
    print(f"Source: {metadata['source']}")
    print(f"Cosine distance: {distance:.4f}")
    print(f"Text: {document}")
