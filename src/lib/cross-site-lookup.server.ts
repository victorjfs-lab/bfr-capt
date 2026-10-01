import { createHmac, timingSafeEqual } from "node:crypto";

const requestLifetimeMilliseconds = 5 * 60 * 1000;

export function normalizeLookupEmail(email: string) {
  return email.trim().toLowerCase();
}

function sharedLookupSecret() {
  return process.env.CROSS_SITE_LOOKUP_SECRET?.trim() || process.env.ADMIN_PASSWORD?.trim() || "";
}

function signaturePayload(email: string, timestamp: number) {
  return `${timestamp}.${normalizeLookupEmail(email)}`;
}

export function createCrossSiteLookupSignature(email: string, timestamp: number) {
  const secret = sharedLookupSecret();
  if (!secret) throw new Error("Consulta entre sites ainda não configurada.");

  return createHmac("sha256", secret).update(signaturePayload(email, timestamp)).digest("hex");
}

export function verifyCrossSiteLookupSignature(
  email: string,
  timestamp: number,
  candidate: string,
) {
  if (!Number.isSafeInteger(timestamp)) return false;
  if (Math.abs(Date.now() - timestamp) > requestLifetimeMilliseconds) return false;

  const secret = sharedLookupSecret();
  if (!secret || !/^[a-f0-9]{64}$/i.test(candidate)) return false;

  const expected = createHmac("sha256", secret)
    .update(signaturePayload(email, timestamp))
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const candidateBuffer = Buffer.from(candidate, "utf8");

  return (
    expectedBuffer.length === candidateBuffer.length &&
    timingSafeEqual(expectedBuffer, candidateBuffer)
  );
}
