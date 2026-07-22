#!/bin/bash
# Pi 2 Setup — Next.js Web App
# Run as: sudo bash setup_pi2.sh

set -e
echo "======================================"
echo " StockTicker — Pi 2 Setup (Web App)"
echo "======================================"

PI1_IP="192.168.0.198"
APP_DIR="/home/saif/stockticker"
REPO_URL="https://github.com/SaifuddinK/hello_world.git"

# ── 1. System update ──────────────────────────────────────────────
echo ""
echo "[1/6] Updating system packages..."
apt-get update -qq
apt-get install -y git curl nginx 2>/dev/null

# ── 2. Install Node.js 18 (last version supporting 32-bit ARM) ────
echo ""
echo "[2/6] Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
node --version
npm --version

# ── 3. Install PM2 ───────────────────────────────────────────────
echo ""
echo "[3/6] Installing PM2..."
npm install -g pm2

# ── 4. Clone repo ─────────────────────────────────────────────────
echo ""
echo "[4/6] Cloning repository..."
rm -rf "$APP_DIR"
git clone "$REPO_URL" "$APP_DIR"
chown -R saif:saif "$APP_DIR"

# ── 5. Build Next.js ──────────────────────────────────────────────
echo ""
echo "[5/6] Building Next.js app (this takes ~10-15 min on Pi 2)..."
cd "$APP_DIR/apps/web"

# Set API URL to Pi 1
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://$PI1_IP
EOF

npm install
npm run build

# ── 6. PM2 service ───────────────────────────────────────────────
echo ""
echo "[6/6] Starting Next.js with PM2..."
cd "$APP_DIR/apps/web"

pm2 delete stockticker-web 2>/dev/null || true
pm2 start npm --name stockticker-web -- start -- --port 3000
pm2 save

# Auto-start PM2 on reboot
pm2 startup systemd -u saif --hp /home/saif
systemctl enable pm2-saif 2>/dev/null || true

# Nginx config
cat > /etc/nginx/sites-available/stockticker-web << EOF
server {
    listen 80;
    server_name 192.168.0.166;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_read_timeout 120;
    }
}
EOF

ln -sf /etc/nginx/sites-available/stockticker-web /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
systemctl enable nginx

echo ""
echo "======================================"
echo " Pi 2 Setup COMPLETE!"
echo "======================================"
echo " Web app at: http://192.168.0.166"
echo " API at:     http://$PI1_IP"
echo "======================================"
