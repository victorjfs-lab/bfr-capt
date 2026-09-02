import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { authorizeMainAdmin } from "./admin-session.server";
import {
  approveCourseInvite,
  checkCourseToken,
  createCourseInvite,
  getPublicInvitation,
  listCourseRegistrations,
  registerCourseInvite,
  updateCourseProgress,
} from "./course.server";
import {
  courseAdminAccessSchema,
  courseApprovalSchema,
  courseInviteSchema,
  courseProgressSchema,
  courseProtectedRegistrationSchema,
  courseTokenSchema,
} from "./course.schema";

function disableResponseCache() {
  setResponseHeaders(
    new Headers({
      "Cache-Control": "no-store, private",
      Pragma: "no-cache",
    }),
  );
}

export const getCourseInvitation = createServerFn({ method: "POST" })
  .validator(courseTokenSchema)
  .handler(async ({ data }) => {
    disableResponseCache();
    return await getPublicInvitation(data.token);
  });

export const registerProtectedCourseUser = createServerFn({ method: "POST" })
  .validator(courseProtectedRegistrationSchema)
  .handler(async ({ data }) => {
    disableResponseCache();
    return await registerCourseInvite(data);
  });

export const requestCourseAccess = createServerFn({ method: "POST" })
  .validator(courseTokenSchema)
  .handler(async ({ data }) => {
    disableResponseCache();
    return await checkCourseToken(data.token);
  });

export const saveCourseProgress = createServerFn({ method: "POST" })
  .validator(courseProgressSchema)
  .handler(async ({ data }) => {
    disableResponseCache();
    return await updateCourseProgress(data.token, data.completedLessons);
  });

export const getCourseRegistrations = createServerFn({ method: "POST" })
  .validator(courseAdminAccessSchema)
  .handler(async ({ data }) => {
    disableResponseCache();
    if (!authorizeMainAdmin(data.password)) throw new Error("Acesso não autorizado.");
    return await listCourseRegistrations();
  });

export const generateCourseInvite = createServerFn({ method: "POST" })
  .validator(courseInviteSchema)
  .handler(async ({ data }) => {
    disableResponseCache();
    if (!authorizeMainAdmin(data.password)) throw new Error("Acesso não autorizado.");
    return await createCourseInvite(data.email);
  });

export const approveCourseRegistration = createServerFn({ method: "POST" })
  .validator(courseApprovalSchema)
  .handler(async ({ data }) => {
    disableResponseCache();
    if (!authorizeMainAdmin(data.password)) throw new Error("Acesso não autorizado.");
    return await approveCourseInvite(data.registrationId);
  });
