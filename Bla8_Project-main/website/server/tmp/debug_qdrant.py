import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from pathlib import Path
import requests

# Load .env
env_path = Path("e:/Bla8_Project/Bla8_Project-main/website/server/.env")
load_dotenv(env_path)

URL_QDRANT = os.getenv("URL_QDRANT")
API_KEY_QDRANT =os.getenv("API_KEY_QDRANT")
HF_TOKEN = os.getenv("HF_TOKEN")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "islamic_knowledge")
MODEL = os.getenv("RAG_HF_EMBEDDING_MODEL", "intfloat/multilingual-e5-large")

def embed(text):
    api_url = f"https://api-inference.huggingface.co/models/{MODEL}"
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    response = requests.post(api_url, headers=headers, json={"inputs": [f"query: {text}"]})
    return response.json()[0]

client = QdrantClient(url=URL_QDRANT, api_key=API_KEY_QDRANT)

query = "عيسى نبي ليس إله"
vector = embed(query)

results = client.query_points(
    collection_name=COLLECTION_NAME,
    query=vector,
    limit=5,
    with_payload=True
)

print(f"Search for: {query}")
for i, r in enumerate(results.points):
    print(f"[{i}] Score: {r.score}")
    print(f"Payload: {r.payload}")
    print("-" * 20)
