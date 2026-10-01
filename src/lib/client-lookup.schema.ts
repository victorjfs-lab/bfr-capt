import { z } from "zod";

const lookupEmailSchema = z
  .string()
  .trim()
  .email("Informe um e-mail válido.")
  .max(180)
  .toLowerCase();

export const clientLookupAccessSchema = z.object({
  password: z.string().max(200).default(""),
});

export const clientLookupSchema = z.object({
  password: z.string().max(200).default(""),
  email: lookupEmailSchema,
});

export type ClientLookupRecord = {
  system: "BFR" | "FOREX";
  name: string;
  email: string;
  approvedAt: string;
  daysWithSystem: number;
};

export type ClientLookupResult = {
  email: string;
  clients: ClientLookupRecord[];
  forexAvailable: boolean;
};
