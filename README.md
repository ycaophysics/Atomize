# Atomize Stage 0

Next.js 14 App Router prototype for task inventory, breakdowns, and Now Card.

## Setup

1. Install dependencies
2. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY`
3. Run `npm run dev`

## Storage

Default storage is JSON at `data/atomize.json`.

To use SQLite:

```
ATOMIZE_STORAGE=sqlite
ATOMIZE_SQLITE_PATH=data/atomize.db
```

## Notes

- Stage 0 has no calendar sync.
- Gemini model defaults to `gemini-3.0-flash`.
