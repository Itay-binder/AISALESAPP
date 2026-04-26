import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? "8080"),
  gcpProjectId: required("GCP_PROJECT_ID"),
  gcsBucket: required("GCS_BUCKET"),
  /** אם יצרת מסד בשם לא default — למשל aisalesapp. אם ריק, ה-SDK משתמש ב-(default). */
  firestoreDatabaseId: process.env.FIRESTORE_DATABASE_ID?.trim() || undefined,
  firestoreCollection: process.env.FIRESTORE_COLLECTION ?? "call_jobs",
  openAiApiKey: required("OPENAI_API_KEY"),
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
  openAiTranscriptionModel: process.env.OPENAI_TRANSCRIPTION_MODEL ?? "gpt-4o-mini-transcribe",
  enableCrmDelivery: process.env.ENABLE_CRM_DELIVERY === "true",
  crmWebhookUrl: process.env.CRM_WEBHOOK_URL?.trim(),
  crmHmacSecret: process.env.CRM_HMAC_SECRET?.trim(),
  uploadTokenSigningSecret: required("UPLOAD_TOKEN_SIGNING_SECRET"),
  jobRetryLimit: Number(process.env.JOB_RETRY_LIMIT ?? "5")
};
