@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File stop-all.ps1
