import { z } from "zod";

const emailSchema = z.string().trim().email("Informe um e-mail válido.").max(180).toLowerCase();
const tokenSchema = z
  .string()
  .trim()
  .regex(/^[a-f0-9]{64}$/i, "Convite inválido.");

export const courseInviteSchema = z.object({
  password: z.string().min(1).max(200),
  email: emailSchema,
});

export const courseProtectedRegistrationSchema = z.object({
  token: tokenSchema,
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  email: emailSchema,
});

export const courseTokenSchema = z.object({
  token: tokenSchema,
});

export const courseAdminAccessSchema = z.object({
  password: z.string().min(1).max(200),
});

export const courseApprovalSchema = z.object({
  password: z.string().min(1).max(200),
  registrationId: z.number().int().positive(),
});

export type CourseInviteStatus = "invited" | "pending" | "approved";

export type CourseRegistrationRecord = {
  id: number;
  name: string;
  email: string;
  inviteToken: string;
  status: CourseInviteStatus;
  createdAt: string;
  registeredAt: string | null;
  approvedAt: string | null;
  expiresAt: string | null;
  accessExpired: boolean;
};

export type CoursePublicInvitation = {
  name: string;
  status: CourseInviteStatus;
};

export type CourseActionResult =
  | { ok: true; status: CourseInviteStatus; name: string; token: string }
  | { ok: false; message: string };
