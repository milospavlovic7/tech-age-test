@echo off
cd /d "%~dp0"
echo ==============================================
echo Pushing Tech Age Test to GitHub...
echo Repository: https://github.com/milospavlovic7/tech-age-test
echo ==============================================
echo.
"C:\Program Files\Microsoft Visual Studio\18\Community\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\cmd\git.exe" push -u origin main
echo.
pause
