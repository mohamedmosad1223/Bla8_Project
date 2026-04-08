import sys
import os
print(f"Python Executable: {sys.executable}")
print(f"Python Version: {sys.version}")
print(f"Current Working Directory: {os.getcwd()}")
print(f"sys.path: {sys.path}")
try:
    import sqlalchemy
    print(f"SQLAlchemy Version: {sqlalchemy.__version__}")
    print(f"SQLAlchemy Path: {sqlalchemy.__file__}")
except ImportError as e:
    print(f"SQLAlchemy Import Failed: {e}")
