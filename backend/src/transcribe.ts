import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import OpenAI from "openai";
import { config } from "./config.js";
import { downloadToTemp } from "./storage.js";

const openai = new OpenAI({ apiKey: config.openAiApiKey });

export async function transcribeFromGcsUri(gcsUri: string): Promise<string> {
  const prefix = `gs://${config.gcsBucket}/`;
  if (!gcsUri.startsWith(prefix)) {
    throw new Error(`Unexpected GCS URI: ${gcsUri}`);
  }
  const objectPath = gcsUri.slice(prefix.length);
  const tempPath = path.join(os.tmpdir(), `recording-${Date.now()}-${Math.random().toString(16).slice(2)}.audio`);

  await downloadToTemp(objectPath, tempPath);
  try {
    const transcription = await openai.audio.transcriptions.create({
      model: config.openAiTranscriptionModel,
      file: fs.createReadStream(tempPath)
    });
    return (transcription.text ?? "").trim();
  } finally {
    fs.promises.unlink(tempPath).catch(() => undefined);
  }
}
