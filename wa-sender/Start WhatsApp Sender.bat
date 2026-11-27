@echo off
cd /d "%~dp0"
if not exist node_modules call npm install
:loop
node sender.mjs
echo Sender stopped, restarting in 10 seconds...
timeout /t 10 >nul
goto loop
