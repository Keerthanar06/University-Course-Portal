@echo off
title Apex University Course Portal Launcher
echo =========================================================
echo       APEX UNIVERSITY CLOUD COURSE PORTAL LAUNCHER
echo =========================================================
echo.
echo Checking environment...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH.
    echo Please install Node.js (v18+) to run this project.
    pause
    exit /b
)

echo.
echo Launching full-stack portal on Port 5000...
echo Simulating RDS DB (SQLite), S3 Storage (local folder), and VPC Security logs.
echo.
echo Open your browser and go to: http://localhost:5000/
echo.
echo Press Ctrl+C in this terminal window to stop the server.
echo.
echo ---------------------------------------------------------
node backend/server.js
pause
