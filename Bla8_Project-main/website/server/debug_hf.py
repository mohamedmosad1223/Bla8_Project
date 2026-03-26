import os
from dotenv import load_dotenv
from pathlib import Path
from huggingface_hub import InferenceClient

# Use the same path as in rag_service.py
_ENV_PATH = Path(__file__).resolve().parent / ".env"
print(f"Loading env from: {_ENV_PATH}")
load_dotenv(_ENV_PATH)

token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
model = os.getenv("RAG_HF_EMBEDDING_MODEL", "intfloat/multilingual-e5-large")

print(f"Token found: {'Yes' if token else 'No'}")
if token:
    print(f"Token (first 10 chars): {token[:10]}...")
print(f"Model: {model}")

if not token:
    print("❌ Token missing in .env")
    exit(1)

client = InferenceClient(api_key=token)
try:
    print("Testing feature_extraction...")
    data = client.feature_extraction("query: Hello", model=model)
    print("✅ Success!")
    print(f"Response type: {type(data)}")
    if isinstance(data, list):
        print(f"List length: {len(data)}")
        if len(data) > 0:
            print(f"First element type: {type(data[0])}")
    elif hasattr(data, "shape"):
        print(f"Shape: {data.shape}")
except Exception as e:
    print(f"❌ Failed: {e}")
