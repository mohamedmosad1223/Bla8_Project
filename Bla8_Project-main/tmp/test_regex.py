import re

# Mock RAG context from the user's collection
MOCK_CONTEXT = """
الدروس المستفادة من سورة البقرة آية 10
Allah says: [Verse Text] [Source: 2:10]
(Quran 2:255) Ayat al-Kursi
Ang Al-Hajj 3 ay tungkol sa... (Hajj 22:3)
سورة الحج آية 5
(Qur'an 2:35-38) In paradise...
"""

# RegEx for numeric: (\d+):(\d+)
# RegEx for named: (?:سورة|سوره)\s+([آأإء-ي]+)\s*(?:آية|اية)?\s*(\d+)

def test_regex():
    import sys
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    
    # 1. Arabic Named
    arabic_pattern = re.compile(r"(?:سورة|سوره)\s+([آأإء-ي]+)\s*(?:آية|اية)?\s*(\d+)", re.IGNORECASE)
    # 2. Universal Numeric
    numeric_pattern = re.compile(r"(?:Qur'an|Quran|Surah|\(|\s)?\s*(\d+):(\d+)(?:-\d+)?", re.IGNORECASE)

    print("Arabic Matches:")
    for m in arabic_pattern.finditer(MOCK_CONTEXT):
        print(f"  Surah: {m.group(1)}, Ayah: {m.group(2)}")

    print("\nNumeric Matches:")
    for m in numeric_pattern.finditer(MOCK_CONTEXT):
        print(f"  Surah ID: {m.group(1)}, Ayah ID: {m.group(2)}")

if __name__ == "__main__":
    test_regex()
