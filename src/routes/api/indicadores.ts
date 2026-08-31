import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createFileRoute } from "@tanstack/react-router";

import { checkCourseToken } from "../../lib/course.server";

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

        try {
          const file = await readFile(
            resolve(process.cwd(), "private-assets", "nexum-setembro.zip"),
          );

          return new Response(new Uint8Array(file), {
            headers: {
              "Cache-Control": "private, no-store",
              "Content-Disposition": 'attachment; filename="Nexum-Setembro.zip"',
              "Content-Length": String(file.byteLength),
              "Content-Type": "application/zip",
              Pragma: "no-cache",
            },
          });
        } catch {
          return new Response("Arquivo temporariamente indisponível.", { status: 503 });
        }
      },
    },
  },
});
