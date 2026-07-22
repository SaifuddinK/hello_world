#!/bin/bash
# Cloudflare Tunnel setup on Pi 1
# Run AFTER setup_pi1.sh
# Run as: bash setup_cloudflare_pi1.sh (NOT sudo)

set -e
echo "======================================"
echo " Cloudflare Tunnel Setup — Pi 1"
echo "======================================"

# ── 1. Install cloudflared (ARM 32-bit for Pi 2/3) ───────────────
echo "[1/3] Installing cloudflared..."
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm -O /tmp/cloudflared
sudo mv /tmp/cloudflared /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared
cloudflared --version

# ── 2. Login to Cloudflare ────────────────────────────────────────
echo ""
echo "[2/3] Login to Cloudflare..."
echo "A browser window will open — log in with your Cloudflare account."
echo "If no browser opens, copy the URL shown and open it on another device."
echo ""
cloudflared tunnel login

# ── 3. Quick tunnel (no domain needed) ───────────────────────────
echo ""
echo "[3/3] Starting tunnels..."
echo ""
echo "Starting API tunnel on port 80 (Nginx → Django)..."
echo "You will get a URL like: https://xxxx.trycloudflare.com"
echo ""
echo "NOTE: Copy this URL — you need it for:"
echo "  1. Pi 2 NEXT_PUBLIC_API_URL"
echo "  2. Mobile app API_BASE"
echo ""

# Run as a background service
sudo tee /etc/systemd/system/cloudflare-tunnel.service > /dev/null << EOF
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
User=pi3
ExecStart=/usr/local/bin/cloudflared tunnel --url http://localhost:80
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable cloudflare-tunnel
sudo systemctl start cloudflare-tunnel

echo ""
echo "Tunnel started as a system service."
echo "Check your URL with: sudo journalctl -u cloudflare-tunnel -n 20"
echo ""
echo "======================================"
echo " Cloudflare Tunnel Setup COMPLETE!"
echo "======================================"
