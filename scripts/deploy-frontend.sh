#!/usr/bin/env bash
#
# Build the Vite frontend locally and deploy static files to EC2 (nginx → /var/www/dist).
#
# Usage (from frontend project root):
#   npm run deploy
#   # or
#   bash scripts/deploy-frontend.sh
#
# First-time setup:
#   1. cp scripts/deploy.config.example scripts/deploy.config
#   2. cp .env.production.example .env.production   # then fill in secrets
#   3. npm install
#   4. npm run deploy
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load optional local deploy overrides
if [[ -f "$SCRIPT_DIR/deploy.config" ]]; then
  # shellcheck disable=SC1091
  source "$SCRIPT_DIR/deploy.config"
fi

SSH_KEY="${SSH_KEY:-$HOME/Downloads/service-pilot.pem}"
SSH_HOST="${SSH_HOST:-ubuntu@ec2-3-139-155-75.us-east-2.compute.amazonaws.com}"
REMOTE_WEB_ROOT="${REMOTE_WEB_ROOT:-/var/www/dist}"
REMOTE_STAGING_DIR="${REMOTE_STAGING_DIR:-/home/ubuntu/frontend-deploy-staging}"
SITE_URL="${SITE_URL:-https://services.theservicepilot.com}"
SSH_OPTS=(-i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=20)

log() { printf '\n\033[1;36m==>\033[0m %s\n' "$*"; }
die() { printf '\n\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

cd "$PROJECT_DIR"

# --- Preflight checks ---
command -v npm >/dev/null 2>&1 || die "npm is required locally (Node.js not installed on EC2)."
command -v rsync >/dev/null 2>&1 || die "rsync is required."
[[ -f "$SSH_KEY" ]] || die "SSH key not found at: $SSH_KEY (set SSH_KEY in scripts/deploy.config)"

if [[ ! -f ".env.production" ]]; then
  die ".env.production is missing. Run: cp .env.production.example .env.production and fill in production values."
fi

if [[ ! -d "node_modules" ]]; then
  log "Installing npm dependencies..."
  npm install
fi

log "Testing SSH connection to $SSH_HOST ..."
ssh "${SSH_OPTS[@]}" "$SSH_HOST" "echo 'SSH OK — $(hostname)'" || die "Cannot SSH to EC2. Check key, host, and security group."

# --- Build (production mode uses .env.production) ---
log "Building frontend for production..."
rm -rf dist
npm run build

[[ -f "dist/index.html" ]] || die "Build failed: dist/index.html not found."

# --- Upload to EC2 staging ---
log "Uploading dist/ to EC2 staging ($REMOTE_STAGING_DIR) ..."
ssh "${SSH_OPTS[@]}" "$SSH_HOST" "mkdir -p '$REMOTE_STAGING_DIR'"
rsync -az --delete --progress -e "ssh ${SSH_OPTS[*]}" \
  "$PROJECT_DIR/dist/" \
  "$SSH_HOST:$REMOTE_STAGING_DIR/"

# --- Promote to nginx web root (requires sudo on server) ---
BACKUP_NAME="dist-backup-$(date +%Y%m%d-%H%M%S)"
log "Promoting release on EC2 (backup → $REMOTE_WEB_ROOT) ..."
ssh "${SSH_OPTS[@]}" "$SSH_HOST" bash -s <<EOF
set -euo pipefail
if [[ -d "$REMOTE_WEB_ROOT" ]]; then
  sudo cp -a "$REMOTE_WEB_ROOT" "/var/www/$BACKUP_NAME"
  echo "Backup saved: /var/www/$BACKUP_NAME"
fi
sudo rsync -a --delete "$REMOTE_STAGING_DIR/" "$REMOTE_WEB_ROOT/"
sudo chown -R www-data:www-data "$REMOTE_WEB_ROOT"
sudo nginx -t
sudo systemctl reload nginx
echo "Nginx reloaded."
EOF

log "Deploy complete!"
echo "  Site: $SITE_URL"
echo "  Remote web root: $REMOTE_WEB_ROOT"
echo "  Backup (if any): /var/www/$BACKUP_NAME"
