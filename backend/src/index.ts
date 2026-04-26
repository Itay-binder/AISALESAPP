import cors from "cors";
import express from "express";
import helmet from "helmet";
import multer from "multer";
import { config } from "./config.js";
import { createOrUpdateUploadedJob, getJob } from "./jobsStore.js";
import { processCall } from "./pipeline.js";
import { uploadBufferToGcs } from "./storage.js";
import { signUploadToken, verifyUploadToken } from "./uploadToken.js";
import { tokenRequestSchema, uploadNotificationSchema } from "./validators.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
const upload = multer({ storage: multer.memoryStorage() });

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, service: "call-recording-backend" });
});

app.post("/v1/upload-token", (req, res) => {
  const parsed = tokenRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const input = parsed.data;
  const expiresInSec = input.expiresInSec ?? 600;
  const token = signUploadToken({
    callId: input.callId,
    agentId: input.agentId,
    recordingFingerprint: input.recordingFingerprint,
    exp: Math.floor(Date.now() / 1000) + expiresInSec
  });
  res.json({
    uploadToken: token,
    bucket: config.gcsBucket,
    expiresInSec
  });
});

app.post("/v1/ingest/upload-complete", async (req, res) => {
  const auth = req.header("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  try {
    verifyUploadToken(token);
  } catch {
    res.status(401).json({ error: "Invalid upload token" });
    return;
  }

  const parsed = uploadNotificationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const upload = parsed.data;
  await createOrUpdateUploadedJob(upload);
  // MVP: fire-and-forget. In production, move this to Pub/Sub task queue.
  void processCall(upload.callId).catch(() => undefined);

  res.status(202).json({ accepted: true, callId: upload.callId });
});

app.post("/v1/upload-file", upload.single("file"), async (req, res) => {
  const auth = req.header("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  let claims;
  try {
    claims = verifyUploadToken(token);
  } catch {
    res.status(401).json({ error: "Invalid upload token" });
    return;
  }

  const file = req.file;
  if (!file?.buffer?.length) {
    res.status(400).json({ error: "Missing uploaded file" });
    return;
  }

  const callId = String(req.body.callId ?? claims.callId);
  const agentId = String(req.body.agentId ?? claims.agentId);
  const customerId = req.body.customerId ? String(req.body.customerId) : undefined;
  const recordingPath = String(req.body.recordingPath ?? `incoming/${callId}.wav`);

  await uploadBufferToGcs(recordingPath, file.buffer, file.mimetype);
  const uploadMeta = {
    callId,
    agentId,
    customerId,
    recordingPath,
    fileSizeBytes: file.size,
    uploadedAt: new Date().toISOString()
  };
  await createOrUpdateUploadedJob(uploadMeta);
  void processCall(callId).catch(() => undefined);

  res.status(202).json({ accepted: true, callId, recordingPath });
});

app.get("/v1/jobs/:callId", async (req, res) => {
  const job = await getJob(req.params.callId);
  if (!job) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(job);
});

app.post("/v1/jobs/:callId/retry", async (req, res) => {
  try {
    await processCall(req.params.callId);
    res.json({ retried: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Retry failed";
    res.status(500).json({ error: message });
  }
});

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on :${config.port}`);
});
