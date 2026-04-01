import sys
import os
# Add the project root to sys.path to import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.utils.llm_service import _try_get_ayah_context

def test_ayah_detection():
    import sys
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
        
    queries = [
        "هات الآية رقم 3 سورة الحج",
        "ممكن آية 5 من سورة البقرة",
        "اية 255 سورة البقرة",
        "الآية رقم 1 من الفاتحة"
    ]
    
    for q in queries:
        print(f"Testing: {q}")
        context = _try_get_ayah_context(q)
        if context:
            print(f"Result: SUCCESS")
            print(context)
        else:
            print(f"Result: FAILED")
        print("-" * 20)

if __name__ == "__main__":
    test_ayah_detection()
