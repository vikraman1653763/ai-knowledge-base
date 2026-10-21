
from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

sentence1 = "Built a configuration management service using FastAPI."
sentence2 = "Created a backend tool to manage application settings."
sentence3 = "I enjoy cooking delicious food."

# Convert all three sentences into embeddings
embeddings = model.encode(
    [sentence1, sentence2, sentence3],
    convert_to_tensor=True
)

# Compare their meanings using cosine similarity
similarity_12 = util.cos_sim(embeddings[0], embeddings[1])
similarity_13 = util.cos_sim(embeddings[0], embeddings[2])

print("Configuration vs application settings:", similarity_12.item())
print("Configuration vs cooking:", similarity_13.item())
