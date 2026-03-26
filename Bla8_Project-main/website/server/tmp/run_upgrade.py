import subprocess
with open('tmp/alembic_error_utf8.log', 'w', encoding='utf-8') as f:
    result = subprocess.run(['C:\\Users\\Dell\\miniconda3\\envs\\bla8\\Scripts\\alembic.exe', 'upgrade', 'head'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    f.write(result.stdout)
