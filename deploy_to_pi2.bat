@echo off
echo ============================================
echo  Build Next.js and Deploy to Pi 2
echo ============================================

cd /d C:\Users\saifuddi\Workspace\my_hello_world\apps\web

echo.
echo [1/4] Setting Pi API URL...
copy .env.pi .env.local /Y

echo.
echo [2/4] Building Next.js (takes 2-3 min on PC)...
call npm run build
if errorlevel 1 (
    echo BUILD FAILED!
    pause
    exit /b 1
)

echo.
echo [3/4] Copying build to Pi 2...
echo Copying .next folder...
scp -r .next saif@192.168.0.166:/home/saif/stockticker/apps/web/

echo Copying package.json and public...
scp package.json saif@192.168.0.166:/home/saif/stockticker/apps/web/
scp -r public saif@192.168.0.166:/home/saif/stockticker/apps/web/

echo.
echo [4/4] Starting web app on Pi 2...
ssh saif@192.168.0.166 "cd /home/saif/stockticker/apps/web && pm2 delete stockticker-web 2>/dev/null; pm2 start npm --name stockticker-web -- start && pm2 save"

echo.
echo ============================================
echo  Deploy COMPLETE!
echo  Web app: http://192.168.0.166:3000
echo  API:     http://192.168.0.198:8000
echo ============================================
pause
