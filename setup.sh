#!/usr/bin/env bash
set -euo pipefail

# setup.sh - one-command setup for Astro-Auth project
# - verifies required tools
# - creates missing files and folders with sensible defaults
# - creates Python virtualenv and installs requirements
# - runs npm install for Node components

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "==> Running setup.sh in $ROOT_DIR"

# Helpers
exists() { command -v "$1" >/dev/null 2>&1; }
create_if_missing() {
  local file="$1" content="$2"
  if [ ! -f "$file" ]; then
    echo "Creating $file"
    printf "%s\n" "$content" > "$file"
  else
    echo "Found $file"
  fi
}

mkdir_if_missing() { local d="$1"; if [ ! -d "$d" ]; then echo "Creating folder $d"; mkdir -p "$d"; else echo "Found folder $d"; fi }

# 1) Check basic tools
echo "Checking prerequisites..."
for TOOL in git node npm python3 python; do
  if exists $TOOL; then
    echo "  - $TOOL: found"
  else
    echo "  - $TOOL: NOT FOUND"
  fi
done

# 2) Create folders
echo "Ensuring folder structure..."
mkdir_if_missing data
mkdir_if_missing models
mkdir_if_missing config
mkdir_if_missing src
mkdir_if_missing uploads
mkdir_if_missing uploads/profile-pictures

# 3) Default files
echo "Ensuring default files..."
create_if_missing ".env" "PORT=5500\nDATABASE_HOST=127.0.0.1\nDATABASE_PORT=5432\nDATABASE_USER=youruser\nDATABASE_PASS=yourpass\nDATABASE_NAME=yourdb\nSESSION_SECRET=please-change-me\nAI_BACKEND_URL=http://127.0.0.1:8000/api/chat\nAI_BACKEND_TIMEOUT_MS=300000\n"

create_if_missing "requirements.txt" "fastapi==0.95.0\nuvicorn[standard]==0.22.0\npython-dotenv==1.0.0\nrequests==2.31.0\n"

# Minimal package.json
create_if_missing "package.json" '{
  "name": "astro-auth",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {}
}'

# 4) Python environment
PY_BIN=""
if exists python3; then PY_BIN=python3; elif exists python; then PY_BIN=python; else PY_BIN=""; fi

if [ -n "$PY_BIN" ]; then
  echo "Setting up Python virtual environment..."
  if [ ! -d "venv" ]; then
    "$PY_BIN" -m venv venv
    echo "Created venv/"
  else
    echo "Found venv/"
  fi
  # Activate and install
  # shellcheck source=/dev/null
  source venv/bin/activate || true
  if [ -f requirements.txt ]; then
    pip install --upgrade pip setuptools wheel
    pip install -r requirements.txt || true
  fi
  deactivate || true
else
  echo "Python not found; skipping virtualenv creation. Install Python 3.10+ and re-run setup.sh to complete Python setup."
fi

# 5) Node install
if exists npm; then
  echo "Installing Node dependencies (npm)..."
  npm install || true
else
  echo "npm not found; skipping npm install"
fi

# 6) Final notes
echo "\nSetup complete. Next steps:\n"
cat <<EOF
- Edit .env with your real credentials.
- If using PostgreSQL, ensure it is running and accessible at DATABASE_HOST:DATABASE_PORT.
- To run Node server: 
    npm install
    node server.js
- To run Python backend (if present):
    source venv/bin/activate
    pip install -r requirements.txt
    uvicorn server:app --reload --host 127.0.0.1 --port 8000

If you are on Windows, run this script in Git Bash or WSL, or follow the manual steps in README.md for PowerShell commands.
EOF

exit 0
