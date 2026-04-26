import { SpeechClient } from "@google-cloud/speech";
import { config } from "./config.js";

const client = new SpeechClient({ projectId: config.gcpProjectId });

export async function transcribeFromGcsUri(gcsUri: string): Promise<string> {
  const [operation] = await client.longRunningRecognize({
    config: {
      encoding: "LINEAR16",
      languageCode: "he-IL",
      alternativeLanguageCodes: ["en-US"],
      enableAutomaticPunctuation: true
    },
    audio: {
      uri: gcsUri
    }
  });

  const [response] = await operation.promise();
  const parts = response.results?.map((r) => r.alternatives?.[0]?.transcript ?? "").filter(Boolean) ?? [];
  return parts.join("\n").trim();
}
