
import sys
import os

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.utils.rag_service import retrieve_context

def main():
    query = "ما هو القرآن"
    role = "interested"
    output_file = "tmp/rag_dump.txt"
    
    # Do not print to stdout to avoid encoding errors on Windows
    context = retrieve_context(query, role)
    
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("-" * 50 + "\n")
        f.write(f"Query: {query}\n")
        f.write(f"Context Length: {len(context)}\n")
        f.write("-" * 50 + "\n")
        f.write(context)
        f.write("\n" + "-" * 50 + "\n")
        
        # Binary check for the placeholder
        if "_challenge_" in context:
            f.write("\nFOUND '_challenge_' IN CONTEXT!\n")
        else:
            f.write("\n'_challenge_' NOT FOUND in context.\n")

if __name__ == "__main__":
    main()
