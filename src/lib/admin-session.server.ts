import { createHmac, timingSafeEqual } from "node:crypto";

import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

import { isAdminPasswordValid } from "./leads.server";

const adminSessionCookie = "nexum_admin_session";
const sessionLifetimeSeconds = 60 * 60 * 24 * 365;

function expectedSessionToken() {
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password) {
    if (process.env.NODE_ENV === "production") return "";
    return createHmac("sha256", "nexum-admin").update("nexum-main-session-v1").digest("hex");
  }

  return createHmac("sha256", password).update("nexum-main-session-v1").digest("hex");
}

function safeCompare(candidate: string, expected: string) {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return (
    candidateBuffer.length === expectedBuffer.length &&
    timingSafeEqual(candidateBuffer, expectedBuffer)
  );
}

function persistSession(token: string) {
  setCookie(adminSessionCookie, token, {
    httpOnly: true,
    maxAge: sessionLifetimeSeconds,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}

export function authorizeMainAdmin(password: string) {
  const expectedToken = expectedSessionToken();
  if (!expectedToken) return false;

  const currentToken = getCookie(adminSessionCookie) ?? "";
  if (currentToken && safeCompare(currentToken, expectedToken)) {
    persistSession(expectedToken);
    return true;
  }

  if (!isAdminPasswordValid(password)) return false;

  persistSession(expectedToken);
  return true;
}

export function clearMainAdminSession() {
  deleteCookie(adminSessionCookie, {
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}
