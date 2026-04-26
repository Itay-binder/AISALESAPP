import { Firestore } from "@google-cloud/firestore";
import { config } from "./config.js";
import { AnalysisOutput, JobRecord, JobStatus, UploadNotification } from "./types.js";

const firestore = new Firestore({
  projectId: config.gcpProjectId,
  ...(config.firestoreDatabaseId
    ? { databaseId: config.firestoreDatabaseId }
    : {})
});
const jobs = firestore.collection(config.firestoreCollection);

function nowIso(): string {
  return new Date().toISOString();
}

export async function createOrUpdateUploadedJob(upload: UploadNotification): Promise<JobRecord> {
  const idempotencyKey = `${upload.callId}:${upload.recordingPath}:${upload.fileSizeBytes}`;
  const ref = jobs.doc(upload.callId);
  const snap = await ref.get();

  if (snap.exists) {
    const existing = snap.data() as JobRecord;
    const merged: JobRecord = {
      ...existing,
      upload,
      updatedAt: nowIso(),
      idempotencyKey
    };
    await ref.set(merged, { merge: true });
    return merged;
  }

  const created: JobRecord = {
    callId: upload.callId,
    status: "uploaded",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    attempts: 0,
    idempotencyKey,
    upload
  };
  await ref.set(created);
  return created;
}

export async function updateJobStatus(callId: string, status: JobStatus, partial?: Partial<JobRecord>): Promise<void> {
  await jobs.doc(callId).set(
    {
      status,
      updatedAt: nowIso(),
      ...partial
    },
    { merge: true }
  );
}

export async function incrementAttempt(callId: string): Promise<number> {
  const ref = jobs.doc(callId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error(`Job not found: ${callId}`);
  }
  const data = snap.data() as JobRecord;
  const attempts = (data.attempts ?? 0) + 1;
  await ref.set({ attempts, updatedAt: nowIso() }, { merge: true });
  return attempts;
}

export async function getJob(callId: string): Promise<JobRecord | null> {
  const snap = await jobs.doc(callId).get();
  if (!snap.exists) {
    return null;
  }
  return snap.data() as JobRecord;
}

export async function setTranscript(callId: string, transcript: string): Promise<void> {
  await jobs.doc(callId).set({ transcript, updatedAt: nowIso() }, { merge: true });
}

export async function setAnalysis(callId: string, analysis: AnalysisOutput): Promise<void> {
  await jobs.doc(callId).set({ analysis, updatedAt: nowIso() }, { merge: true });
}
