@echo off
REM Wrapper to call publish_to_github.bat from scripts folder
cd /d %~dp0
call ..\publish_to_github.bat
