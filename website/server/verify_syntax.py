import ast, sys

files = [
    "app/ws_manager.py",
    "app/routers/ws_chat.py",
    "app/controllers/messages_controller.py",
    "app/routers/__init__.py",
    "app/main.py",
]

ok = True
for f in files:
    try:
        with open(f, "r", encoding="utf-8") as fh:
            ast.parse(fh.read())
        print(f"  OK  {f}")
    except SyntaxError as e:
        print(f" FAIL {f}: {e}")
        ok = False

if ok:
    print("\nAll files have valid syntax!")
else:
    print("\nSome files have syntax errors!")
    sys.exit(1)
