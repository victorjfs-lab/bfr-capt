import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { authorizeMainAdmin } from "./admin-session.server";
import { insertLead, listLeads } from "./leads.server";
import { adminAccessSchema, leadInputSchema } from "./leads.schema";

export const registerLead = createServerFn({ method: "POST" })
  .validator(leadInputSchema)
  .handler(async ({ data }) => await insertLead(data));

export const getLeads = createServerFn({ method: "POST" })
  .validator(adminAccessSchema)
  .handler(async ({ data }) => {
    setResponseHeaders(
      new Headers({
        "Cache-Control": "no-store, private",
        Pragma: "no-cache",
      }),
    );

    if (!authorizeMainAdmin(data.password)) {
      throw new Error("Acesso não autorizado.");
    }

    return await listLeads();
  });
