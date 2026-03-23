# Arctis — Setup Guide

## Prerequisites

| Tool | Minimum Version | Notes |
|------|----------------|-------|
| Python | 3.12 | Use pyenv or system install |
| Node.js | 20 LTS | |
| pnpm | 9+ | `npm install -g pnpm` |
| Docker | 24+ | Required for TimescaleDB |
| Git | 2.x | |

## 1. Database

Arctis uses TimescaleDB running in Docker. The development instance is shared with
algorivo-core.

```bash
# Start the existing container (if already set up)
docker start algorivo-db

# First-time setup (if container does not exist)
docker run -d \
  --name algorivo-db \
  -e POSTGRES_USER=algorivo \
  -e POSTGRES_PASSWORD=algorivo_dev \
  -e POSTGRES_DB=algorivo \
  -p 5532:5432 \
  timescale/timescaledb:latest-pg16
```

Connection string: `postgres://algorivo:algorivo_dev@localhost:5532/algorivo`

Verify connectivity:
```bash
/opt/homebrew/opt/postgresql@16/bin/psql \
  "postgres://algorivo:algorivo_dev@localhost:5532/algorivo" \
  -c "SELECT version();"
```

## 2. Backend

```bash
cd ~/arctis/engine

# Create virtualenv (first time only)
python3.12 -m venv .venv

# Activate
source .venv/bin/activate

# Install package and dev dependencies
pip install -e ".[dev]"

# Start development server
uvicorn src.arctis.main:app --port 8001 --reload
```

The API will be available at `http://localhost:8001`.

Interactive docs: `http://localhost:8001/docs`

### Environment Variables

No `.env` file is required for local development. The database URL defaults to
`postgres://algorivo:algorivo_dev@localhost:5532/algorivo`.

To override:
```bash
export ARCTIS_DB_URL="postgres://user:pass@host:port/db"
uvicorn src.arctis.main:app --port 8001 --reload
```

## 3. Frontend

```bash
cd ~/arctis/app

# Install dependencies
pnpm install

# Start development server
pnpm dev --port 5174
```

The app will be available at `http://localhost:5174`.

The frontend expects the backend at `http://localhost:8001`. To override:
```bash
VITE_API_URL=http://localhost:8001 pnpm dev --port 5174
```

## 4. Test Data

A test data generator is included:

```bash
cd ~/arctis
source engine/.venv/bin/activate
python generate_testdata.py
```

This populates the `bars` table with sample NQ futures data.

## 5. Verify Installation

After starting both services:

1. Backend health: `curl http://localhost:8001/api/markets`
   - Expected: JSON array of market objects

2. Frontend: open `http://localhost:5174`
   - Expected: Topbar shows at least one symbol, chart loads

3. WebSocket: open browser DevTools → Network → WS
   - `ws://localhost:8001/ws/bars/NQ` should show incoming bar messages

## Common Issues

**Backend fails to start — "could not connect to server"**
- Check that the Docker container is running: `docker ps | grep algorivo-db`
- Check port: `lsof -i :5532`

**Frontend shows blank panels**
- Confirm backend is running on port 8001
- Check browser console for CORS errors
- Confirm `pnpm install` completed without errors

**`uvicorn` command not found**
- Virtualenv is not activated: `source engine/.venv/bin/activate`

**pnpm version mismatch**
- Update: `npm install -g pnpm@latest`
