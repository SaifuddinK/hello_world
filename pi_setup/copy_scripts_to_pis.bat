@echo off
echo Copying setup scripts to Pi 1 (192.168.0.198)...
scp pi_setup\setup_pi1.sh pi3@192.168.0.198:/home/pi3/setup_pi1.sh
scp pi_setup\setup_cloudflare_pi1.sh pi3@192.168.0.198:/home/pi3/setup_cloudflare_pi1.sh
scp pi_setup\deploy.sh pi3@192.168.0.198:/home/pi3/deploy.sh

echo.
echo Copying setup scripts to Pi 2 (192.168.0.166)...
scp pi_setup\setup_pi2.sh saif@192.168.0.166:/home/saif/setup_pi2.sh

echo.
echo Done! Now run on each Pi:
echo   Pi 1: sudo bash setup_pi1.sh
echo   Pi 2: sudo bash setup_pi2.sh
echo.
pause
