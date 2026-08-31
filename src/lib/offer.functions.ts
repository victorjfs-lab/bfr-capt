import { timingSafeEqual } from "node:crypto";

import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";
import { z } from "zod";

const offerCouponSchema = z.object({
  coupon: z.string().trim().min(1, "Informe seu cupom.").max(80),
});

const validCoupon = "5Cbonus991";
const checkoutUrl = "https://pay.hotmart.com/S107123618W?off=9qr7qp14";

function couponMatches(candidate: string) {
  const normalizedCandidate = candidate.trim().toLocaleLowerCase("pt-BR");
  const normalizedCoupon = validCoupon.toLocaleLowerCase("pt-BR");
  const candidateBuffer = Buffer.from(normalizedCandidate);
  const couponBuffer = Buffer.from(normalizedCoupon);

  return (
    candidateBuffer.length === couponBuffer.length && timingSafeEqual(candidateBuffer, couponBuffer)
  );
}

export const validateOfferCoupon = createServerFn({ method: "POST" })
  .validator(offerCouponSchema)
  .handler(async ({ data }) => {
    setResponseHeaders(
      new Headers({
        "Cache-Control": "no-store, private",
        Pragma: "no-cache",
      }),
    );

    if (!couponMatches(data.coupon)) {
      return { ok: false as const, message: "Cupom inválido. Confira o código e tente novamente." };
    }

    return {
      ok: true as const,
      originalPrice: "239,90",
      promotionalPrice: "119,90",
      checkoutUrl,
    };
  });
