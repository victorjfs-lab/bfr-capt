import { z } from "zod";

export const leadInputSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  whatsapp: z
    .string()
    .trim()
    .min(8, "Informe um WhatsApp válido.")
    .max(30)
    .refine((value) => value.replace(/\D/g, "").length >= 10, "Informe um WhatsApp válido."),
  email: z.string().trim().email("Informe um e-mail válido.").max(180).toLowerCase(),
});

export const adminAccessSchema = z.object({
  password: z.string().min(1).max(200),
});

export type LeadInput = z.infer<typeof leadInputSchema>;

export type LeadRecord = LeadInput & {
  id: number;
  createdAt: string;
};
