import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import {
  isConfiguredHotmartProduct,
  isHotmartHottokValid,
  markPurchaseEmailError,
  markPurchaseEmailSent,
  revokePurchase,
  saveApprovedPurchase,
  sendPurchaseDeliveryEmail,
} from "../../lib/purchases.server";

const hotmartWebhookSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  event: z.string().min(1),
  hottok: z.string().optional(),
  data: z.object({
    buyer: z.object({
      email: z.string().email(),
      name: z.string().min(1),
    }),
    product: z.object({
      id: z.union([z.string(), z.number()]).transform(String),
      ucode: z.string().optional(),
      name: z.string().optional().default("NEXUM"),
    }),
    purchase: z.object({
      transaction: z.string().min(1),
      approved_date: z.number().optional(),
      status: z.string().optional(),
    }),
  }),
});

const approvedEvents = new Set(["PURCHASE_APPROVED", "PURCHASE_COMPLETE"]);
const revokedEvents = new Set(["PURCHASE_CANCELED", "PURCHASE_REFUNDED", "PURCHASE_CHARGEBACK"]);

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, private" },
  });
}

export const Route = createFileRoute("/api/hotmart")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let rawPayload: unknown;
        try {
          rawPayload = await request.json();
        } catch {
          return jsonResponse({ ok: false, message: "JSON inválido." }, 400);
        }

        const payload = hotmartWebhookSchema.safeParse(rawPayload);
        if (!payload.success) {
          return jsonResponse({ ok: false, message: "Payload inválido." }, 400);
        }

        const hottok = request.headers.get("x-hotmart-hottok") || payload.data.hottok;
        if (!isHotmartHottokValid(hottok)) {
          return jsonResponse({ ok: false, message: "Não autorizado." }, 401);
        }

        const { event, id, data } = payload.data;
        if (!isConfiguredHotmartProduct(data.product.id, data.product.ucode)) {
          return jsonResponse({ ok: true, ignored: true, reason: "product" });
        }

        if (revokedEvents.has(event)) {
          await revokePurchase(data.purchase.transaction, id);
          return jsonResponse({ ok: true, revoked: true });
        }

        if (!approvedEvents.has(event)) {
          return jsonResponse({ ok: true, ignored: true, reason: "event" });
        }

        const approvedAt = data.purchase.approved_date
          ? new Date(data.purchase.approved_date).toISOString()
          : new Date().toISOString();
        const purchase = await saveApprovedPurchase({
          transactionId: data.purchase.transaction,
          eventId: id,
          buyerName: data.buyer.name.trim(),
          buyerEmail: data.buyer.email.trim().toLowerCase(),
          productId: data.product.id,
          productName: data.product.name || "NEXUM",
          approvedAt,
        });

        if (!purchase.emailSentAt) {
          try {
            await sendPurchaseDeliveryEmail(purchase);
            await markPurchaseEmailSent(purchase.transactionId);
          } catch (error) {
            await markPurchaseEmailError(purchase.transactionId, error);
            console.error("Falha ao enviar a entrega automática da Hotmart.", error);
            return jsonResponse({ ok: false, message: "Falha temporária no envio." }, 500);
          }
        }

        return jsonResponse({ ok: true, delivered: true });
      },
    },
  },
});
