import { Buffer } from "node:buffer";

import { createFileRoute } from "@tanstack/react-router";

import { indicatorsArchiveBase64 } from "../../../lib/indicators.asset";
import { findApprovedPurchaseByToken, recordPurchaseDownload } from "../../../lib/purchases.server";

export const Route = createFileRoute("/api/compra/arquivo")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestUrl = new URL(request.url);
        const token = requestUrl.searchParams.get("token")?.trim() ?? "";

        if (!/^[a-f0-9]{64}$/i.test(token)) {
          return new Response("Link de download inválido.", { status: 403 });
        }

        const purchase = await findApprovedPurchaseByToken(token);
        if (!purchase) {
          return new Response("Download não autorizado ou compra cancelada.", { status: 403 });
        }

        const file = Buffer.from(indicatorsArchiveBase64, "base64");
        await recordPurchaseDownload(purchase.transactionId);

        return new Response(new Uint8Array(file), {
          headers: {
            "Cache-Control": "private, no-store",
            "Content-Disposition": 'attachment; filename="Nexum-Setembro.zip"',
            "Content-Length": String(file.byteLength),
            "Content-Type": "application/zip",
            Pragma: "no-cache",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
