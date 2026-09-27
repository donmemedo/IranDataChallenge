# داده‌چالش ایران · IranDataChallenge

Kaggle-style data-challenge platform for Iran (see the business plan PDFs in this folder).
FA/EN (RTL/LTR), light/dark, fully responsive.

## Run

```bash
docker compose up -d --build
```

- Web: http://localhost:3034 (redirects to `/fa`, English at `/en`)
- API: http://localhost:8033/docs

## Layout

- `backend/` FastAPI + SQLite (`/data/app.db` volume). Challenges, CSV submission scoring against a hidden test set (accuracy / macro-F1 / RMSE), leaderboards, B2B leads.
- `frontend/` Next.js 16 (App Router) + Tailwind v4 + Motion. `/api/*` is proxied to the backend.

## Dev

```bash
cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt httpx pytest
.venv/bin/pytest -q && .venv/bin/uvicorn main:app --reload
cd frontend && npm i && npm run dev   # http://localhost:3000
```

## Not built yet

Auth/accounts, admin panel for creating challenges (they're seeded in `backend/main.py`), real datasets/sandbox, payments, PWA/APK/IPA.
