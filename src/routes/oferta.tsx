import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  CreditCard,
  Gauge,
  LockKeyhole,
  Play,
  ShieldCheck,
  Sparkles,
  Tag,
} from "lucide-react";
import { FormEvent, useState } from "react";

import { validateOfferCoupon } from "../lib/offer.functions";

export const Route = createFileRoute("/oferta")({
  component: NexumOfferPage,
  head: () => ({
    meta: [
      { title: "Oferta especial NEXUM | Indicador de Fluxo" },
      {
        name: "description",
        content:
          "Oferta especial do pacote NEXUM com indicadores, treinamento de instalação e grupo de estudos.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type CouponResult = {
  ok: true;
  originalPrice: string;
  promotionalPrice: string;
  checkoutUrl: string;
} | null;

type CheckoutCardProps = {
  id: string;
  coupon: string;
  setCoupon: (value: string) => void;
  result: CouponResult;
  error: string;
  loading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function CheckoutCard({
  id,
  coupon,
  setCoupon,
  result,
  error,
  loading,
  onSubmit,
}: CheckoutCardProps) {
  return (
    <div className={`offer-checkout-card ${result ? "is-unlocked" : ""}`}>
      <div className="offer-checkout-heading">
        <span className="offer-checkout-icon">
          {result ? <CheckCircle2 aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}
        </span>
        <div>
          <span>{result ? "Cupom aplicado" : "Tem um cupom?"}</span>
          <strong>
            {result
              ? "Seu preço especial foi liberado"
              : "Use abaixo para liberar sua condição especial"}
          </strong>
        </div>
      </div>

      <div className="offer-price-box" aria-live="polite">
        {result ? (
          <>
            <span className="offer-original-price">De R$ {result.originalPrice}</span>
            <div className="offer-promotional-price">
              <span>por R$</span>
              <strong>{result.promotionalPrice}</strong>
            </div>
            <small>Pagamento único · acesso imediato após a confirmação</small>
          </>
        ) : (
          <>
            <span className="offer-regular-label">Preço normal</span>
            <div className="offer-locked-price">
              <span>R$</span>
              <strong>239,90</strong>
            </div>
            <small>Garanta valor promocional com cupom.</small>
          </>
        )}
      </div>

      {!result ? (
        <form className="offer-coupon-form" onSubmit={onSubmit}>
          <label htmlFor={id}>Cupom de desconto</label>
          <div>
            <span>
              <Tag aria-hidden="true" />
              <input
                id={id}
                value={coupon}
                onChange={(event) => setCoupon(event.target.value)}
                placeholder="DIGITE SEU CUPOM"
                autoComplete="off"
                spellCheck="false"
                required
              />
            </span>
            <button type="submit" disabled={loading}>
              {loading ? "VALIDANDO..." : "APLICAR CUPOM"}
            </button>
          </div>
          {error ? (
            <p className="offer-coupon-error" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      ) : (
        <a className="offer-buy-button" href={result.checkoutUrl}>
          QUERO O NEXUM POR R$ {result.promotionalPrice}
          <ArrowRight aria-hidden="true" />
        </a>
      )}

      <div className="offer-payment-trust">
        <span>
          <ShieldCheck aria-hidden="true" /> Compra segura
        </span>
        <span>
          <CreditCard aria-hidden="true" /> Pagamento pela Hotmart
        </span>
      </div>
    </div>
  );
}

function NexumOfferPage() {
  const [coupon, setCoupon] = useState("");
  const [couponResult, setCouponResult] = useState<CouponResult>(null);
  const [couponError, setCouponError] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);

  async function applyCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setCouponError("");

    try {
      const result = await validateOfferCoupon({ data: { coupon } });
      if (!result.ok) {
        setCouponResult(null);
        setCouponError(result.message);
        return;
      }

      setCouponResult(result);
    } catch {
      setCouponError("Não foi possível validar o cupom agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="offer-page">
      <header className="offer-header">
        <div className="offer-container offer-header-inner">
          <a href="/" className="offer-brand" aria-label="NEXUM — página inicial">
            <img src="/nexum-logo-brand.png" alt="NEXUM — Indicador de Fluxo" />
          </a>
          <span>
            <ShieldCheck aria-hidden="true" /> Ambiente seguro
          </span>
        </div>
      </header>

      <main>
        <section className="offer-hero" aria-labelledby="offer-title">
          <div className="offer-container offer-hero-grid">
            <div className="offer-hero-copy">
              <p className="offer-eyebrow">
                <Sparkles aria-hidden="true" /> Oferta especial NEXUM
              </p>
              <h1 id="offer-title">Entenda o contexto antes de entrar.</h1>
              <p className="offer-hero-lead">
                O NEXUM mostra, direto no gráfico, onde existe pressão compradora, pressão vendedora
                e força de tendência.
                <span>
                  Uma leitura simples para ajudar você a decidir{" "}
                  <strong>onde entrar, onde sair e quando não operar.</strong>
                </span>
              </p>

              <div className="offer-benefit-line" aria-label="O que está incluído">
                <span>
                  <Check aria-hidden="true" /> Indicador NEXUM
                </span>
                <span>
                  <Check aria-hidden="true" /> Treinamento de instalação
                </span>
              </div>

              <CheckoutCard
                id="hero-coupon"
                coupon={coupon}
                setCoupon={setCoupon}
                result={couponResult}
                error={couponError}
                loading={loading}
                onSubmit={applyCoupon}
              />
            </div>

            <div className="offer-hero-media">
              <div className="offer-video-shell">
                {videoStarted ? (
                  <iframe
                    src="https://player.vimeo.com/video/1218385882?autoplay=1&color=8a2cff&title=0&portrait=0&byline=0"
                    title="Demonstração do indicador NEXUM"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                    allowFullScreen
                  />
                ) : (
                  <button
                    type="button"
                    className="offer-video-cover"
                    onClick={() => setVideoStarted(true)}
                    aria-label="Assistir demonstração do NEXUM"
                  >
                    <img
                      src="/nexum-video-poster-v4.png"
                      alt="Demonstração do NEXUM em um gráfico do mini índice"
                    />
                    <span>
                      <Play aria-hidden="true" />
                    </span>
                  </button>
                )}
              </div>
              <div className="offer-media-caption">
                <div>
                  <BadgeCheck aria-hidden="true" />
                  <span>
                    <strong>Aplicação prática</strong>
                    Veja o indicador funcionando no gráfico
                  </span>
                </div>
                <div>
                  <Gauge aria-hidden="true" />
                  <span>
                    <strong>Leitura objetiva</strong>
                    Critérios visuais para a tomada de decisão
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
