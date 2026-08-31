import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { authorizeMainAdmin } from "./admin-session.server";
import { approveCourseInvite, listCourseRegistrations } from "./course.server";
import { courseApprovalSchema } from "./course.schema";
import { listLeads } from "./leads.server";
import { adminAccessSchema } from "./leads.schema";

function disableResponseCache() {
  setResponseHeaders(
    new Headers({
      "Cache-Control": "no-store, private",
      Pragma: "no-cache",
    }),
  );
}

export const getAdminOverview = createServerFn({ method: "POST" })
  .validator(adminAccessSchema)
  .handler(async ({ data }) => {
    disableResponseCache();
    if (!authorizeMainAdmin(data.password)) throw new Error("Acesso não autorizado.");

    const [leads, registrations] = await Promise.all([listLeads(), listCourseRegistrations()]);

    return { leads, registrations };
  });

export const approveAdminRegistration = createServerFn({ method: "POST" })
  .validator(courseApprovalSchema)
  .handler(async ({ data }) => {
    disableResponseCache();
    if (!authorizeMainAdmin(data.password)) throw new Error("Acesso não autorizado.");
    return await approveCourseInvite(data.registrationId);
  });
