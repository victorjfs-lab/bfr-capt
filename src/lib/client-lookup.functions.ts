import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";
import { z } from "zod";

import { authorizeMainAdmin } from "./admin-session.server";
import {
  clientLookupAccessSchema,
  clientLookupSchema,
  type ClientLookupRecord,
  type ClientLookupResult,
} from "./client-lookup.schema";
import { findApprovedCourseRegistrationByEmail } from "./course.server";
import { createCrossSiteLookupSignature, normalizeLookupEmail } from "./cross-site-lookup.server";

const dayInMilliseconds = 86_400_000;
const defaultForexLookupUrl = "https://nexumelite.fluxosimplificado.com/api/internal/client-lookup";

const remoteResponseSchema = z.object({
  ok: z.literal(true),
  client: z
    .object({
      name: z.string(),
      email: z.string(),
      approvedAt: z.string(),
    })
    .nullable(),
});

function disableResponseCache() {
  setResponseHeaders(
    new Headers({
      "Cache-Control": "no-store, private",
      Pragma: "no-cache",
    }),
  );
}

function daysWithSystem(approvedAt: string) {
  const approvedTimestamp = new Date(approvedAt).getTime();
  if (!Number.isFinite(approvedTimestamp)) return 0;
  return Math.floor(Math.max(0, Date.now() - approvedTimestamp) / dayInMilliseconds) + 1;
}

async function lookupForexClient(email: string) {
  const timestamp = Date.now();
  const signature = createCrossSiteLookupSignature(email, timestamp);
  const endpoint = process.env.FOREX_LOOKUP_URL?.trim() || defaultForexLookupUrl;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, timestamp, signature }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) throw new Error("Consulta FOREX indisponível.");
  return remoteResponseSchema.parse(await response.json()).client;
}

export const getClientLookupAccess = createServerFn({ method: "POST" })
  .validator(clientLookupAccessSchema)
  .handler(async ({ data }) => {
    disableResponseCache();
    if (!authorizeMainAdmin(data.password)) throw new Error("Acesso não autorizado.");
    return { ok: true } as const;
  });

export const lookupClientAcrossSites = createServerFn({ method: "POST" })
  .validator(clientLookupSchema)
  .handler(async ({ data }): Promise<ClientLookupResult> => {
    disableResponseCache();
    if (!authorizeMainAdmin(data.password)) throw new Error("Acesso não autorizado.");

    const email = normalizeLookupEmail(data.email);
    const [bfrRegistration, forexResult] = await Promise.all([
      findApprovedCourseRegistrationByEmail(email),
      lookupForexClient(email)
        .then((client) => ({ available: true as const, client }))
        .catch(() => ({ available: false as const, client: null })),
    ]);
    const clients: ClientLookupRecord[] = [];

    if (bfrRegistration?.approvedAt) {
      clients.push({
        system: "BFR",
        name: bfrRegistration.name,
        email: bfrRegistration.email,
        approvedAt: bfrRegistration.approvedAt,
        daysWithSystem: daysWithSystem(bfrRegistration.approvedAt),
      });
    }

    if (forexResult.client) {
      clients.push({
        system: "FOREX",
        name: forexResult.client.name,
        email: forexResult.client.email,
        approvedAt: forexResult.client.approvedAt,
        daysWithSystem: daysWithSystem(forexResult.client.approvedAt),
      });
    }

    return {
      email,
      clients,
      forexAvailable: forexResult.available,
    };
  });
