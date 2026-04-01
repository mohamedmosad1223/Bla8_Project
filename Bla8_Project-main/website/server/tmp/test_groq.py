import os
from groq import Groq
from dotenv import load_dotenv

# Load env from the server directory
load_dotenv(dotenv_path="e:/Bla8_Project/Bla8_Project-main/website/server/.env")

api_key = os.getenv("GROQ_API_KEY")
if api_key:
    api_key = api_key.strip("'\"")

print(f"API Key found: {'Yes' if api_key else 'No'}")

client = Groq(api_key=api_key)

try:
    print("Testing llama-3.3-70b-versatile with 10s timeout...")
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": "Hi"}],
        max_tokens=10,
        timeout=10.0
    )
    print("Response Success!")
    print(completion.choices[0].message.content)
except Exception as e:
    print(f"FAILED: {e}")

try:
    print("\nTesting llama-3.1-8b-instant...")
    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": "Hi"}],
        max_tokens=10
    )
    print("Response Success!")
    print(completion.choices[0].message.content)
except Exception as e:
    print(f"FAILED: {e}")
