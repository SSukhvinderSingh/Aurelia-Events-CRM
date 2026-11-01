#!/usr/bin/env sh
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting PW5 EventsCRM FastAPI Backend on http://127.0.0.1:8000 ..."
(cd "$ROOT_DIR/backend" && ./.venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000) &
BACKEND_PID=$!

trap 'kill $BACKEND_PID 2>/dev/null || true' EXIT INT TERM

echo "Starting PW5 EventsCRM Vite Frontend on http://localhost:5173 ..."
cd "$ROOT_DIR/frontend" && npm run dev
