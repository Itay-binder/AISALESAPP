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
  crmWebhookUrl: required("CRM_WEBHOOK_URL"),
  crmHmacSecret: required("CRM_HMAC_SECRET"),
  uploadTokenSigningSecret: required("UPLOAD_TOKEN_SIGNING_SECRET"),
  jobRetryLimit: Number(process.env.JOB_RETRY_LIMIT ?? "5")
};
