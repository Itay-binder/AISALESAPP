import crypto from "node:crypto";
import axios from "axios";
import { config } from "./config.js";
import { AnalysisOutput, JobRecord } from "./types.js";

function sign(payload: string): string {
  return crypto.createHmac("sha256", config.crmHmacSecret).update(payload).digest("hex");
}

export async function deliverToCrm(job: JobRecord, analysis: AnalysisOutput): Promise<void> {
  const body = JSON.stringify({
    idempotency_key: job.idempotencyKey,
    call_id: job.callId,
    uploaded_at: job.upload.uploadedAt,
    analysis
  });
  const signature = sign(body);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Signature-SHA256": signature
  };
  const tenantDb = process.env.CRM_TENANT_DATABASE_ID?.trim();
  if (tenantDb) {
    headers["x-crm-tenant-database-id"] = tenantDb;
  }

  await axios.post(config.crmWebhookUrl, body, {
    headers,
    timeout: 10000
  });
}
