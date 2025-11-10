@echo off
REM Local development startup script for Windows

echo Paper Trail - Local Development
echo.

REM Check if virtual environment is activated
if "%VIRTUAL_ENV%"=="" (
    echo Warning: Virtual environment not activated
    echo Activating virtual environment...
    if exist ".venv\Scripts\activate.bat" (
        call .venv\Scripts\activate.bat
    ) else (
        echo Virtual environment not found. Please create one first:
        echo   python -m venv .venv
        echo   .venv\Scripts\activate
        exit /b 1
    )
)

REM Start Flask development server
echo Starting Flask development server...
echo Frontend should be started separately in another terminal:
echo   cd frontend ^&^& pnpm run dev
echo.

python -m app.main

