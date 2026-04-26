# MVP End-to-End Validation

## Preconditions

- Backend and CRM API are running with valid env vars.
- Firestore and GCS are accessible.
- Android app points to backend URL.

## Test checklist

1. Place a sample Samsung call recording file in monitored location.
2. Trigger Android worker from app button (or wait for periodic run).
3. Confirm backend receives `/v1/upload-token` and `/v1/ingest/upload-complete`.
4. Confirm Firestore job transitions:
   - `uploaded` -> `transcribing` -> `transcribed` -> `analyzing` -> `delivering` -> `completed`
5. Confirm CRM endpoint stores record in `crm_call_insights` collection.
6. Re-send same payload and verify idempotent `duplicate: true`.
7. Break CRM URL intentionally and verify backend marks failed; then invoke retry endpoint.

## KPIs to capture

- Upload success rate.
- End-to-end latency (`uploadedAt` to CRM `received_at`).
- Duplicate prevention effectiveness.
- Retry success after transient failures.
