import { Storage } from "@google-cloud/storage";
import { config } from "./config.js";

const storage = new Storage({ projectId: config.gcpProjectId });
const bucket = storage.bucket(config.gcsBucket);

export async function uploadBufferToGcs(path: string, data: Buffer, contentType?: string): Promise<void> {
  const file = bucket.file(path);
  await file.save(data, {
    resumable: false,
    metadata: contentType ? { contentType } : undefined
  });
}

export async function downloadToTemp(path: string, destination: string): Promise<void> {
  const file = bucket.file(path);
  await file.download({ destination });
}
