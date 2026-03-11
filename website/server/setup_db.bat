@echo off
echo === Balagh DB Setup Script ===
echo.

echo [1/3] Checking required packages...
python -c "import psycopg2; print('  psycopg2 OK')" 2>&1
python -c "import sqlalchemy; print('  sqlalchemy OK')" 2>&1
python -c "import alembic; print('  alembic OK')" 2>&1
echo.

echo [2/3] Testing DB connection...
python -c "import psycopg2; conn=psycopg2.connect(host='localhost',port=5433,user='balagh_user',password='Balagh@2026!',dbname='balagh_db',connect_timeout=5); print('  DB connection OK'); conn.close()" 2>&1
echo.

echo [3/3] Running Alembic migrations...
python -m alembic upgrade head 2>&1
echo.

echo === Done ===
pause
