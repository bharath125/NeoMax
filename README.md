# NeoMax

AI video-generation wrapper: users submit a prompt/image, the backend queues a job against a
third-party video model (Kling first, others pluggable), stores the result, and meters usage via credits.

## Architecture

```
frontend (React + Vite)  →  backend API (Express)  →  BullMQ queue (Redis)  →  worker process
                                                                                     │
                                                                     Kling/Runway/Luma provider
                                                                                     │
                                                                            S3 / R2 storage
```

- **API** enqueues generation jobs and reserves credits up front (so nobody can drain the provider budget).
- **Worker** is a separate process (`npm run worker`) that talks to the provider, polls for completion,
  uploads the finished video to storage, and finalizes the job.
- **Provider layer** (`backend/src/services/providers/`) is swappable — `provider.interface.js` documents
  the contract; add a new file per provider and switch `VIDEO_PROVIDER` in `.env`.

## Setup

```bash
cp backend/.env.example backend/.env   # fill in Mongo/Redis/Kling/S3/Stripe values
npm install                             # installs both workspaces
npm run dev:backend                     # API on :4000
npm run dev:worker                      # separate terminal — processes the queue
npm run dev:frontend                    # web UI on :5173 (proxies /api to :4000)
```

Requires a local MongoDB and Redis (or point `.env` at hosted instances).

## Build phases (see plan)

1. Core API wrapper — provider call in, video URL out
2. Auth + Mongo (users, credits)
3. Queue + async job processing (this skeleton)
4. Storage + frontend gallery
5. Credits + Stripe billing
6. Polish + deploy

## Known TODOs before this runs against real traffic

- `backend/src/services/providers/kling.provider.js` — endpoint paths/payload shape are written against
  Kling's documented REST pattern but **must be verified against current Kling API docs** before use.
- `backend/src/controllers/billing.controller.js` — needs real Stripe price IDs and a configured webhook
  endpoint in the Stripe dashboard.
- Frontend `Generate` page accepts an image URL for v1; wire a real pre-signed S3 upload before shipping.
