@echo off
echo === NEW Balagh DB Setup Script ===
echo.

echo [1/3] Stopping and removing old containers (if any)...
cd ..\docker
docker stop balagh_postgres balagh_db_server 2>nul
docker rm balagh_postgres balagh_db_server 2>nul
docker volume rm balagh_pgdata balagh_db_data 2>nul

echo.
echo [2/3] Starting fresh PostgreSQL container...
docker-compose up -d

echo.
echo Waiting 10 seconds for DB to start...
timeout /t 10 /nobreak

echo.
echo [3/3] Running Alembic migrations...
cd ..\server
python -m alembic upgrade head 2>&1
echo.

echo === Done! ===
pause
