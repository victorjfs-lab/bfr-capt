import { Buffer } from "node:buffer";

import { createFileRoute } from "@tanstack/react-router";

import { checkCourseToken, recordIndicatorDownload } from "../../lib/course.server";
import { indicatorsArchiveBase64 } from "../../lib/indicators.asset";

export const Route = createFileRoute("/api/indicadores")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestUrl = new URL(request.url);
        const token = requestUrl.searchParams.get("convite")?.trim() ?? "";

        if (!/^[a-f0-9]{64}$/i.test(token)) {
          return new Response("Acesso não autorizado.", { status: 403 });
        }

        const access = await checkCourseToken(token);
        if (!access.ok) {
          return new Response("Acesso não autorizado.", { status: 403 });
        }

        await recordIndicatorDownload(token);

        const file = Buffer.from(indicatorsArchiveBase64, "base64");

        return new Response(new Uint8Array(file), {
          headers: {
            "Cache-Control": "private, no-store",
            "Content-Disposition": 'attachment; filename="Nexum-Setembro.zip"',
            "Content-Length": String(file.byteLength),
            "Content-Type": "application/zip",
            Pragma: "no-cache",
          },
        });
      },
    },
  },
});
