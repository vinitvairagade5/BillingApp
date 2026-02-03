@echo off
echo ==========================================
echo    Starting Billing App via Docker...
echo ==========================================

docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not installed or not in PATH.
    echo Please install Docker Desktop for Windows.
    pause
    exit /b
)

echo.
echo Stopping any running containers...
docker-compose down

echo.
echo Building and starting services...
docker-compose up -d --build

if %errorlevel% neq 0 (
    echo.
    echo Error: Failed to start services.
    pause
    exit /b
)

echo.
echo Services passed to Docker! 
echo Waiting for services to initialize (10 seconds)...
timeout /t 10 /nobreak >nul

echo.
echo Opening Application...
start http://localhost:4200

echo.
echo ==========================================
echo    App is running at http://localhost:4200
echo    API is running at http://localhost:8080
echo ==========================================
echo.
pause
