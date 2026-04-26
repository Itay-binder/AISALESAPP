import crypto from "node:crypto";
import { config } from "./config.js";

export interface UploadTokenPayload {
  callId: string;
  agentId: string;
  recordingFingerprint: string;
  exp: number;
}

function base64Url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function signUploadToken(payload: UploadTokenPayload): string {
  const encoded = base64Url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", config.uploadTokenSigningSecret).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyUploadToken(token: string): UploadTokenPayload {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    throw new Error("Invalid token format");
  }
  const expected = crypto
    .createHmac("sha256", config.uploadTokenSigningSecret)
    .update(encoded)
    .digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("Invalid token signature");
  }
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as UploadTokenPayload;
  if (Date.now() / 1000 > payload.exp) {
    throw new Error("Token expired");
  }
  return payload;
}
