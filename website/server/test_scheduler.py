import asyncio
import os
import sys

# Add the server directory to python path
sys.path.insert(0, os.path.abspath('.'))

from app.database import SessionLocal
from app.stats_scheduler import refresh_all_snapshots
import traceback

print("Testing refresh_all_snapshots()...")
try:
    refresh_all_snapshots()
    print("Success! No errors.")
except Exception as e:
    print("Error occurred:")
    traceback.print_exc()
