@echo off
cd /d "%~dp0"
echo Starting backend server...
node -r ts-node/register src/server.ts
pause
