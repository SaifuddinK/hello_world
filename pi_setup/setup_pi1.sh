#!/bin/bash
# Pi 1 Setup — Django API + PostgreSQL
# Run as: sudo bash setup_pi1.sh

set -e
echo "======================================"
echo " StockTicker — Pi 1 Setup (API + DB)"
echo "======================================"

PI2_IP="192.168.0.166"
APP_DIR="/home/pi3/stockticker"
REPO_URL="https://github.com/SaifuddinK/hello_world.git"
DB_NAME="stockticker"
DB_USER="stockticker"
DB_PASS="stockticker_db_pass_2024"

# ── 1. System update ──────────────────────────────────────────────
echo ""
echo "[1/8] Updating system packages..."
apt-get update -qq
apt-get install -y git python3 python3-pip python3-venv postgresql postgresql-contrib nginx curl 2>/dev/null

# ── 2. Clone repo ─────────────────────────────────────────────────
echo ""
echo "[2/8] Cloning repository..."
rm -rf "$APP_DIR"
git clone "$REPO_URL" "$APP_DIR"
chown -R pi3:pi3 "$APP_DIR"

# ── 3. PostgreSQL setup ───────────────────────────────────────────
echo ""
echo "[3/8] Configuring PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Allow Pi2 to connect to PostgreSQL
echo "host $DB_NAME $DB_USER $PI2_IP/32 md5" >> /etc/postgresql/*/main/pg_hba.conf
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost,$PI2_IP'/" /etc/postgresql/*/main/postgresql.conf
systemctl restart postgresql

# ── 4. Python virtual environment ────────────────────────────────
echo ""
echo "[4/8] Setting up Python environment..."
cd "$APP_DIR/apps/api"
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -q

# ── 5. Django environment file ────────────────────────────────────
echo ""
echo "[5/8] Creating Django .env file..."
cat > "$APP_DIR/apps/api/.env" << EOF
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))")
DEBUG=False
ALLOWED_HOSTS=192.168.0.198,localhost,127.0.0.1
DB_HOST=localhost
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://192.168.0.166:3000
EOF

# ── 6. Django migrate + collectstatic ────────────────────────────
echo ""
echo "[6/8] Running migrations..."
cd "$APP_DIR/apps/api"
source .venv/bin/activate
python manage.py migrate --noinput
python manage.py collectstatic --noinput

# ── 7. Gunicorn systemd service ───────────────────────────────────
echo ""
echo "[7/8] Creating Gunicorn service..."
cat > /etc/systemd/system/stockticker-api.service << EOF
[Unit]
Description=StockTicker Django API
After=network.target postgresql.service

[Service]
User=pi3
Group=www-data
WorkingDirectory=$APP_DIR/apps/api
Environment="PATH=$APP_DIR/apps/api/.venv/bin"
EnvironmentFile=$APP_DIR/apps/api/.env
ExecStart=$APP_DIR/apps/api/.venv/bin/gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2 --timeout 120
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable stockticker-api
systemctl start stockticker-api

# ── 8. Nginx config ───────────────────────────────────────────────
echo ""
echo "[8/8] Configuring Nginx..."
cat > /etc/nginx/sites-available/stockticker-api << EOF
server {
    listen 80;
    server_name 192.168.0.198;

    location /static/ {
        alias $APP_DIR/apps/api/staticfiles/;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 120;
    }
}
EOF

ln -sf /etc/nginx/sites-available/stockticker-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
systemctl enable nginx

echo ""
echo "======================================"
echo " Pi 1 Setup COMPLETE!"
echo "======================================"
echo " API running at: http://192.168.0.198"
echo " Test: curl http://192.168.0.198/api/health/"
echo "======================================"
