# Arctis Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Trading Decision Support desktop app (Tauri + Python) that helps traders make emotion-free, rule-based decisions using market structure, volume, session, and historical probability analysis.

**Architecture:** Tauri v2 desktop shell (React+TS frontend) communicates via localhost HTTP/WebSocket with a Python FastAPI analysis engine. Data stored as Parquet (timeseries) + SQLite (config). CSV import for ES/NQ futures data.

**Tech Stack:** Python 3.13, FastAPI, Pandas, NumPy, SciPy, pytest | Tauri v2, React 19, TypeScript, TradingView Lightweight Charts | SQLite, Parquet | uv (Python), pnpm (Node)

---

## Phase 1: Foundation

### Task 1: Install Prerequisites

**Context:** System has Python 3.13 + Node 24 + npm. Missing: uv, pnpm, Rust toolchain.

**Step 1: Install uv (Python package manager)**

Run:
```bash
pip install uv
```
Expected: `Successfully installed uv-...`

Verify:
```bash
uv --version
```

**Step 2: Install pnpm**

Run:
```bash
npm install -g pnpm
```
Expected: pnpm installed globally

Verify:
```bash
pnpm --version
```

**Step 3: Install Rust toolchain**

Download and run rustup from https://rustup.rs/ — or:
```bash
winget install Rustlang.Rustup
```

After install, verify:
```bash
rustc --version
cargo --version
```

**Step 4: Install Tauri CLI**

Run:
```bash
cargo install tauri-cli --version "^2"
```

Verify:
```bash
cargo tauri --version
```

**Step 5: Commit .gitignore**

Create `C:\Users\Meriton\Arctis\.gitignore`:
```gitignore
# Python
__pycache__/
*.pyc
.venv/
*.egg-info/
dist/
.pytest_cache/

# Node
node_modules/
dist/

# Tauri
src-tauri/target/

# Data
data/*.parquet
data/*.db
*.sqlite

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

```bash
git add .gitignore
git commit -m "chore: add .gitignore"
```

---

### Task 2: Python Project Setup

**Files:**
- Create: `engine/pyproject.toml`
- Create: `engine/src/arctis/__init__.py`
- Create: `engine/src/arctis/main.py`

**Step 1: Initialize Python project with uv**

```bash
cd C:\Users\Meriton\Arctis
mkdir -p engine/src/arctis
```

Create `engine/pyproject.toml`:
```toml
[project]
name = "arctis-engine"
version = "0.1.0"
description = "Arctis Trading Decision Support - Analysis Engine"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.34",
    "pandas>=2.2",
    "numpy>=2.0",
    "scipy>=1.14",
    "pyarrow>=18.0",
    "pydantic>=2.10",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.25",
    "httpx>=0.28",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/arctis"]

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
```

**Step 2: Create initial module files**

Create `engine/src/arctis/__init__.py`:
```python
"""Arctis Trading Decision Support - Analysis Engine."""

__version__ = "0.1.0"
```

Create `engine/src/arctis/main.py`:
```python
"""FastAPI application entry point."""

from fastapi import FastAPI

app = FastAPI(
    title="Arctis Engine",
    version="0.1.0",
    description="Trading Decision Support Analysis Engine",
)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
```

**Step 3: Install dependencies**

```bash
cd C:\Users\Meriton\Arctis\engine
uv venv
uv pip install -e ".[dev]"
```

**Step 4: Verify server starts**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run uvicorn arctis.main:app --host 127.0.0.1 --port 8000
```

In another terminal: `curl http://127.0.0.1:8000/health`
Expected: `{"status":"ok","version":"0.1.0"}`

**Step 5: Write smoke test**

Create `engine/tests/__init__.py` (empty).

Create `engine/tests/test_health.py`:
```python
import pytest
from httpx import ASGITransport, AsyncClient

from arctis.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
```

**Step 6: Run test**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/ -v
```
Expected: 1 passed

**Step 7: Commit**

```bash
git add engine/
git commit -m "feat: initialize Python analysis engine with FastAPI"
```

---

### Task 3: CSV Parser & Data Models

**Files:**
- Create: `engine/src/arctis/models.py`
- Create: `engine/src/arctis/csv_parser.py`
- Create: `engine/tests/test_csv_parser.py`
- Create: `engine/tests/fixtures/sample_es_1min.csv`

**Step 1: Create data models**

Create `engine/src/arctis/models.py`:
```python
"""Core data models for Arctis."""

from enum import Enum

from pydantic import BaseModel


class Market(str, Enum):
    ES = "ES"
    NQ = "NQ"


class Timeframe(str, Enum):
    M1 = "1min"
    M5 = "5min"


class OHLCVBar(BaseModel):
    """Single OHLCV bar."""

    timestamp: int  # Unix timestamp in seconds
    open: float
    high: float
    low: float
    close: float
    volume: int


class CSVMapping(BaseModel):
    """Column mapping for CSV import."""

    timestamp_col: str = "timestamp"
    open_col: str = "open"
    high_col: str = "high"
    low_col: str = "low"
    close_col: str = "close"
    volume_col: str = "volume"
    timestamp_format: str | None = None  # None = auto-detect
    delimiter: str = ","
```

**Step 2: Create test fixture**

Create `engine/tests/fixtures/sample_es_1min.csv`:
```csv
timestamp,open,high,low,close,volume
2025-01-02 09:30:00,5950.25,5952.50,5949.00,5951.75,12543
2025-01-02 09:31:00,5951.75,5953.00,5950.50,5952.25,8721
2025-01-02 09:32:00,5952.25,5954.75,5951.00,5954.50,15234
2025-01-02 09:33:00,5954.50,5955.00,5952.75,5953.00,9876
2025-01-02 09:34:00,5953.00,5953.50,5950.00,5950.25,11234
2025-01-02 09:35:00,5950.25,5951.00,5948.50,5949.00,18765
2025-01-02 09:36:00,5949.00,5950.75,5947.25,5950.50,14321
2025-01-02 09:37:00,5950.50,5953.25,5950.00,5953.00,10567
2025-01-02 09:38:00,5953.00,5956.00,5952.50,5955.75,22341
2025-01-02 09:39:00,5955.75,5957.25,5955.00,5956.50,16789
```

**Step 3: Write failing tests**

Create `engine/tests/test_csv_parser.py`:
```python
import pytest
from pathlib import Path

from arctis.csv_parser import parse_csv
from arctis.models import CSVMapping, OHLCVBar

FIXTURES = Path(__file__).parent / "fixtures"


def test_parse_csv_default_mapping():
    bars = parse_csv(FIXTURES / "sample_es_1min.csv")
    assert len(bars) == 10
    assert isinstance(bars[0], OHLCVBar)


def test_parse_csv_first_bar_values():
    bars = parse_csv(FIXTURES / "sample_es_1min.csv")
    bar = bars[0]
    assert bar.open == 5950.25
    assert bar.high == 5952.50
    assert bar.low == 5949.00
    assert bar.close == 5951.75
    assert bar.volume == 12543


def test_parse_csv_timestamps_ascending():
    bars = parse_csv(FIXTURES / "sample_es_1min.csv")
    timestamps = [b.timestamp for b in bars]
    assert timestamps == sorted(timestamps)


def test_parse_csv_custom_mapping():
    mapping = CSVMapping(delimiter=",", timestamp_col="timestamp")
    bars = parse_csv(FIXTURES / "sample_es_1min.csv", mapping=mapping)
    assert len(bars) == 10


def test_parse_csv_empty_file(tmp_path):
    csv_file = tmp_path / "empty.csv"
    csv_file.write_text("timestamp,open,high,low,close,volume\n")
    bars = parse_csv(csv_file)
    assert bars == []


def test_parse_csv_file_not_found():
    with pytest.raises(FileNotFoundError):
        parse_csv(Path("/nonexistent/file.csv"))
```

**Step 4: Run tests to verify they fail**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/test_csv_parser.py -v
```
Expected: FAIL (ImportError: cannot import name 'parse_csv')

**Step 5: Implement CSV parser**

Create `engine/src/arctis/csv_parser.py`:
```python
"""CSV parser for OHLCV market data."""

from pathlib import Path

import pandas as pd

from arctis.models import CSVMapping, OHLCVBar


def parse_csv(
    file_path: Path,
    mapping: CSVMapping | None = None,
) -> list[OHLCVBar]:
    """Parse a CSV file into a list of OHLCVBar objects.

    Args:
        file_path: Path to the CSV file.
        mapping: Column mapping configuration. Uses defaults if None.

    Returns:
        List of OHLCVBar objects sorted by timestamp ascending.

    Raises:
        FileNotFoundError: If the CSV file does not exist.
    """
    file_path = Path(file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"CSV file not found: {file_path}")

    if mapping is None:
        mapping = CSVMapping()

    df = pd.read_csv(file_path, delimiter=mapping.delimiter)

    if df.empty:
        return []

    # Parse timestamps
    ts_col = mapping.timestamp_col
    if mapping.timestamp_format:
        df[ts_col] = pd.to_datetime(df[ts_col], format=mapping.timestamp_format)
    else:
        df[ts_col] = pd.to_datetime(df[ts_col])

    # Convert to unix timestamp (seconds)
    df["_ts_unix"] = df[ts_col].astype("int64") // 10**9

    # Sort by time
    df = df.sort_values("_ts_unix").reset_index(drop=True)

    bars = [
        OHLCVBar(
            timestamp=int(row["_ts_unix"]),
            open=float(row[mapping.open_col]),
            high=float(row[mapping.high_col]),
            low=float(row[mapping.low_col]),
            close=float(row[mapping.close_col]),
            volume=int(row[mapping.volume_col]),
        )
        for _, row in df.iterrows()
    ]
    return bars
```

**Step 6: Run tests**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/test_csv_parser.py -v
```
Expected: 6 passed

**Step 7: Commit**

```bash
git add engine/src/arctis/models.py engine/src/arctis/csv_parser.py engine/tests/
git commit -m "feat: add CSV parser with OHLCV data models"
```

---

### Task 4: Parquet Storage Layer

**Files:**
- Create: `engine/src/arctis/storage.py`
- Create: `engine/tests/test_storage.py`

**Step 1: Write failing tests**

Create `engine/tests/test_storage.py`:
```python
import pytest
from pathlib import Path

from arctis.storage import ParquetStore
from arctis.models import Market, Timeframe, OHLCVBar


@pytest.fixture
def store(tmp_path):
    return ParquetStore(data_dir=tmp_path)


@pytest.fixture
def sample_bars():
    return [
        OHLCVBar(timestamp=1735819800, open=5950.25, high=5952.50, low=5949.00, close=5951.75, volume=12543),
        OHLCVBar(timestamp=1735819860, open=5951.75, high=5953.00, low=5950.50, close=5952.25, volume=8721),
        OHLCVBar(timestamp=1735819920, open=5952.25, high=5954.75, low=5951.00, close=5954.50, volume=15234),
    ]


def test_save_and_load(store, sample_bars):
    store.save(Market.ES, Timeframe.M1, sample_bars)
    loaded = store.load(Market.ES, Timeframe.M1)
    assert len(loaded) == 3
    assert loaded[0].open == 5950.25


def test_load_empty(store):
    loaded = store.load(Market.ES, Timeframe.M1)
    assert loaded == []


def test_save_appends(store, sample_bars):
    store.save(Market.ES, Timeframe.M1, sample_bars[:2])
    store.save(Market.ES, Timeframe.M1, sample_bars[2:])
    loaded = store.load(Market.ES, Timeframe.M1)
    assert len(loaded) == 3


def test_save_deduplicates(store, sample_bars):
    store.save(Market.ES, Timeframe.M1, sample_bars)
    store.save(Market.ES, Timeframe.M1, sample_bars)
    loaded = store.load(Market.ES, Timeframe.M1)
    assert len(loaded) == 3


def test_load_time_range(store, sample_bars):
    store.save(Market.ES, Timeframe.M1, sample_bars)
    loaded = store.load(Market.ES, Timeframe.M1, start_ts=1735819860, end_ts=1735819920)
    assert len(loaded) == 2
    assert loaded[0].timestamp == 1735819860


def test_separate_markets(store, sample_bars):
    store.save(Market.ES, Timeframe.M1, sample_bars)
    loaded_nq = store.load(Market.NQ, Timeframe.M1)
    assert loaded_nq == []
```

**Step 2: Run tests to verify they fail**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/test_storage.py -v
```
Expected: FAIL (ImportError)

**Step 3: Implement storage**

Create `engine/src/arctis/storage.py`:
```python
"""Parquet-based storage for OHLCV timeseries data."""

from pathlib import Path

import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

from arctis.models import Market, OHLCVBar, Timeframe


class ParquetStore:
    """Stores OHLCV data as Parquet files, one file per market+timeframe."""

    def __init__(self, data_dir: Path):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def _file_path(self, market: Market, timeframe: Timeframe) -> Path:
        return self.data_dir / f"{market.value}_{timeframe.value}.parquet"

    def save(self, market: Market, timeframe: Timeframe, bars: list[OHLCVBar]) -> None:
        """Save bars to Parquet, appending to existing data and deduplicating."""
        if not bars:
            return

        new_df = pd.DataFrame([b.model_dump() for b in bars])
        path = self._file_path(market, timeframe)

        if path.exists():
            existing_df = pd.read_parquet(path)
            combined = pd.concat([existing_df, new_df], ignore_index=True)
            combined = combined.drop_duplicates(subset=["timestamp"], keep="last")
            combined = combined.sort_values("timestamp").reset_index(drop=True)
        else:
            combined = new_df.sort_values("timestamp").reset_index(drop=True)

        combined.to_parquet(path, index=False)

    def load(
        self,
        market: Market,
        timeframe: Timeframe,
        start_ts: int | None = None,
        end_ts: int | None = None,
    ) -> list[OHLCVBar]:
        """Load bars from Parquet, optionally filtering by time range."""
        path = self._file_path(market, timeframe)
        if not path.exists():
            return []

        df = pd.read_parquet(path)

        if start_ts is not None:
            df = df[df["timestamp"] >= start_ts]
        if end_ts is not None:
            df = df[df["timestamp"] <= end_ts]

        df = df.sort_values("timestamp").reset_index(drop=True)
        return [OHLCVBar(**row) for _, row in df.iterrows()]
```

**Step 4: Run tests**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/test_storage.py -v
```
Expected: 6 passed

**Step 5: Commit**

```bash
git add engine/src/arctis/storage.py engine/tests/test_storage.py
git commit -m "feat: add Parquet storage layer for OHLCV data"
```

---

### Task 5: CSV Import API Endpoint

**Files:**
- Modify: `engine/src/arctis/main.py`
- Create: `engine/tests/test_import_api.py`

**Step 1: Write failing test**

Create `engine/tests/test_import_api.py`:
```python
import pytest
from pathlib import Path
from httpx import ASGITransport, AsyncClient

from arctis.main import app

FIXTURES = Path(__file__).parent / "fixtures"


@pytest.mark.asyncio
async def test_import_csv():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with open(FIXTURES / "sample_es_1min.csv", "rb") as f:
            response = await client.post(
                "/api/import",
                files={"file": ("es_1min.csv", f, "text/csv")},
                data={"market": "ES", "timeframe": "1min"},
            )
    assert response.status_code == 200
    data = response.json()
    assert data["bars_imported"] == 10
    assert data["market"] == "ES"


@pytest.mark.asyncio
async def test_import_csv_invalid_market():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with open(FIXTURES / "sample_es_1min.csv", "rb") as f:
            response = await client.post(
                "/api/import",
                files={"file": ("test.csv", f, "text/csv")},
                data={"market": "INVALID", "timeframe": "1min"},
            )
    assert response.status_code == 422
```

**Step 2: Run test to verify it fails**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/test_import_api.py -v
```
Expected: FAIL

**Step 3: Implement import endpoint**

Update `engine/src/arctis/main.py`:
```python
"""FastAPI application entry point."""

import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, UploadFile

from arctis.csv_parser import parse_csv
from arctis.models import Market, Timeframe
from arctis.storage import ParquetStore

DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"
store = ParquetStore(data_dir=DATA_DIR)

app = FastAPI(
    title="Arctis Engine",
    version="0.1.0",
    description="Trading Decision Support Analysis Engine",
)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


@app.post("/api/import")
async def import_csv(
    file: UploadFile = File(...),
    market: Market = Form(...),
    timeframe: Timeframe = Form(...),
):
    """Import OHLCV data from a CSV file."""
    with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        bars = parse_csv(tmp_path)
        store.save(market, timeframe, bars)
        return {
            "market": market.value,
            "timeframe": timeframe.value,
            "bars_imported": len(bars),
        }
    finally:
        tmp_path.unlink(missing_ok=True)
```

Note: For testing, we need to override the store. Update the test to handle this — or accept that the test uses a real temp store (acceptable for MVP). The import endpoint uses a module-level store pointing to `data/` — tests will create this dir temporarily.

**Step 4: Run tests**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/ -v
```
Expected: All tests pass

**Step 5: Commit**

```bash
git add engine/
git commit -m "feat: add CSV import API endpoint"
```

---

### Task 6: Tauri + React Project Scaffold

**Files:**
- Create: `app/` directory (Tauri + React project)

**Step 1: Create Tauri project**

```bash
cd C:\Users\Meriton\Arctis
pnpm create tauri-app app --template react-ts --manager pnpm
```

If the interactive scaffolder asks:
- Project name: `arctis`
- Frontend: React + TypeScript
- Package manager: pnpm

**Step 2: Install dependencies**

```bash
cd C:\Users\Meriton\Arctis\app
pnpm install
```

**Step 3: Verify dev build**

```bash
cd C:\Users\Meriton\Arctis\app
pnpm tauri dev
```
Expected: Tauri window opens with default React page

**Step 4: Clean up default content**

Replace `app/src/App.tsx`:
```tsx
function App() {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Arctis</h1>
      <p>Trading Decision Support</p>
      <p style={{ color: "#666" }}>Engine: connecting...</p>
    </div>
  );
}

export default App;
```

Remove default CSS content from `app/src/App.css` (keep the file, empty it).

**Step 5: Verify clean build**

```bash
cd C:\Users\Meriton\Arctis\app
pnpm tauri dev
```
Expected: Window shows "Arctis - Trading Decision Support"

**Step 6: Commit**

```bash
git add app/
git commit -m "feat: scaffold Tauri + React desktop app"
```

---

### Task 7: Python Subprocess Management (Tauri ↔ Python IPC)

**Files:**
- Modify: `app/src-tauri/src/lib.rs` (or `main.rs` depending on Tauri scaffold)
- Create: `app/src/api.ts`
- Modify: `app/src/App.tsx`

**Step 1: Configure Tauri to spawn Python**

In `app/src-tauri/src/lib.rs`, add a sidecar/subprocess setup that starts the Python FastAPI server when the app launches and kills it on exit.

For Tauri v2, use the `tauri-plugin-shell` approach or `std::process::Command`:

```rust
use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;

struct PythonProcess(Mutex<Option<Child>>);

#[tauri::command]
fn get_engine_url() -> String {
    "http://127.0.0.1:8000".to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Start Python engine
            let engine_dir = app
                .path()
                .resource_dir()
                .unwrap_or_default()
                .join("../../engine");

            let child = Command::new("python")
                .args(["-m", "uvicorn", "arctis.main:app", "--host", "127.0.0.1", "--port", "8000"])
                .current_dir(&engine_dir)
                .spawn()
                .expect("Failed to start Python engine");

            app.manage(PythonProcess(Mutex::new(Some(child))));
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                if let Some(state) = window.try_state::<PythonProcess>() {
                    if let Ok(mut guard) = state.0.lock() {
                        if let Some(mut child) = guard.take() {
                            let _ = child.kill();
                        }
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![get_engine_url])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 2: Create frontend API client**

Create `app/src/api.ts`:
```typescript
const ENGINE_URL = "http://127.0.0.1:8000";

export async function checkHealth(): Promise<{ status: string; version: string }> {
  const res = await fetch(`${ENGINE_URL}/health`);
  if (!res.ok) throw new Error(`Engine health check failed: ${res.status}`);
  return res.json();
}

export async function importCSV(
  file: File,
  market: "ES" | "NQ",
  timeframe: "1min" | "5min"
): Promise<{ market: string; timeframe: string; bars_imported: number }> {
  const form = new FormData();
  form.append("file", file);
  form.append("market", market);
  form.append("timeframe", timeframe);
  const res = await fetch(`${ENGINE_URL}/api/import`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Import failed: ${res.status}`);
  return res.json();
}
```

**Step 3: Update App to show engine status**

Update `app/src/App.tsx`:
```tsx
import { useEffect, useState } from "react";
import { checkHealth } from "./api";

function App() {
  const [engineStatus, setEngineStatus] = useState<string>("connecting...");

  useEffect(() => {
    const check = async () => {
      try {
        const health = await checkHealth();
        setEngineStatus(`online (v${health.version})`);
      } catch {
        setEngineStatus("offline");
      }
    };
    // Retry every 2s until connected
    const interval = setInterval(check, 2000);
    check();
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Arctis</h1>
      <p>Trading Decision Support</p>
      <p style={{ color: engineStatus === "offline" ? "#e74c3c" : "#27ae60" }}>
        Engine: {engineStatus}
      </p>
    </div>
  );
}

export default App;
```

**Step 4: Test end-to-end**

1. Start Python engine manually: `cd engine && uv run uvicorn arctis.main:app --host 127.0.0.1 --port 8000`
2. Start Tauri app: `cd app && pnpm tauri dev`
3. Verify: App shows "Engine: online (v0.1.0)"

**Step 5: Commit**

```bash
git add app/ engine/
git commit -m "feat: connect Tauri app to Python engine via localhost"
```

---

## Phase 2: Core Analysis Modules

### Task 8: Module A — Market Structure Analysis

**Files:**
- Create: `engine/src/arctis/analysis/__init__.py`
- Create: `engine/src/arctis/analysis/structure.py`
- Create: `engine/tests/test_structure.py`

**Step 1: Write failing tests**

Create `engine/src/arctis/analysis/__init__.py` (empty).

Create `engine/tests/test_structure.py`:
```python
import pytest
from arctis.models import OHLCVBar
from arctis.analysis.structure import (
    detect_swings,
    classify_trend,
    detect_structure_breaks,
    SwingPoint,
    SwingType,
    TrendState,
    StructureBreak,
)


def make_bars(closes: list[float], base_ts: int = 1000000) -> list[OHLCVBar]:
    """Helper: create bars from close prices. High=close+1, Low=close-1."""
    return [
        OHLCVBar(
            timestamp=base_ts + i * 60,
            open=c,
            high=c + 1.0,
            low=c - 1.0,
            close=c,
            volume=1000,
        )
        for i, c in enumerate(closes)
    ]


class TestSwingDetection:
    def test_finds_swing_high(self):
        # Pattern: low, higher, highest, lower, low
        bars = make_bars([10, 12, 15, 12, 10])
        swings = detect_swings(bars, lookback=2)
        highs = [s for s in swings if s.type == SwingType.HIGH]
        assert len(highs) == 1
        assert highs[0].price == 16.0  # close(15) + 1 = high

    def test_finds_swing_low(self):
        bars = make_bars([15, 12, 10, 12, 15])
        swings = detect_swings(bars, lookback=2)
        lows = [s for s in swings if s.type == SwingType.LOW]
        assert len(lows) == 1
        assert lows[0].price == 9.0  # close(10) - 1 = low

    def test_no_swings_in_flat(self):
        bars = make_bars([10, 10, 10, 10, 10])
        swings = detect_swings(bars, lookback=2)
        assert len(swings) == 0


class TestTrendClassification:
    def test_uptrend(self):
        # HH + HL pattern
        swings = [
            SwingPoint(type=SwingType.LOW, price=100, index=0, timestamp=1000),
            SwingPoint(type=SwingType.HIGH, price=110, index=2, timestamp=1120),
            SwingPoint(type=SwingType.LOW, price=105, index=4, timestamp=1240),
            SwingPoint(type=SwingType.HIGH, price=115, index=6, timestamp=1360),
        ]
        trend = classify_trend(swings)
        assert trend == TrendState.UPTREND

    def test_downtrend(self):
        swings = [
            SwingPoint(type=SwingType.HIGH, price=115, index=0, timestamp=1000),
            SwingPoint(type=SwingType.LOW, price=105, index=2, timestamp=1120),
            SwingPoint(type=SwingType.HIGH, price=110, index=4, timestamp=1240),
            SwingPoint(type=SwingType.LOW, price=100, index=6, timestamp=1360),
        ]
        trend = classify_trend(swings)
        assert trend == TrendState.DOWNTREND

    def test_range(self):
        swings = [
            SwingPoint(type=SwingType.LOW, price=100, index=0, timestamp=1000),
            SwingPoint(type=SwingType.HIGH, price=110, index=2, timestamp=1120),
            SwingPoint(type=SwingType.LOW, price=101, index=4, timestamp=1240),
            SwingPoint(type=SwingType.HIGH, price=109, index=6, timestamp=1360),
        ]
        trend = classify_trend(swings)
        assert trend == TrendState.RANGE


class TestStructureBreaks:
    def test_detects_bos(self):
        swings = [
            SwingPoint(type=SwingType.LOW, price=100, index=0, timestamp=1000),
            SwingPoint(type=SwingType.HIGH, price=110, index=2, timestamp=1120),
            SwingPoint(type=SwingType.LOW, price=105, index=4, timestamp=1240),
            SwingPoint(type=SwingType.HIGH, price=115, index=6, timestamp=1360),
        ]
        breaks = detect_structure_breaks(swings)
        assert len(breaks) >= 1
        assert breaks[0].break_type == "BOS"
```

**Step 2: Run tests to verify they fail**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/test_structure.py -v
```

**Step 3: Implement structure analysis**

Create `engine/src/arctis/analysis/structure.py`:
```python
"""Market structure analysis: swings, trends, structure breaks."""

from dataclasses import dataclass
from enum import Enum

from arctis.models import OHLCVBar


class SwingType(str, Enum):
    HIGH = "high"
    LOW = "low"


class TrendState(str, Enum):
    UPTREND = "uptrend"
    DOWNTREND = "downtrend"
    RANGE = "range"


@dataclass
class SwingPoint:
    type: SwingType
    price: float
    index: int
    timestamp: int


@dataclass
class StructureBreak:
    break_type: str  # "BOS" (Break of Structure) or "CHoCH" (Change of Character)
    price: float
    index: int
    timestamp: int
    direction: str  # "bullish" or "bearish"


def detect_swings(bars: list[OHLCVBar], lookback: int = 5) -> list[SwingPoint]:
    """Detect swing highs and lows using lookback window.

    A swing high is a bar whose high is higher than the highs
    of the `lookback` bars on each side.
    """
    swings: list[SwingPoint] = []
    n = len(bars)

    for i in range(lookback, n - lookback):
        # Check swing high
        is_high = all(
            bars[i].high > bars[i + j].high and bars[i].high > bars[i - j].high
            for j in range(1, lookback + 1)
        )
        if is_high:
            swings.append(SwingPoint(
                type=SwingType.HIGH,
                price=bars[i].high,
                index=i,
                timestamp=bars[i].timestamp,
            ))

        # Check swing low
        is_low = all(
            bars[i].low < bars[i + j].low and bars[i].low < bars[i - j].low
            for j in range(1, lookback + 1)
        )
        if is_low:
            swings.append(SwingPoint(
                type=SwingType.LOW,
                price=bars[i].low,
                index=i,
                timestamp=bars[i].timestamp,
            ))

    swings.sort(key=lambda s: s.index)
    return swings


def classify_trend(swings: list[SwingPoint]) -> TrendState:
    """Classify trend based on swing sequence.

    Uptrend: Higher Highs + Higher Lows
    Downtrend: Lower Highs + Lower Lows
    Range: everything else
    """
    highs = [s for s in swings if s.type == SwingType.HIGH]
    lows = [s for s in swings if s.type == SwingType.LOW]

    if len(highs) < 2 or len(lows) < 2:
        return TrendState.RANGE

    hh = all(highs[i].price > highs[i - 1].price for i in range(1, len(highs)))
    hl = all(lows[i].price > lows[i - 1].price for i in range(1, len(lows)))

    lh = all(highs[i].price < highs[i - 1].price for i in range(1, len(highs)))
    ll = all(lows[i].price < lows[i - 1].price for i in range(1, len(lows)))

    if hh and hl:
        return TrendState.UPTREND
    elif lh and ll:
        return TrendState.DOWNTREND
    else:
        return TrendState.RANGE


def detect_structure_breaks(swings: list[SwingPoint]) -> list[StructureBreak]:
    """Detect Break of Structure (BOS) and Change of Character (CHoCH).

    BOS: In uptrend, price breaks above previous swing high (continuation).
    CHoCH: In uptrend, price breaks below previous swing low (reversal).
    """
    breaks: list[StructureBreak] = []
    highs = [s for s in swings if s.type == SwingType.HIGH]
    lows = [s for s in swings if s.type == SwingType.LOW]

    # Detect BOS for highs (bullish continuation)
    for i in range(1, len(highs)):
        if highs[i].price > highs[i - 1].price:
            breaks.append(StructureBreak(
                break_type="BOS",
                price=highs[i].price,
                index=highs[i].index,
                timestamp=highs[i].timestamp,
                direction="bullish",
            ))

    # Detect BOS for lows (bearish continuation)
    for i in range(1, len(lows)):
        if lows[i].price < lows[i - 1].price:
            breaks.append(StructureBreak(
                break_type="BOS",
                price=lows[i].price,
                index=lows[i].index,
                timestamp=lows[i].timestamp,
                direction="bearish",
            ))

    # Detect CHoCH: trend reversal signals
    # In an uptrend sequence, a lower low signals CHoCH bearish
    for i in range(1, len(lows)):
        prev_highs = [h for h in highs if h.index < lows[i].index]
        if len(prev_highs) >= 2:
            if prev_highs[-1].price > prev_highs[-2].price and lows[i].price < lows[i - 1].price:
                breaks.append(StructureBreak(
                    break_type="CHoCH",
                    price=lows[i].price,
                    index=lows[i].index,
                    timestamp=lows[i].timestamp,
                    direction="bearish",
                ))

    breaks.sort(key=lambda b: b.index)
    return breaks
```

**Step 4: Run tests**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/test_structure.py -v
```
Expected: All pass

**Step 5: Commit**

```bash
git add engine/src/arctis/analysis/ engine/tests/test_structure.py
git commit -m "feat: add market structure analysis (swings, trends, BOS/CHoCH)"
```

---

### Task 9: Module B — Volume Analysis

**Files:**
- Create: `engine/src/arctis/analysis/volume.py`
- Create: `engine/tests/test_volume.py`

**Step 1: Write failing tests**

Create `engine/tests/test_volume.py`:
```python
import pytest
import numpy as np
from arctis.models import OHLCVBar
from arctis.analysis.volume import (
    relative_volume,
    detect_volume_spikes,
    VolumeSpike,
)


def make_bars_with_volume(volumes: list[int], base_ts: int = 1000000) -> list[OHLCVBar]:
    return [
        OHLCVBar(
            timestamp=base_ts + i * 60,
            open=100.0, high=101.0, low=99.0, close=100.0,
            volume=v,
        )
        for i, v in enumerate(volumes)
    ]


class TestRelativeVolume:
    def test_basic(self):
        bars = make_bars_with_volume([100, 100, 100, 100, 200])
        rvol = relative_volume(bars, period=4)
        # Last bar volume (200) / mean of prev 4 (100) = 2.0
        assert rvol[-1] == pytest.approx(2.0)

    def test_returns_none_for_insufficient_data(self):
        bars = make_bars_with_volume([100, 200])
        rvol = relative_volume(bars, period=4)
        assert rvol[0] is None  # Not enough lookback


class TestVolumeSpikes:
    def test_detects_spike(self):
        # 19 normal bars + 1 huge spike
        volumes = [1000] * 19 + [5000]
        bars = make_bars_with_volume(volumes)
        spikes = detect_volume_spikes(bars, period=10, threshold_sigma=2.0)
        assert len(spikes) >= 1
        assert spikes[-1].index == 19
        assert spikes[-1].ratio > 2.0

    def test_no_spike_in_flat(self):
        volumes = [1000] * 20
        bars = make_bars_with_volume(volumes)
        spikes = detect_volume_spikes(bars, period=10, threshold_sigma=2.0)
        assert len(spikes) == 0
```

**Step 2: Run to verify failure**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/test_volume.py -v
```

**Step 3: Implement volume analysis**

Create `engine/src/arctis/analysis/volume.py`:
```python
"""Volume analysis: relative volume, spikes, session normalization."""

from dataclasses import dataclass

import numpy as np

from arctis.models import OHLCVBar


@dataclass
class VolumeSpike:
    index: int
    timestamp: int
    volume: int
    ratio: float  # volume / mean


def relative_volume(
    bars: list[OHLCVBar], period: int = 20
) -> list[float | None]:
    """Calculate relative volume (current / rolling mean).

    Returns None for bars without enough lookback data.
    """
    result: list[float | None] = []
    volumes = [b.volume for b in bars]

    for i in range(len(volumes)):
        if i < period:
            result.append(None)
        else:
            window = volumes[i - period : i]
            mean = np.mean(window)
            result.append(float(volumes[i] / mean) if mean > 0 else None)

    return result


def detect_volume_spikes(
    bars: list[OHLCVBar],
    period: int = 20,
    threshold_sigma: float = 2.0,
) -> list[VolumeSpike]:
    """Detect volume spikes exceeding threshold standard deviations above rolling mean."""
    spikes: list[VolumeSpike] = []
    volumes = np.array([b.volume for b in bars], dtype=float)

    for i in range(period, len(volumes)):
        window = volumes[i - period : i]
        mean = np.mean(window)
        std = np.std(window)

        if std > 0 and volumes[i] > mean + threshold_sigma * std:
            spikes.append(VolumeSpike(
                index=i,
                timestamp=bars[i].timestamp,
                volume=int(volumes[i]),
                ratio=float(volumes[i] / mean),
            ))

    return spikes
```

**Step 4: Run tests**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/test_volume.py -v
```
Expected: All pass

**Step 5: Commit**

```bash
git add engine/src/arctis/analysis/volume.py engine/tests/test_volume.py
git commit -m "feat: add volume analysis (relative volume, spike detection)"
```

---

### Task 10: Module C — Session & Time Logic

**Files:**
- Create: `engine/src/arctis/analysis/sessions.py`
- Create: `engine/tests/test_sessions.py`

**Step 1: Write failing tests**

Create `engine/tests/test_sessions.py`:
```python
import pytest
from datetime import datetime, timezone
from arctis.analysis.sessions import (
    Session,
    classify_session,
    get_session_stats,
    SessionStats,
)
from arctis.models import OHLCVBar


def ts(hour: int, minute: int = 0) -> int:
    """Create unix timestamp for a given ET hour on 2025-01-02."""
    # 2025-01-02 in ET (UTC-5)
    dt = datetime(2025, 1, 2, hour, minute, tzinfo=timezone.utc)
    # Offset for ET: add 5 hours to represent ET as UTC
    from datetime import timedelta
    et_dt = dt + timedelta(hours=5)
    return int(et_dt.timestamp())


class TestClassifySession:
    def test_premarket(self):
        assert classify_session(ts(7, 0)) == Session.PREMARKET

    def test_ny_open(self):
        assert classify_session(ts(9, 45)) == Session.NY_OPEN

    def test_midday(self):
        assert classify_session(ts(12, 0)) == Session.MIDDAY

    def test_power_hour(self):
        assert classify_session(ts(15, 0)) == Session.POWER_HOUR

    def test_after_hours(self):
        assert classify_session(ts(17, 0)) == Session.AFTER_HOURS


class TestSessionStats:
    def test_basic_stats(self):
        bars = [
            OHLCVBar(timestamp=ts(9, 30 + i), open=100, high=101 + i * 0.5, low=99, close=100 + i * 0.5, volume=1000 + i * 100)
            for i in range(30)
        ]
        stats = get_session_stats(bars)
        assert Session.NY_OPEN in stats
        assert stats[Session.NY_OPEN].bar_count > 0
        assert stats[Session.NY_OPEN].avg_volume > 0
        assert stats[Session.NY_OPEN].avg_range > 0
```

**Step 2: Run to verify failure**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/test_sessions.py -v
```

**Step 3: Implement session logic**

Create `engine/src/arctis/analysis/sessions.py`:
```python
"""Session and time-based analysis."""

from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from enum import Enum

from arctis.models import OHLCVBar

# US Eastern timezone offset (simplified: -5 for EST, -4 for EDT)
# For MVP, use fixed EST. Future: proper timezone handling.
ET_OFFSET = timedelta(hours=-5)


class Session(str, Enum):
    PREMARKET = "premarket"      # 04:00-09:30 ET
    NY_OPEN = "ny_open"          # 09:30-10:30 ET
    MIDDAY = "midday"            # 10:30-14:00 ET
    POWER_HOUR = "power_hour"    # 14:00-16:00 ET
    AFTER_HOURS = "after_hours"  # 16:00-20:00 ET
    CLOSED = "closed"            # 20:00-04:00 ET


@dataclass
class SessionStats:
    session: Session
    bar_count: int
    avg_volume: float
    avg_range: float  # average high-low range
    total_volume: int


def _to_et_hour_minute(unix_ts: int) -> tuple[int, int]:
    """Convert unix timestamp to ET hour and minute."""
    utc_dt = datetime.fromtimestamp(unix_ts, tz=timezone.utc)
    et_dt = utc_dt + ET_OFFSET
    return et_dt.hour, et_dt.minute


def classify_session(unix_ts: int) -> Session:
    """Classify a timestamp into a trading session."""
    hour, minute = _to_et_hour_minute(unix_ts)
    time_val = hour * 60 + minute  # minutes since midnight

    if time_val < 240:      # before 04:00
        return Session.CLOSED
    elif time_val < 570:    # 04:00 - 09:30
        return Session.PREMARKET
    elif time_val < 630:    # 09:30 - 10:30
        return Session.NY_OPEN
    elif time_val < 840:    # 10:30 - 14:00
        return Session.MIDDAY
    elif time_val < 960:    # 14:00 - 16:00
        return Session.POWER_HOUR
    elif time_val < 1200:   # 16:00 - 20:00
        return Session.AFTER_HOURS
    else:
        return Session.CLOSED


def get_session_stats(bars: list[OHLCVBar]) -> dict[Session, SessionStats]:
    """Calculate statistics per session from bar data."""
    session_bars: dict[Session, list[OHLCVBar]] = {}

    for bar in bars:
        session = classify_session(bar.timestamp)
        if session not in session_bars:
            session_bars[session] = []
        session_bars[session].append(bar)

    stats: dict[Session, SessionStats] = {}
    for session, s_bars in session_bars.items():
        volumes = [b.volume for b in s_bars]
        ranges = [b.high - b.low for b in s_bars]
        stats[session] = SessionStats(
            session=session,
            bar_count=len(s_bars),
            avg_volume=sum(volumes) / len(volumes),
            avg_range=sum(ranges) / len(ranges),
            total_volume=sum(volumes),
        )

    return stats
```

**Step 4: Run tests**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/test_sessions.py -v
```
Expected: All pass

**Step 5: Commit**

```bash
git add engine/src/arctis/analysis/sessions.py engine/tests/test_sessions.py
git commit -m "feat: add session/time analysis with ET trading sessions"
```

---

### Task 11: Analysis API Endpoints

**Files:**
- Create: `engine/src/arctis/routes/__init__.py`
- Create: `engine/src/arctis/routes/analysis.py`
- Modify: `engine/src/arctis/main.py`
- Create: `engine/tests/test_analysis_api.py`

**Step 1: Write failing tests**

Create `engine/tests/test_analysis_api.py`:
```python
import pytest
from pathlib import Path
from httpx import ASGITransport, AsyncClient
from arctis.main import app

FIXTURES = Path(__file__).parent / "fixtures"


@pytest.fixture
async def client_with_data():
    """Import sample data then return test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with open(FIXTURES / "sample_es_1min.csv", "rb") as f:
            await client.post(
                "/api/import",
                files={"file": ("es.csv", f, "text/csv")},
                data={"market": "ES", "timeframe": "1min"},
            )
        yield client


@pytest.mark.asyncio
async def test_structure_endpoint(client_with_data):
    response = await client_with_data.get("/api/analysis/structure", params={"market": "ES", "timeframe": "1min"})
    assert response.status_code == 200
    data = response.json()
    assert "trend" in data
    assert "swings" in data
    assert "structure_breaks" in data


@pytest.mark.asyncio
async def test_volume_endpoint(client_with_data):
    response = await client_with_data.get("/api/analysis/volume", params={"market": "ES", "timeframe": "1min"})
    assert response.status_code == 200
    data = response.json()
    assert "relative_volume" in data
    assert "spikes" in data


@pytest.mark.asyncio
async def test_sessions_endpoint(client_with_data):
    response = await client_with_data.get("/api/analysis/sessions", params={"market": "ES", "timeframe": "1min"})
    assert response.status_code == 200
    data = response.json()
    assert "current_session" in data
    assert "session_stats" in data
```

**Step 2: Run to verify failure**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/test_analysis_api.py -v
```

**Step 3: Implement analysis routes**

Create `engine/src/arctis/routes/__init__.py` (empty).

Create `engine/src/arctis/routes/analysis.py`:
```python
"""Analysis API endpoints."""

import time

from fastapi import APIRouter, Query

from arctis.analysis.sessions import classify_session, get_session_stats
from arctis.analysis.structure import (
    classify_trend,
    detect_structure_breaks,
    detect_swings,
)
from arctis.analysis.volume import detect_volume_spikes, relative_volume
from arctis.models import Market, Timeframe
from arctis.storage import ParquetStore

router = APIRouter(prefix="/api/analysis")


def _get_store() -> ParquetStore:
    # Import here to avoid circular imports — will be refactored to DI later
    from arctis.main import store
    return store


@router.get("/structure")
async def analyze_structure(
    market: Market = Query(...),
    timeframe: Timeframe = Query(...),
    lookback: int = Query(default=5, ge=2, le=20),
):
    s = _get_store()
    bars = s.load(market, timeframe)
    swings = detect_swings(bars, lookback=lookback)
    trend = classify_trend(swings)
    breaks = detect_structure_breaks(swings)

    return {
        "trend": trend.value,
        "swings": [
            {"type": sw.type.value, "price": sw.price, "index": sw.index, "timestamp": sw.timestamp}
            for sw in swings
        ],
        "structure_breaks": [
            {"type": b.break_type, "direction": b.direction, "price": b.price, "index": b.index, "timestamp": b.timestamp}
            for b in breaks
        ],
        "bar_count": len(bars),
    }


@router.get("/volume")
async def analyze_volume(
    market: Market = Query(...),
    timeframe: Timeframe = Query(...),
    period: int = Query(default=20, ge=5, le=100),
    spike_sigma: float = Query(default=2.0, ge=1.0, le=5.0),
):
    s = _get_store()
    bars = s.load(market, timeframe)
    rvol = relative_volume(bars, period=period)
    spikes = detect_volume_spikes(bars, period=period, threshold_sigma=spike_sigma)

    return {
        "relative_volume": [
            {"index": i, "timestamp": bars[i].timestamp, "rvol": v}
            for i, v in enumerate(rvol) if v is not None
        ],
        "spikes": [
            {"index": sp.index, "timestamp": sp.timestamp, "volume": sp.volume, "ratio": round(sp.ratio, 2)}
            for sp in spikes
        ],
        "bar_count": len(bars),
    }


@router.get("/sessions")
async def analyze_sessions(
    market: Market = Query(...),
    timeframe: Timeframe = Query(...),
):
    s = _get_store()
    bars = s.load(market, timeframe)
    stats = get_session_stats(bars)
    current = classify_session(int(time.time()))

    return {
        "current_session": current.value,
        "session_stats": {
            session.value: {
                "bar_count": st.bar_count,
                "avg_volume": round(st.avg_volume, 1),
                "avg_range": round(st.avg_range, 4),
                "total_volume": st.total_volume,
            }
            for session, st in stats.items()
        },
        "bar_count": len(bars),
    }
```

**Step 4: Register routes in main app**

Update `engine/src/arctis/main.py` — add after the app definition:
```python
from arctis.routes.analysis import router as analysis_router
app.include_router(analysis_router)
```

Full updated `main.py`:
```python
"""FastAPI application entry point."""

import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, UploadFile

from arctis.csv_parser import parse_csv
from arctis.models import Market, Timeframe
from arctis.routes.analysis import router as analysis_router
from arctis.storage import ParquetStore

DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"
store = ParquetStore(data_dir=DATA_DIR)

app = FastAPI(
    title="Arctis Engine",
    version="0.1.0",
    description="Trading Decision Support Analysis Engine",
)

app.include_router(analysis_router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


@app.post("/api/import")
async def import_csv(
    file: UploadFile = File(...),
    market: Market = Form(...),
    timeframe: Timeframe = Form(...),
):
    """Import OHLCV data from a CSV file."""
    with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        bars = parse_csv(tmp_path)
        store.save(market, timeframe, bars)
        return {
            "market": market.value,
            "timeframe": timeframe.value,
            "bars_imported": len(bars),
        }
    finally:
        tmp_path.unlink(missing_ok=True)
```

**Step 5: Run all tests**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/ -v
```
Expected: All pass

**Step 6: Commit**

```bash
git add engine/
git commit -m "feat: add analysis API endpoints (structure, volume, sessions)"
```

---

## Phase 3: Dashboard

### Task 12: Install Chart Library & Base Layout

**Files:**
- Modify: `app/package.json` (add lightweight-charts)
- Create: `app/src/components/Chart.tsx`
- Create: `app/src/components/Dashboard.tsx`
- Modify: `app/src/App.tsx`

**Step 1: Install dependencies**

```bash
cd C:\Users\Meriton\Arctis\app
pnpm add lightweight-charts
```

**Step 2: Create Chart component**

Create `app/src/components/Chart.tsx`:
```tsx
import { useEffect, useRef } from "react";
import { createChart, IChartApi, CandlestickData, Time } from "lightweight-charts";

interface ChartProps {
  data: CandlestickData<Time>[];
  width?: number;
  height?: number;
}

export function Chart({ data, height = 500 }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { color: "#1a1a2e" },
        textColor: "#e0e0e0",
      },
      grid: {
        vertLines: { color: "#2a2a3e" },
        horzLines: { color: "#2a2a3e" },
      },
      crosshair: {
        mode: 0,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    candleSeries.setData(data);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, height]);

  return <div ref={containerRef} style={{ width: "100%" }} />;
}
```

**Step 3: Create Dashboard layout**

Create `app/src/components/Dashboard.tsx`:
```tsx
import { useEffect, useState } from "react";
import { Chart } from "./Chart";
import { CandlestickData, Time } from "lightweight-charts";

const ENGINE_URL = "http://127.0.0.1:8000";

interface BarData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function Dashboard() {
  const [market, setMarket] = useState<"ES" | "NQ">("ES");
  const [timeframe, setTimeframe] = useState<"1min" | "5min">("1min");
  const [chartData, setChartData] = useState<CandlestickData<Time>[]>([]);
  const [trend, setTrend] = useState<string>("—");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch bars
        const barsRes = await fetch(
          `${ENGINE_URL}/api/bars?market=${market}&timeframe=${timeframe}`
        );
        if (barsRes.ok) {
          const bars: BarData[] = await barsRes.json();
          setChartData(
            bars.map((b) => ({
              time: b.timestamp as Time,
              open: b.open,
              high: b.high,
              low: b.low,
              close: b.close,
            }))
          );
        }

        // Fetch structure
        const structRes = await fetch(
          `${ENGINE_URL}/api/analysis/structure?market=${market}&timeframe=${timeframe}`
        );
        if (structRes.ok) {
          const data = await structRes.json();
          setTrend(data.trend);
        }

        setError(null);
      } catch (e) {
        setError("Engine nicht erreichbar");
      }
    };

    fetchData();
  }, [market, timeframe]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#1a1a2e", color: "#e0e0e0" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "0.5rem 1rem", gap: "1rem", borderBottom: "1px solid #2a2a3e" }}>
        <h2 style={{ margin: 0 }}>Arctis</h2>
        <select value={market} onChange={(e) => setMarket(e.target.value as "ES" | "NQ")}
          style={{ background: "#2a2a3e", color: "#e0e0e0", border: "1px solid #3a3a4e", padding: "0.25rem" }}>
          <option value="ES">ES</option>
          <option value="NQ">NQ</option>
        </select>
        <select value={timeframe} onChange={(e) => setTimeframe(e.target.value as "1min" | "5min")}
          style={{ background: "#2a2a3e", color: "#e0e0e0", border: "1px solid #3a3a4e", padding: "0.25rem" }}>
          <option value="1min">1 Min</option>
          <option value="5min">5 Min</option>
        </select>
        <span style={{ padding: "0.25rem 0.5rem", borderRadius: "4px",
          background: trend === "uptrend" ? "#1b5e20" : trend === "downtrend" ? "#b71c1c" : "#37474f" }}>
          Trend: {trend}
        </span>
        {error && <span style={{ color: "#ef5350" }}>{error}</span>}
      </div>

      {/* Chart */}
      <div style={{ flex: 1, padding: "0.5rem" }}>
        <Chart data={chartData} />
      </div>
    </div>
  );
}
```

**Step 4: Update App.tsx**

```tsx
import { useEffect, useState } from "react";
import { checkHealth } from "./api";
import { Dashboard } from "./components/Dashboard";

function App() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        await checkHealth();
        setConnected(true);
      } catch {
        setConnected(false);
      }
    };
    const interval = setInterval(check, 2000);
    check();
    return () => clearInterval(interval);
  }, []);

  if (!connected) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#1a1a2e", color: "#e0e0e0" }}>
        <div style={{ textAlign: "center" }}>
          <h1>Arctis</h1>
          <p>Verbinde mit Engine...</p>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

export default App;
```

**Step 5: Add bars endpoint to Python API**

Add to `engine/src/arctis/main.py`:
```python
@app.get("/api/bars")
async def get_bars(
    market: Market = Query(...),
    timeframe: Timeframe = Query(...),
):
    """Return raw OHLCV bars as JSON."""
    from fastapi import Query as Q
    bars = store.load(market, timeframe)
    return [b.model_dump() for b in bars]
```

(Add `from fastapi import Query` to the imports at the top.)

**Step 6: Test visually**

1. Start engine: `cd engine && uv run uvicorn arctis.main:app --host 127.0.0.1 --port 8000`
2. Import sample data via curl or the API
3. Start app: `cd app && pnpm tauri dev`
4. Verify chart displays with dark theme

**Step 7: Commit**

```bash
git add app/ engine/
git commit -m "feat: add dashboard with candlestick chart and structure overlay"
```

---

### Task 13: Volume Panel & Session Timeline

**Files:**
- Create: `app/src/components/VolumePanel.tsx`
- Create: `app/src/components/SessionTimeline.tsx`
- Modify: `app/src/components/Dashboard.tsx`

**Step 1: Create VolumePanel**

Create `app/src/components/VolumePanel.tsx`:
```tsx
import { useEffect, useState } from "react";

const ENGINE_URL = "http://127.0.0.1:8000";

interface VolumeData {
  relative_volume: { index: number; timestamp: number; rvol: number }[];
  spikes: { index: number; timestamp: number; volume: number; ratio: number }[];
  bar_count: number;
}

interface VolumePanelProps {
  market: string;
  timeframe: string;
}

export function VolumePanel({ market, timeframe }: VolumePanelProps) {
  const [data, setData] = useState<VolumeData | null>(null);

  useEffect(() => {
    fetch(`${ENGINE_URL}/api/analysis/volume?market=${market}&timeframe=${timeframe}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, [market, timeframe]);

  if (!data) return <div style={{ padding: "0.5rem", color: "#888" }}>Lade Volumen...</div>;

  const latestRvol = data.relative_volume.length > 0
    ? data.relative_volume[data.relative_volume.length - 1].rvol
    : null;

  return (
    <div style={{ padding: "0.5rem", borderTop: "1px solid #2a2a3e" }}>
      <h4 style={{ margin: "0 0 0.25rem" }}>Volumen</h4>
      <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem" }}>
        <span>
          Rel. Vol: <strong style={{ color: latestRvol && latestRvol > 1.5 ? "#26a69a" : "#e0e0e0" }}>
            {latestRvol ? `${latestRvol.toFixed(2)}x` : "—"}
          </strong>
        </span>
        <span>Spikes: <strong>{data.spikes.length}</strong></span>
        <span>Bars: {data.bar_count}</span>
      </div>
      {data.spikes.length > 0 && (
        <div style={{ marginTop: "0.25rem", fontSize: "0.8rem", color: "#ffa726" }}>
          Letzter Spike: {data.spikes[data.spikes.length - 1].ratio.toFixed(1)}x Durchschnitt
        </div>
      )}
    </div>
  );
}
```

**Step 2: Create SessionTimeline**

Create `app/src/components/SessionTimeline.tsx`:
```tsx
import { useEffect, useState } from "react";

const ENGINE_URL = "http://127.0.0.1:8000";

interface SessionData {
  current_session: string;
  session_stats: Record<string, { bar_count: number; avg_volume: number; avg_range: number }>;
}

const SESSION_COLORS: Record<string, string> = {
  premarket: "#78909c",
  ny_open: "#66bb6a",
  midday: "#42a5f5",
  power_hour: "#ffa726",
  after_hours: "#78909c",
  closed: "#616161",
};

const SESSION_LABELS: Record<string, string> = {
  premarket: "Pre-Market",
  ny_open: "NY Open",
  midday: "Midday",
  power_hour: "Power Hour",
  after_hours: "After Hours",
  closed: "Geschlossen",
};

interface SessionTimelineProps {
  market: string;
  timeframe: string;
}

export function SessionTimeline({ market, timeframe }: SessionTimelineProps) {
  const [data, setData] = useState<SessionData | null>(null);

  useEffect(() => {
    fetch(`${ENGINE_URL}/api/analysis/sessions?market=${market}&timeframe=${timeframe}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, [market, timeframe]);

  if (!data) return null;

  return (
    <div style={{ padding: "0.5rem", borderTop: "1px solid #2a2a3e" }}>
      <h4 style={{ margin: "0 0 0.25rem" }}>Sessions</h4>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {Object.entries(data.session_stats).map(([session, stats]) => (
          <div
            key={session}
            style={{
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              background: session === data.current_session ? SESSION_COLORS[session] + "40" : "#2a2a3e",
              border: session === data.current_session ? `1px solid ${SESSION_COLORS[session]}` : "1px solid transparent",
              fontSize: "0.8rem",
            }}
          >
            <div style={{ fontWeight: session === data.current_session ? "bold" : "normal" }}>
              {SESSION_LABELS[session] || session}
            </div>
            <div style={{ color: "#aaa" }}>
              {stats.bar_count} bars | Vol: {Math.round(stats.avg_volume)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Integrate into Dashboard**

Update `app/src/components/Dashboard.tsx` to include `VolumePanel` and `SessionTimeline` below the chart area.

Add imports:
```tsx
import { VolumePanel } from "./VolumePanel";
import { SessionTimeline } from "./SessionTimeline";
```

Add below the Chart div:
```tsx
<VolumePanel market={market} timeframe={timeframe} />
<SessionTimeline market={market} timeframe={timeframe} />
```

**Step 4: Test visually**

Start engine + app, verify panels render with data.

**Step 5: Commit**

```bash
git add app/
git commit -m "feat: add volume panel and session timeline to dashboard"
```

---

## Phase 4: Extended Analysis

### Task 14: Module D — Historical Probability Analysis

**Files:**
- Create: `engine/src/arctis/analysis/probability.py`
- Create: `engine/tests/test_probability.py`
- Create: `engine/src/arctis/routes/probability.py`

**Step 1: Write failing tests**

Create `engine/tests/test_probability.py`:
```python
import pytest
from arctis.models import OHLCVBar
from arctis.analysis.probability import (
    build_feature_vector,
    find_similar_situations,
    calculate_target_zones,
    TargetZone,
)


def make_daily_bars(n: int, base_price: float = 5000.0) -> list[OHLCVBar]:
    """Create n days of 1-min bars (390 bars per day)."""
    import random
    random.seed(42)
    bars = []
    price = base_price
    ts = 1704067200  # 2024-01-01 00:00:00 UTC
    for day in range(n):
        for minute in range(390):
            change = random.uniform(-2, 2)
            price += change
            bars.append(OHLCVBar(
                timestamp=ts + day * 86400 + minute * 60,
                open=price,
                high=price + random.uniform(0, 3),
                low=price - random.uniform(0, 3),
                close=price + random.uniform(-1, 1),
                volume=random.randint(500, 5000),
            ))
    return bars


class TestFeatureVector:
    def test_builds_vector(self):
        bars = make_daily_bars(5)
        vec = build_feature_vector(bars[-390:])  # Last day
        assert len(vec) == 5  # [trend, volatility, volume_profile, session_weight, weekday]
        assert all(isinstance(v, float) for v in vec)


class TestSimilarSituations:
    def test_finds_matches(self):
        bars = make_daily_bars(30)
        current = bars[-390:]
        history = bars[:-390]
        matches = find_similar_situations(current, history, top_n=10)
        assert len(matches) <= 10
        assert all("distance" in m for m in matches)
        assert all("bars" in m for m in matches)


class TestTargetZones:
    def test_calculates_zones(self):
        bars = make_daily_bars(30)
        current = bars[-390:]
        history = bars[:-390]
        matches = find_similar_situations(current, history, top_n=10)
        zones = calculate_target_zones(matches, current_price=5000.0)
        assert zones.median_target != 0
        assert 0 <= zones.reach_probability <= 1.0
        assert zones.iqr_low <= zones.iqr_high
```

**Step 2: Run to verify failure**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/test_probability.py -v
```

**Step 3: Implement probability analysis**

Create `engine/src/arctis/analysis/probability.py`:
```python
"""Historical probability analysis using nearest-neighbor comparison."""

from dataclasses import dataclass

import numpy as np

from arctis.analysis.structure import classify_trend, detect_swings, TrendState
from arctis.models import OHLCVBar


@dataclass
class TargetZone:
    median_target: float  # Median price movement from similar situations
    iqr_low: float        # 25th percentile movement
    iqr_high: float       # 75th percentile movement
    reach_probability: float  # Probability of reaching median target zone
    counter_move_probability: float  # Probability of significant counter-move
    sample_size: int


def build_feature_vector(bars: list[OHLCVBar]) -> list[float]:
    """Build a normalized feature vector from a set of bars.

    Features: [trend_score, volatility, volume_profile, avg_range, close_position]
    """
    if len(bars) < 10:
        return [0.0] * 5

    closes = np.array([b.close for b in bars])
    highs = np.array([b.high for b in bars])
    lows = np.array([b.low for b in bars])
    volumes = np.array([b.volume for b in bars], dtype=float)

    # 1. Trend score: normalized slope of closes
    x = np.arange(len(closes))
    slope = np.polyfit(x, closes, 1)[0] if len(closes) > 1 else 0.0
    trend_score = float(np.clip(slope / (np.std(closes) + 1e-9), -3, 3))

    # 2. Volatility: normalized std of returns
    returns = np.diff(closes) / (closes[:-1] + 1e-9)
    volatility = float(np.std(returns) * 100)

    # 3. Volume profile: ratio of recent volume to overall
    mid = len(volumes) // 2
    vol_ratio = float(np.mean(volumes[mid:]) / (np.mean(volumes[:mid]) + 1e-9))

    # 4. Average range: mean of (high - low) normalized by price
    avg_range = float(np.mean(highs - lows) / (np.mean(closes) + 1e-9) * 100)

    # 5. Close position: where close is within day's range (0=low, 1=high)
    day_high = np.max(highs)
    day_low = np.min(lows)
    close_pos = float((closes[-1] - day_low) / (day_high - day_low + 1e-9))

    return [trend_score, volatility, vol_ratio, avg_range, close_pos]


def find_similar_situations(
    current_bars: list[OHLCVBar],
    history_bars: list[OHLCVBar],
    top_n: int = 20,
    window_size: int = 390,  # 1 day of 1-min bars
) -> list[dict]:
    """Find the top_n most similar historical situations to the current one.

    Uses Euclidean distance on feature vectors.
    """
    current_vec = np.array(build_feature_vector(current_bars))
    matches = []

    # Slide window over history
    step = window_size // 2  # 50% overlap
    for i in range(0, len(history_bars) - window_size * 2, step):
        window = history_bars[i : i + window_size]
        future = history_bars[i + window_size : i + window_size * 2]

        vec = np.array(build_feature_vector(window))
        distance = float(np.linalg.norm(current_vec - vec))

        # Track the price movement AFTER the similar window
        if len(future) > 0:
            entry_price = window[-1].close
            future_closes = [b.close for b in future]
            max_move = max(future_closes) - entry_price
            min_move = min(future_closes) - entry_price

            matches.append({
                "distance": distance,
                "bars": window,
                "entry_price": entry_price,
                "max_up": max_move,
                "max_down": min_move,
                "end_price": future_closes[-1],
                "move": future_closes[-1] - entry_price,
            })

    # Sort by similarity (lowest distance = most similar)
    matches.sort(key=lambda m: m["distance"])
    return matches[:top_n]


def calculate_target_zones(
    matches: list[dict],
    current_price: float,
) -> TargetZone:
    """Calculate probability zones from similar historical matches."""
    if not matches:
        return TargetZone(
            median_target=0.0, iqr_low=0.0, iqr_high=0.0,
            reach_probability=0.0, counter_move_probability=0.0,
            sample_size=0,
        )

    moves = np.array([m["move"] for m in matches])
    median_move = float(np.median(moves))
    q25 = float(np.percentile(moves, 25))
    q75 = float(np.percentile(moves, 75))

    # Probability: how often did the move reach the median target direction?
    if median_move > 0:
        reach_count = sum(1 for m in matches if m["max_up"] >= median_move)
    else:
        reach_count = sum(1 for m in matches if m["max_down"] <= median_move)

    reach_prob = reach_count / len(matches)

    # Counter-move: significant move against the expected direction
    threshold = abs(median_move) * 0.5
    if median_move > 0:
        counter_count = sum(1 for m in matches if m["max_down"] < -threshold)
    else:
        counter_count = sum(1 for m in matches if m["max_up"] > threshold)

    counter_prob = counter_count / len(matches)

    return TargetZone(
        median_target=current_price + median_move,
        iqr_low=current_price + q25,
        iqr_high=current_price + q75,
        reach_probability=reach_prob,
        counter_move_probability=counter_prob,
        sample_size=len(matches),
    )
```

**Step 4: Run tests**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/test_probability.py -v
```
Expected: All pass

**Step 5: Add API endpoint**

Create `engine/src/arctis/routes/probability.py`:
```python
"""Historical probability API endpoint."""

from fastapi import APIRouter, Query

from arctis.analysis.probability import (
    build_feature_vector,
    calculate_target_zones,
    find_similar_situations,
)
from arctis.models import Market, Timeframe

router = APIRouter(prefix="/api/analysis")


def _get_store():
    from arctis.main import store
    return store


@router.get("/probability")
async def analyze_probability(
    market: Market = Query(...),
    timeframe: Timeframe = Query(...),
    top_n: int = Query(default=20, ge=5, le=50),
):
    s = _get_store()
    bars = s.load(market, timeframe)

    if len(bars) < 780:  # Need at least 2 days of 1-min data
        return {"error": "Nicht genug historische Daten (mindestens 2 Tage noetig)", "bar_count": len(bars)}

    window = 390 if timeframe == "1min" else 78  # 1 day for 1min, 1 day for 5min
    current = bars[-window:]
    history = bars[:-window]
    current_price = current[-1].close

    matches = find_similar_situations(current, history, top_n=top_n, window_size=window)
    zones = calculate_target_zones(matches, current_price)

    return {
        "current_price": current_price,
        "median_target": round(zones.median_target, 2),
        "iqr_low": round(zones.iqr_low, 2),
        "iqr_high": round(zones.iqr_high, 2),
        "reach_probability": round(zones.reach_probability, 3),
        "counter_move_probability": round(zones.counter_move_probability, 3),
        "sample_size": zones.sample_size,
        "feature_vector": build_feature_vector(current),
    }
```

Register in `main.py`:
```python
from arctis.routes.probability import router as probability_router
app.include_router(probability_router)
```

**Step 6: Run all tests**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/ -v
```

**Step 7: Commit**

```bash
git add engine/
git commit -m "feat: add historical probability analysis (Module D)"
```

---

### Task 15: Module E — Risk & Position Sizing

**Files:**
- Create: `engine/src/arctis/analysis/risk.py`
- Create: `engine/tests/test_risk.py`

**Step 1: Write failing tests**

Create `engine/tests/test_risk.py`:
```python
import pytest
from arctis.analysis.risk import (
    calculate_position_size,
    check_daily_risk,
    RiskWarning,
)


class TestPositionSize:
    def test_basic_calculation(self):
        # $50k account, 1% risk, 10 point stop on ES ($50/point)
        size = calculate_position_size(
            account_size=50000,
            risk_percent=1.0,
            stop_distance=10.0,
            tick_value=12.50,
            tick_size=0.25,
        )
        # Risk = $500, per contract risk = 10 / 0.25 * 12.50 = $500
        assert size.contracts == 1
        assert size.risk_amount == 500.0

    def test_fractional_rounds_down(self):
        size = calculate_position_size(
            account_size=50000,
            risk_percent=1.0,
            stop_distance=7.0,
            tick_value=12.50,
            tick_size=0.25,
        )
        # Risk = $500, per contract = 7/0.25 * 12.5 = $350 → 1 contract (500/350 = 1.42 → floor to 1)
        assert size.contracts == 1

    def test_zero_stop_distance(self):
        size = calculate_position_size(
            account_size=50000,
            risk_percent=1.0,
            stop_distance=0.0,
            tick_value=12.50,
            tick_size=0.25,
        )
        assert size.contracts == 0


class TestDailyRisk:
    def test_within_limit(self):
        result = check_daily_risk(
            realized_pnl=-200,
            daily_limit=1000,
            trade_count=2,
            max_trades=10,
        )
        assert result.can_trade is True
        assert len(result.warnings) == 0

    def test_exceeds_limit(self):
        result = check_daily_risk(
            realized_pnl=-1100,
            daily_limit=1000,
            trade_count=2,
            max_trades=10,
        )
        assert result.can_trade is False
        assert any("limit" in w.lower() for w in result.warnings)

    def test_overtrading_warning(self):
        result = check_daily_risk(
            realized_pnl=0,
            daily_limit=1000,
            trade_count=9,
            max_trades=10,
        )
        assert any("trades" in w.lower() for w in result.warnings)
```

**Step 2: Run to verify failure**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/test_risk.py -v
```

**Step 3: Implement risk module**

Create `engine/src/arctis/analysis/risk.py`:
```python
"""Risk management and position sizing."""

from dataclasses import dataclass, field
import math


@dataclass
class PositionSize:
    contracts: int
    risk_amount: float
    risk_per_contract: float


@dataclass
class DailyRiskCheck:
    can_trade: bool
    risk_used_percent: float
    warnings: list[str] = field(default_factory=list)


def calculate_position_size(
    account_size: float,
    risk_percent: float,
    stop_distance: float,
    tick_value: float,
    tick_size: float,
) -> PositionSize:
    """Calculate position size based on risk parameters.

    Args:
        account_size: Total account value in USD.
        risk_percent: Max risk per trade as percentage (e.g. 1.0 = 1%).
        stop_distance: Stop loss distance in points.
        tick_value: Dollar value per tick (e.g. $12.50 for ES).
        tick_size: Minimum price increment (e.g. 0.25 for ES).
    """
    if stop_distance <= 0 or tick_size <= 0:
        return PositionSize(contracts=0, risk_amount=0.0, risk_per_contract=0.0)

    risk_amount = account_size * (risk_percent / 100.0)
    ticks_in_stop = stop_distance / tick_size
    risk_per_contract = ticks_in_stop * tick_value

    if risk_per_contract <= 0:
        return PositionSize(contracts=0, risk_amount=risk_amount, risk_per_contract=0.0)

    contracts = math.floor(risk_amount / risk_per_contract)

    return PositionSize(
        contracts=contracts,
        risk_amount=risk_amount,
        risk_per_contract=risk_per_contract,
    )


def check_daily_risk(
    realized_pnl: float,
    daily_limit: float,
    trade_count: int,
    max_trades: int,
) -> DailyRiskCheck:
    """Check if trader is within daily risk limits."""
    warnings: list[str] = []
    can_trade = True

    risk_used = abs(min(realized_pnl, 0))
    risk_used_pct = (risk_used / daily_limit * 100) if daily_limit > 0 else 0

    if risk_used >= daily_limit:
        can_trade = False
        warnings.append(f"Tages-Limit erreicht: ${risk_used:.0f} / ${daily_limit:.0f}")
    elif risk_used_pct >= 75:
        warnings.append(f"Tages-Limit bei {risk_used_pct:.0f}%: ${risk_used:.0f} / ${daily_limit:.0f}")

    if trade_count >= max_trades:
        can_trade = False
        warnings.append(f"Max Trades erreicht: {trade_count} / {max_trades}")
    elif trade_count >= max_trades * 0.8:
        warnings.append(f"Achtung: {trade_count} von {max_trades} Trades verbraucht")

    return DailyRiskCheck(
        can_trade=can_trade,
        risk_used_percent=risk_used_pct,
        warnings=warnings,
    )
```

**Step 4: Run tests**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/test_risk.py -v
```
Expected: All pass

**Step 5: Commit**

```bash
git add engine/src/arctis/analysis/risk.py engine/tests/test_risk.py
git commit -m "feat: add risk management and position sizing (Module E)"
```

---

### Task 16: Module F — Discipline Warnings

**Files:**
- Create: `engine/src/arctis/analysis/discipline.py`
- Create: `engine/tests/test_discipline.py`

**Step 1: Write failing tests**

Create `engine/tests/test_discipline.py`:
```python
import pytest
from arctis.analysis.discipline import (
    generate_warnings,
    DisciplineContext,
    Warning,
    WarningSeverity,
)
from arctis.analysis.structure import TrendState


class TestDisciplineWarnings:
    def test_no_warnings_in_good_conditions(self):
        ctx = DisciplineContext(
            trend=TrendState.UPTREND,
            session="ny_open",
            risk_used_pct=20.0,
            trade_count=1,
            max_trades=10,
            consecutive_losses=0,
        )
        warnings = generate_warnings(ctx)
        assert len(warnings) == 0

    def test_warns_on_range_market(self):
        ctx = DisciplineContext(
            trend=TrendState.RANGE,
            session="ny_open",
            risk_used_pct=20.0,
            trade_count=1,
            max_trades=10,
            consecutive_losses=0,
        )
        warnings = generate_warnings(ctx)
        assert any("range" in w.message.lower() or "kein" in w.message.lower() for w in warnings)

    def test_warns_on_midday_session(self):
        ctx = DisciplineContext(
            trend=TrendState.UPTREND,
            session="midday",
            risk_used_pct=20.0,
            trade_count=1,
            max_trades=10,
            consecutive_losses=0,
        )
        warnings = generate_warnings(ctx)
        assert any("midday" in w.message.lower() or "schwach" in w.message.lower() for w in warnings)

    def test_warns_on_consecutive_losses(self):
        ctx = DisciplineContext(
            trend=TrendState.UPTREND,
            session="ny_open",
            risk_used_pct=20.0,
            trade_count=4,
            max_trades=10,
            consecutive_losses=3,
        )
        warnings = generate_warnings(ctx)
        assert any("verlust" in w.message.lower() or "pause" in w.message.lower() for w in warnings)

    def test_warns_on_high_risk_usage(self):
        ctx = DisciplineContext(
            trend=TrendState.UPTREND,
            session="ny_open",
            risk_used_pct=80.0,
            trade_count=1,
            max_trades=10,
            consecutive_losses=0,
        )
        warnings = generate_warnings(ctx)
        assert any("risiko" in w.message.lower() or "limit" in w.message.lower() for w in warnings)
```

**Step 2: Run to verify failure**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/test_discipline.py -v
```

**Step 3: Implement discipline module**

Create `engine/src/arctis/analysis/discipline.py`:
```python
"""Discipline and warning system. Facts only, no psychology."""

from dataclasses import dataclass
from enum import Enum

from arctis.analysis.structure import TrendState


class WarningSeverity(str, Enum):
    INFO = "info"
    CAUTION = "caution"
    STOP = "stop"


@dataclass
class Warning:
    message: str
    severity: WarningSeverity


@dataclass
class DisciplineContext:
    trend: TrendState
    session: str
    risk_used_pct: float
    trade_count: int
    max_trades: int
    consecutive_losses: int


# Sessions that are historically weaker for trending moves
WEAK_SESSIONS = {"midday", "after_hours", "closed", "premarket"}


def generate_warnings(ctx: DisciplineContext) -> list[Warning]:
    """Generate objective warnings based on current trading context.

    No psychology, no motivational text. Just facts.
    """
    warnings: list[Warning] = []

    # Market structure
    if ctx.trend == TrendState.RANGE:
        warnings.append(Warning(
            message="Kein Trend erkannt — Markt in Range. Breakout-Risiko beachten.",
            severity=WarningSeverity.CAUTION,
        ))

    # Session quality
    if ctx.session in WEAK_SESSIONS:
        warnings.append(Warning(
            message=f"Historisch schwache Phase ({ctx.session}). Reduzierte Bewegung erwartet.",
            severity=WarningSeverity.CAUTION,
        ))

    # Risk usage
    if ctx.risk_used_pct >= 90:
        warnings.append(Warning(
            message=f"Tages-Risiko bei {ctx.risk_used_pct:.0f}%. Handel einstellen empfohlen.",
            severity=WarningSeverity.STOP,
        ))
    elif ctx.risk_used_pct >= 70:
        warnings.append(Warning(
            message=f"Tages-Risiko bei {ctx.risk_used_pct:.0f}% des Limits.",
            severity=WarningSeverity.CAUTION,
        ))

    # Consecutive losses
    if ctx.consecutive_losses >= 3:
        warnings.append(Warning(
            message=f"{ctx.consecutive_losses} Verlusttrades in Folge. Pause empfohlen.",
            severity=WarningSeverity.STOP,
        ))
    elif ctx.consecutive_losses >= 2:
        warnings.append(Warning(
            message=f"{ctx.consecutive_losses} Verlusttrades in Folge.",
            severity=WarningSeverity.CAUTION,
        ))

    # Trade count
    if ctx.trade_count >= ctx.max_trades * 0.8:
        warnings.append(Warning(
            message=f"{ctx.trade_count}/{ctx.max_trades} Trades verbraucht.",
            severity=WarningSeverity.CAUTION,
        ))

    return warnings
```

**Step 4: Run tests**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/test_discipline.py -v
```
Expected: All pass

**Step 5: Commit**

```bash
git add engine/src/arctis/analysis/discipline.py engine/tests/test_discipline.py
git commit -m "feat: add discipline warning system (Module F)"
```

---

### Task 17: Settings Panel & Risk API

**Files:**
- Create: `engine/src/arctis/config.py`
- Create: `engine/src/arctis/routes/risk.py`
- Modify: `engine/src/arctis/main.py`
- Create: `app/src/components/SettingsPanel.tsx`
- Create: `app/src/components/WarningsPanel.tsx`

**Step 1: Create config model**

Create `engine/src/arctis/config.py`:
```python
"""User configuration for risk and trading parameters."""

import json
from dataclasses import dataclass, asdict
from pathlib import Path


@dataclass
class TradingConfig:
    account_size: float = 50000.0
    risk_percent: float = 1.0
    daily_loss_limit: float = 1000.0
    max_daily_trades: int = 10
    tick_value_es: float = 12.50
    tick_size_es: float = 0.25
    tick_value_nq: float = 5.00
    tick_size_nq: float = 0.25


CONFIG_PATH = Path(__file__).parent.parent.parent.parent / "data" / "config.json"


def load_config() -> TradingConfig:
    if CONFIG_PATH.exists():
        data = json.loads(CONFIG_PATH.read_text())
        return TradingConfig(**data)
    return TradingConfig()


def save_config(config: TradingConfig) -> None:
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    CONFIG_PATH.write_text(json.dumps(asdict(config), indent=2))
```

**Step 2: Create risk API routes**

Create `engine/src/arctis/routes/risk.py`:
```python
"""Risk management API endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel

from arctis.analysis.risk import calculate_position_size, check_daily_risk
from arctis.config import TradingConfig, load_config, save_config

router = APIRouter(prefix="/api")


class PositionSizeRequest(BaseModel):
    stop_distance: float
    market: str = "ES"


class DailyRiskRequest(BaseModel):
    realized_pnl: float = 0.0
    trade_count: int = 0
    consecutive_losses: int = 0


@router.post("/risk/position-size")
async def position_size(req: PositionSizeRequest):
    config = load_config()
    tick_value = config.tick_value_es if req.market == "ES" else config.tick_value_nq
    tick_size = config.tick_size_es if req.market == "ES" else config.tick_size_nq

    result = calculate_position_size(
        account_size=config.account_size,
        risk_percent=config.risk_percent,
        stop_distance=req.stop_distance,
        tick_value=tick_value,
        tick_size=tick_size,
    )
    return {
        "contracts": result.contracts,
        "risk_amount": round(result.risk_amount, 2),
        "risk_per_contract": round(result.risk_per_contract, 2),
    }


@router.post("/risk/daily-check")
async def daily_risk_check(req: DailyRiskRequest):
    config = load_config()
    result = check_daily_risk(
        realized_pnl=req.realized_pnl,
        daily_limit=config.daily_loss_limit,
        trade_count=req.trade_count,
        max_trades=config.max_daily_trades,
    )
    return {
        "can_trade": result.can_trade,
        "risk_used_percent": round(result.risk_used_percent, 1),
        "warnings": result.warnings,
    }


@router.get("/config")
async def get_config():
    config = load_config()
    return config.__dict__


@router.put("/config")
async def update_config(config: TradingConfig):
    save_config(config)
    return {"status": "saved"}
```

Register in `main.py`:
```python
from arctis.routes.risk import router as risk_router
app.include_router(risk_router)
```

**Step 3: Create frontend Settings and Warnings panels**

Create `app/src/components/SettingsPanel.tsx`:
```tsx
import { useEffect, useState } from "react";

const ENGINE_URL = "http://127.0.0.1:8000";

interface Config {
  account_size: number;
  risk_percent: number;
  daily_loss_limit: number;
  max_daily_trades: number;
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    fetch(`${ENGINE_URL}/api/config`).then(r => r.json()).then(setConfig);
  }, []);

  const save = async () => {
    if (!config) return;
    await fetch(`${ENGINE_URL}/api/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    onClose();
  };

  if (!config) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
      <div style={{ background: "#1a1a2e", padding: "1.5rem", borderRadius: "8px", width: "400px", border: "1px solid #3a3a4e" }}>
        <h3 style={{ margin: "0 0 1rem" }}>Einstellungen</h3>
        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
          Kontogröße ($)
          <input type="number" value={config.account_size} onChange={e => setConfig({...config, account_size: +e.target.value})}
            style={{ width: "100%", padding: "0.25rem", background: "#2a2a3e", color: "#e0e0e0", border: "1px solid #3a3a4e" }} />
        </label>
        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
          Risiko pro Trade (%)
          <input type="number" step="0.1" value={config.risk_percent} onChange={e => setConfig({...config, risk_percent: +e.target.value})}
            style={{ width: "100%", padding: "0.25rem", background: "#2a2a3e", color: "#e0e0e0", border: "1px solid #3a3a4e" }} />
        </label>
        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
          Tages-Verlustlimit ($)
          <input type="number" value={config.daily_loss_limit} onChange={e => setConfig({...config, daily_loss_limit: +e.target.value})}
            style={{ width: "100%", padding: "0.25rem", background: "#2a2a3e", color: "#e0e0e0", border: "1px solid #3a3a4e" }} />
        </label>
        <label style={{ display: "block", marginBottom: "1rem", fontSize: "0.85rem" }}>
          Max Trades/Tag
          <input type="number" value={config.max_daily_trades} onChange={e => setConfig({...config, max_daily_trades: +e.target.value})}
            style={{ width: "100%", padding: "0.25rem", background: "#2a2a3e", color: "#e0e0e0", border: "1px solid #3a3a4e" }} />
        </label>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "0.5rem 1rem", background: "#2a2a3e", color: "#e0e0e0", border: "1px solid #3a3a4e", cursor: "pointer" }}>Abbrechen</button>
          <button onClick={save} style={{ padding: "0.5rem 1rem", background: "#26a69a", color: "white", border: "none", cursor: "pointer" }}>Speichern</button>
        </div>
      </div>
    </div>
  );
}
```

Create `app/src/components/WarningsPanel.tsx`:
```tsx
import { useEffect, useState } from "react";

const ENGINE_URL = "http://127.0.0.1:8000";

interface WarningData {
  message: string;
  severity: "info" | "caution" | "stop";
}

interface WarningsPanelProps {
  market: string;
  timeframe: string;
}

const SEVERITY_COLORS = {
  info: "#42a5f5",
  caution: "#ffa726",
  stop: "#ef5350",
};

export function WarningsPanel({ market, timeframe }: WarningsPanelProps) {
  const [warnings, setWarnings] = useState<WarningData[]>([]);

  useEffect(() => {
    fetch(`${ENGINE_URL}/api/analysis/warnings?market=${market}&timeframe=${timeframe}`)
      .then(r => r.json())
      .then(data => setWarnings(data.warnings || []))
      .catch(() => setWarnings([]));
  }, [market, timeframe]);

  if (warnings.length === 0) return null;

  return (
    <div style={{ padding: "0.5rem", borderTop: "1px solid #2a2a3e" }}>
      <h4 style={{ margin: "0 0 0.25rem" }}>Hinweise</h4>
      {warnings.map((w, i) => (
        <div key={i} style={{
          padding: "0.25rem 0.5rem",
          marginBottom: "0.25rem",
          borderLeft: `3px solid ${SEVERITY_COLORS[w.severity]}`,
          fontSize: "0.85rem",
          background: "#2a2a3e",
        }}>
          {w.message}
        </div>
      ))}
    </div>
  );
}
```

**Step 4: Add warnings endpoint**

Add to `engine/src/arctis/routes/analysis.py`:
```python
from arctis.analysis.discipline import generate_warnings, DisciplineContext
from arctis.analysis.structure import classify_trend, detect_swings

@router.get("/warnings")
async def get_warnings(
    market: Market = Query(...),
    timeframe: Timeframe = Query(...),
):
    s = _get_store()
    bars = s.load(market, timeframe)
    swings = detect_swings(bars)
    trend = classify_trend(swings)
    current_session = classify_session(int(time.time()))

    ctx = DisciplineContext(
        trend=trend,
        session=current_session.value,
        risk_used_pct=0.0,  # Will be populated from frontend state later
        trade_count=0,
        max_trades=10,
        consecutive_losses=0,
    )
    warnings = generate_warnings(ctx)

    return {
        "warnings": [{"message": w.message, "severity": w.severity.value} for w in warnings],
    }
```

**Step 5: Integrate into Dashboard**

Add SettingsPanel, WarningsPanel, and a settings button to Dashboard.tsx.

**Step 6: Run all tests**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/ -v
```

**Step 7: Commit**

```bash
git add engine/ app/
git commit -m "feat: add settings panel, risk API, and discipline warnings"
```

---

## Phase 5: Polish & Release

### Task 18: Error Handling & CORS

**Files:**
- Modify: `engine/src/arctis/main.py`

**Step 1: Add CORS middleware and error handling**

In `engine/src/arctis/main.py`, add:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1420", "http://127.0.0.1:1420", "tauri://localhost"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Also add a global exception handler:
```python
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": str(exc)},
    )
```

**Step 2: Commit**

```bash
git add engine/
git commit -m "fix: add CORS and global error handling"
```

---

### Task 19: Tauri Build Configuration

**Files:**
- Modify: `app/src-tauri/tauri.conf.json`

**Step 1: Configure Tauri for production build**

Update `tauri.conf.json`:
- Set `productName` to "Arctis"
- Set `identifier` to "com.arctis.app"
- Set window title to "Arctis - Trading Decision Support"
- Set default window size: 1400x900
- Enable resizable

**Step 2: Test production build**

```bash
cd C:\Users\Meriton\Arctis\app
pnpm tauri build
```

**Step 3: Commit**

```bash
git add app/
git commit -m "chore: configure Tauri build settings"
```

---

### Task 20: Final Integration Test

**Step 1: Start the full stack**

```bash
# Terminal 1: Python engine
cd C:\Users\Meriton\Arctis\engine
uv run uvicorn arctis.main:app --host 127.0.0.1 --port 8000

# Terminal 2: Tauri app
cd C:\Users\Meriton\Arctis\app
pnpm tauri dev
```

**Step 2: Test workflow**

1. Import ES CSV data via the app
2. Verify chart renders
3. Check structure analysis (trend displayed)
4. Check volume panel (rel. volume, spikes)
5. Check session timeline (current session highlighted)
6. Open settings, change risk parameters
7. Verify warnings display

**Step 3: Run all Python tests**

```bash
cd C:\Users\Meriton\Arctis\engine
uv run pytest tests/ -v --tb=short
```
Expected: All pass

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: MVP v0.1 complete"
```

---

## Project Structure (Final)

```
Arctis/
├── docs/
│   └── plans/
│       ├── 2026-02-27-arctis-design.md
│       └── 2026-02-27-arctis-implementation.md
├── engine/                          # Python Analysis Engine
│   ├── pyproject.toml
│   ├── src/
│   │   └── arctis/
│   │       ├── __init__.py
│   │       ├── main.py             # FastAPI app
│   │       ├── models.py           # Data models
│   │       ├── csv_parser.py       # CSV import
│   │       ├── storage.py          # Parquet storage
│   │       ├── config.py           # User config
│   │       ├── analysis/
│   │       │   ├── __init__.py
│   │       │   ├── structure.py    # Module A: Market structure
│   │       │   ├── volume.py       # Module B: Volume analysis
│   │       │   ├── sessions.py     # Module C: Session/time logic
│   │       │   ├── probability.py  # Module D: Historical probability
│   │       │   ├── risk.py         # Module E: Risk management
│   │       │   └── discipline.py   # Module F: Discipline warnings
│   │       └── routes/
│   │           ├── __init__.py
│   │           ├── analysis.py     # Analysis endpoints
│   │           ├── probability.py  # Probability endpoints
│   │           └── risk.py         # Risk endpoints
│   └── tests/
│       ├── __init__.py
│       ├── fixtures/
│       │   └── sample_es_1min.csv
│       ├── test_health.py
│       ├── test_csv_parser.py
│       ├── test_storage.py
│       ├── test_analysis_api.py
│       ├── test_structure.py
│       ├── test_volume.py
│       ├── test_sessions.py
│       ├── test_probability.py
│       ├── test_risk.py
│       └── test_discipline.py
├── app/                             # Tauri Desktop App
│   ├── package.json
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   └── components/
│   │       ├── Chart.tsx
│   │       ├── Dashboard.tsx
│   │       ├── VolumePanel.tsx
│   │       ├── SessionTimeline.tsx
│   │       ├── SettingsPanel.tsx
│   │       └── WarningsPanel.tsx
│   └── src-tauri/
│       ├── Cargo.toml
│       ├── tauri.conf.json
│       └── src/
│           └── lib.rs
├── data/                            # Runtime data (gitignored)
│   ├── ES_1min.parquet
│   ├── NQ_1min.parquet
│   └── config.json
└── .gitignore
```
