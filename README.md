# Call Recording Pipeline (Android + GCP + Vercel)

Monorepo skeleton implementing the approved MVP:

- Android native collector app (Samsung call recording discovery, file stability checks, dedup, secure upload).
- GCP backend services on Cloud Run (ingest, transcription orchestration, AI analysis, CRM delivery, retries).
- CRM webhook with HMAC signature verification and idempotency handling (see `integrations/liftygo-crm/` for your real CRM repo).
- Firestore as source of truth for job state and audit trail.

## GitHub repositories

- **Collector + backend (push this monorepo here):** [Itay-binder/AISALESAPP](https://github.com/Itay-binder/AISALESAPP.git)  
  The GitHub page currently shows the repository as empty; after you initialize git locally, add this remote and push `android-app/`, `backend/`, `docs/`, and `integrations/`.
- **Production CRM (Next.js on Vercel):** [Itay-binder/CRM](https://github.com/Itay-binder/CRM)  
  Add the route from [`integrations/liftygo-crm/`](integrations/liftygo-crm/README.md) so call insights land in your existing app.

## Structure

- `android-app/` Android Studio Kotlin project (collector app skeleton)
- `backend/` Cloud Run TypeScript service
- `vercel-crm/` standalone Next.js API sample (optional; prefer integrating into **CRM** repo above)
- `integrations/liftygo-crm/` drop-in `app/api/ingest/call-insights/route.ts` for **Itay-binder/CRM**
- `docs/` security, retention, and runbook notes

## MVP Data Flow

1. Android detects new Samsung call recording file and waits for file-size stability.
2. Android requests short-lived upload token from backend.
3. Android uploads audio to GCS and notifies ingest endpoint.
4. Backend stores job record in Firestore and triggers transcription + analysis.
5. Backend sends signed insight payload to your CRM (`POST /api/ingest/call-insights`).
6. CRM verifies HMAC, deduplicates by idempotency key, persists to Firestore collection `call_insights`.

## Quick Start

### Backend

1. `cd backend`
2. `npm install`
3. Set environment variables (see `.env.example`).
4. `npm run dev`

### CRM (Liftygo — real repo)

1. Copy `integrations/liftygo-crm/app/api/ingest/call-insights/route.ts` into [Itay-binder/CRM](https://github.com/Itay-binder/CRM).
2. Set `CRM_HMAC_SECRET` on Vercel (same value as backend `CRM_HMAC_SECRET`).
3. Point backend `CRM_WEBHOOK_URL` to `https://<your-crm-host>/api/ingest/call-insights`.
4. If you use a non-default Firestore database, set backend `CRM_TENANT_DATABASE_ID` and ensure CRM `CRM_TENANTS` / headers match your setup.

### Standalone sample API (optional)

1. `cd vercel-crm`
2. `npm install`
3. Set environment variables (see `.env.example`).
4. `npm run dev`

### Android

1. Open `android-app/` in Android Studio.
2. Add API base URL and required permissions.
3. Build and run on Samsung device for recording-path validation.

## Notes

- Recording path and media access behavior vary by Android version and Samsung firmware.
- Always present user consent and legal notice before enabling upload.
- Use production secrets manager for all keys/tokens; never hardcode secrets in app.
