import os
import sys
from pathlib import Path

# Add the server directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

from app.utils.rag_service import embed_query, retrieve_context
from app.utils.llm_service import LLMService

def test_rag():
    print("--- Testing HF Embedding API ---")
    test_query = "ما معنى التوحيد؟"
    vector = embed_query(test_query)
    if vector:
        print(f"✅ Success! Vector dimension: {len(vector)}")
    else:
        print("❌ Failed to get embedding.")
        return

    print("\n--- Testing Qdrant Retrieval ---")
    context = retrieve_context(test_query, role="preacher")
    if context:
        print("✅ Success! Retrieved context:")
        print(context[:500] + "...")
    else:
        print("❌ No context found. Check if the collection 'islamic_knowledge' exists and has data.")

    print("\n--- Testing Full LLM Response ---")
    messages = [{"role": "user", "content": test_query}]
    response = LLMService.generate_chat_response(messages, role="preacher")
    print("Response:")
    print(response)

if __name__ == "__main__":
    test_rag()
