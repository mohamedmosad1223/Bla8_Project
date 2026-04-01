import os
import sys
from dotenv import load_dotenv

# Add parent directory to path to import app
base_dir = r"e:\Bla8_Project\Bla8_Project-main\website\server"
sys.path.append(base_dir)

load_dotenv(os.path.join(base_dir, ".env"))

def test_groq():
    print("Testing Groq...")
    from groq import Groq
    api_key = os.getenv('GROQ_API_KEY', '').strip("'\"")
    if not api_key:
        print("FAIL: GROQ_API_KEY missing")
        return
    client = Groq(api_key=api_key)
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": "Hi"}],
            model="llama-3.3-70b-versatile",
            max_tokens=10
        )
        print(f"SUCCESS: Groq response: {chat_completion.choices[0].message.content}")
    except Exception as e:
        print(f"FAIL: Groq error: {e}")

def test_hf_embedding():
    print("\nTesting HF Embedding...")
    import requests
    hf_token = os.getenv('HF_TOKEN')
    model = "intfloat/multilingual-e5-large"
    if not hf_token:
        print("FAIL: HF_TOKEN missing")
        return
    api_url = f"https://router.huggingface.co/hf-inference/models/{model}"
    headers = {"Authorization": f"Bearer {hf_token}"}
    try:
        response = requests.post(
            api_url, 
            headers=headers, 
            json={"inputs": ["query: hello"], "options": {"wait_for_model": True}},
            timeout=10
        )
        response.raise_for_status()
        print("SUCCESS: HF Embedding works")
    except Exception as e:
        print(f"FAIL: HF Embedding error: {e}")

def test_qdrant():
    print("\nTesting Qdrant...")
    from qdrant_client import QdrantClient
    url = os.getenv('URL_QDRANT')
    api_key = os.getenv('API_KEY_QDRANT')
    if not url or not api_key:
        print("FAIL: Qdrant env vars missing")
        return
    try:
        client = QdrantClient(url=url, api_key=api_key)
        collections = client.get_collections()
        print(f"SUCCESS: Qdrant connected. Collections: {collections}")
    except Exception as e:
        print(f"FAIL: Qdrant error: {e}")

if __name__ == "__main__":
    test_groq()
    test_hf_embedding()
    test_qdrant()
