# GRAL GNSS Observatory — Backend (FastAPI)

A working backend for the ICTP GRAL station dashboard. Parses RINEX 3.x
observation files (already Hatanaka-decompressed to .rnx), stores results
in a database, and serves them as JSON for the frontend.

## Project layout
```
app/
  parser.py     -- core RINEX parsing logic (returns dicts, no file writing)
  database.py   -- SQLAlchemy models (Session, SatelliteSummary, EpochRecord)
  ingest.py     -- ingestion job: parses .rnx files in a folder, inserts into DB,
                   skips files already ingested (safe to re-run / schedule)
  main.py       -- FastAPI app exposing the API endpoints
batch/          -- put your decompressed .rnx files here for local testing
requirements.txt
```

## Setup
```bash
pip install -r requirements.txt
```

## 1. Ingest your files (run once, or re-run whenever new files arrive)
```bash
python -m app.ingest batch
```
This creates `gnss.db` (SQLite) locally. Already-ingested files are
automatically skipped, so it's safe to run this repeatedly, e.g. from a
scheduled job, without creating duplicate sessions.

## 2. Run the API
```bash
uvicorn app.main:app --reload
```
Then open http://127.0.0.1:8000/docs for interactive API docs (Swagger UI) --
you can test every endpoint from the browser without building the frontend yet.

## Endpoints
- `GET /api/sessions` -- all processed sessions (station, time, position)
- `GET /api/satellites` -- satellite summary (completeness, SNR, multipath,
  ionospheric delay) combined across ALL sessions
- `GET /api/satellites?session_id=2` -- same, but for one specific session
- `GET /api/epochs?session_id=2` -- per-second satellite counts + SNR for one
  session (powers the live-style trend charts)
- `GET /api/stations/GRAL/summary` -- quick top-tile stats (avg completeness,
  avg SNR, satellite count, low-quality count)

