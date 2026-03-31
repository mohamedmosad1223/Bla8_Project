import sys
import logging
from app.utils.rag_service import retrieve_context

logging.basicConfig(level=logging.INFO)

def test_rag_query(query: str):
    print(f"\n--- Testing Query: '{query}' ---")
    
    # Retrieve top 5 most relevant contexts for the query
    context = retrieve_context(query=query, role="interested", top_k=5)
    
    if context:
        print("\n✅ Retrieved Context Data:")
        print("=" * 80)
        print(context)
        print("=" * 80)
    else:
        print("\n❌ No context retrieved (or score was below the accepted threshold).")

if __name__ == "__main__":
    # Test a few default questions, or use the one provided via terminal
    queries_to_test = [
        "ما هو الاسلام؟",
        "هل انتشر الاسلام بالسيف؟",
        "هل استخدم المسلمون الحروب لنشر الاسلام؟",
        "ما الفرق بين الحرب والغزوه؟",
        "هل الاسلام دين سلام؟"
    ]
    
    if len(sys.argv) > 1:
        queries_to_test = [" ".join(sys.argv[1:])]
        
    for q in queries_to_test:
        test_rag_query(q)
