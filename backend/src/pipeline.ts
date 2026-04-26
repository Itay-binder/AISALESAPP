import { analyzeTranscript } from "./analyze.js";
import { config } from "./config.js";
import { deliverToCrm } from "./delivery.js";
import { getJob, incrementAttempt, setAnalysis, setTranscript, updateJobStatus } from "./jobsStore.js";
import { transcribeFromGcsUri } from "./transcribe.js";

export async function processCall(callId: string): Promise<void> {
  const job = await getJob(callId);
  if (!job) {
    throw new Error(`Job not found: ${callId}`);
  }

  const attempts = await incrementAttempt(callId);
  if (attempts > config.jobRetryLimit) {
    await updateJobStatus(callId, "failed", { lastError: "Exceeded retry limit" });
    return;
  }

  try {
    await updateJobStatus(callId, "transcribing");
    const gcsUri = `gs://${config.gcsBucket}/${job.upload.recordingPath}`;
    const transcript = await transcribeFromGcsUri(gcsUri);
    await setTranscript(callId, transcript);
    await updateJobStatus(callId, "transcribed");

    await updateJobStatus(callId, "analyzing");
    const analysis = await analyzeTranscript(transcript, job.upload);
    await setAnalysis(callId, analysis);

    if (config.enableCrmDelivery) {
      await updateJobStatus(callId, "delivering");
      await deliverToCrm(job, analysis);
    }

    await updateJobStatus(callId, "completed");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown pipeline error";
    await updateJobStatus(callId, "failed", { lastError: message });
    throw error;
  }
}
