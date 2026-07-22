#!/bin/bash
# Deploy latest code from GitHub to both Pis
# Run on Pi 1: bash deploy.sh
# It will update Pi 1 itself and trigger Pi 2 update via SSH

set -e
PI1_IP="192.168.0.198"
PI2_IP="192.168.0.166"
API_DIR="/home/pi3/stockticker/apps/api"
WEB_DIR="/home/saif/stockticker/apps/web"

echo "======================================"
echo " StockTicker Deploy"
echo "======================================"

# ── Update Pi 1 (API) ─────────────────────────────────────────────
echo ""
echo "[1/2] Updating API on Pi 1..."
cd /home/pi3/stockticker
git pull origin main

cd "$API_DIR"
source .venv/bin/activate
pip install -r requirements.txt -q
python manage.py migrate --noinput
python manage.py collectstatic --noinput

sudo systemctl restart stockticker-api
echo "API restarted."

# ── Update Pi 2 (Web) ─────────────────────────────────────────────
echo ""
echo "[2/2] Updating Web on Pi 2..."
ssh saif@$PI2_IP "
  cd /home/saif/stockticker &&
  git pull origin main &&
  cd apps/web &&
  npm install &&
  npm run build &&
  pm2 restart stockticker-web
"
echo "Web app restarted."

echo ""
echo "======================================"
echo " Deploy COMPLETE!"
echo "======================================"
echo " API: http://$PI1_IP"
echo " Web: http://$PI2_IP"
echo "======================================"
