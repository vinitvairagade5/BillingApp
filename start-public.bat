@echo off
echo ==========================================
echo    Starting Public Access Tunnel...
echo ==========================================
echo.
echo Attempting to reserve: https://vinshribill.loca.lt
echo.
echo NOTE: If the specific name 'vinshribill' is taken, 
echo localtunnel might assign a random one.
echo.
echo Keep this window OPEN to keep the site online.
echo.

call npx localtunnel --port 4200 --subdomain vinshribill

pause
