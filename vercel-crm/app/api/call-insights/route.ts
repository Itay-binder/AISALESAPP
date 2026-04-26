import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { firestoreAdmin } from "@/lib/firebaseAdmin";

const analysisSchema = z.object({
  call_id: z.string(),
  agent_id: z.string(),
  customer_id: z.string().optional(),
  summary_short: z.string(),
  tab1_general_summary: z.string(),
  tab2_personal_analysis: z.string(),
  tab3_recommendations: z.string(),
  document_markdown: z.string(),
  confidence: z.number()
});

const payloadSchema = z.object({
  idempotency_key: z.string().min(8),
  call_id: z.string(),
  uploaded_at: z.string(),
  analysis: analysisSchema
});

function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.CRM_HMAC_SECRET?.trim() ?? "";
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature-sha256") ?? "";
  const rawBody = await req.text();
  if (!signature || !verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const parsedPayload = payloadSchema.safeParse(JSON.parse(rawBody));
  if (!parsedPayload.success) {
    return NextResponse.json({ error: parsedPayload.error.flatten() }, { status: 400 });
  }
  const payload = parsedPayload.data;

  const db = firestoreAdmin();
  const docRef = db.collection("crm_call_insights").doc(payload.idempotency_key);
  const existing = await docRef.get();
  if (existing.exists) {
    return NextResponse.json({ duplicate: true }, { status: 200 });
  }

  await docRef.set({
    ...payload,
    received_at: new Date().toISOString()
  });

  return NextResponse.json({ ok: true });
}
