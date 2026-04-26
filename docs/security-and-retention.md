# Security and Retention

## Consent and legal

- First-run screen must require explicit opt-in before scan/upload starts.
- Explain what is collected (audio), where it is processed (GCP/OpenAI), and output destination (CRM).
- Keep consent timestamp per device/user for audit.

## Token-based auth

- Android requests short-lived upload token from `POST /v1/upload-token`.
- Upload completion endpoint accepts only valid signed token (`Authorization: Bearer`).
- Never store long-lived cloud credentials on device.

## Data protection

- Enforce HTTPS/TLS for all traffic.
- GCS bucket should be private, uniform bucket-level access enabled.
- Firestore rules should deny public read/write.
- Use Secret Manager for `OPENAI_API_KEY`, `CRM_HMAC_SECRET`, and token signing secret.

## Retention policy

- Raw audio lifecycle: auto-delete after 30 days.
- Transcript + analysis: retain for business period (for example 180 days).
- Job metadata in Firestore retained for replay/audit.
- Implement delete-by-call-id operation for privacy requests.

## Logging and PII

- Log only call IDs and status transitions.
- Never log transcripts or full payloads in plain text.
