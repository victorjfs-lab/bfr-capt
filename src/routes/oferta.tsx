import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  CheckCircle2,
  CreditCard,
  Gauge,
  GraduationCap,
  LockKeyhole,
  MessageCircle,
  Play,
  ShieldCheck,
  Sparkles,
  Tag,
  TrendingUp,
  Users,
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
          <span>{result ? "Cupom aplicado" : "Oferta protegida"}</span>
          <strong>
            {result ? "Seu preço especial foi liberado" : "Use seu cupom para liberar"}
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
            <span className="offer-regular-label">Preço sem cupom</span>
            <div className="offer-locked-price">
              <span>R$</span>
              <strong>189,90</strong>
            </div>
            <small>O valor promocional só aparece após validar o cupom.</small>
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
                placeholder="Digite seu cupom"
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
              <h1 id="offer-title">
                Veja o movimento antes que ele aconteça.
                <span>Decida com contexto, não com impulso.</span>
              </h1>
              <p className="offer-hero-lead">
                O NEXUM transforma pressão compradora, pressão vendedora e contexto de tendência em
                uma leitura visual clara para você reconhecer melhores regiões de entrada e saída.
              </p>

              <div className="offer-benefit-line" aria-label="O que está incluído">
                <span>
                  <Check aria-hidden="true" /> Pacote com 3 indicadores
                </span>
                <span>
                  <Check aria-hidden="true" /> Treinamento de instalação
                </span>
                <span>
                  <Check aria-hidden="true" /> Grupo de estudos
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

        <section className="offer-included" aria-labelledby="included-title">
          <div className="offer-container">
            <div className="offer-section-heading">
              <p className="offer-eyebrow">Tudo o que você recebe</p>
              <h2 id="included-title">Uma estrutura completa para começar.</h2>
              <p>Ferramentas, contexto e orientação reunidos em um único acesso.</p>
            </div>

            <div className="offer-included-grid">
              <article>
                <span>
                  <BarChart3 aria-hidden="true" />
                </span>
                <strong>3 indicadores NEXUM</strong>
                <p>O pacote completo para pressão, contexto e confirmação visual no gráfico.</p>
              </article>
              <article>
                <span>
                  <GraduationCap aria-hidden="true" />
                </span>
                <strong>Treinamento prático</strong>
                <p>Aulas para instalar, configurar e entender como aplicar cada ferramenta.</p>
              </article>
              <article>
                <span>
                  <Users aria-hidden="true" />
                </span>
                <strong>Grupo de estudos</strong>
                <p>Um espaço para acompanhar orientações, dúvidas e evolução operacional.</p>
              </article>
              <article>
                <span>
                  <TrendingUp aria-hidden="true" />
                </span>
                <strong>Contexto antes da entrada</strong>
                <p>Mais clareza para saber quando entrar, quando sair e quando ficar de fora.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="offer-proof" aria-labelledby="proof-title">
          <div className="offer-container">
            <div className="offer-section-heading is-centered">
              <p className="offer-eyebrow">Simples e eficiente</p>
              <h2 id="proof-title">O gráfico mostra o preço. O NEXUM mostra o contexto.</h2>
            </div>
            <div className="offer-proof-grid">
              {[
                {
                  src: "/nexum-exemplo-1.png",
                  alt: "NEXUM identificando continuidade compradora",
                  label: "Continuidade",
                },
                {
                  src: "/nexum-exemplo-2.png",
                  alt: "NEXUM sinalizando entrada e desenvolvimento do movimento",
                  label: "Confirmação",
                },
                {
                  src: "/nexum-exemplo-3.png",
                  alt: "NEXUM exibindo contexto vendedor e reversão",
                  label: "Mudança de contexto",
                },
              ].map((image) => (
                <figure key={image.src}>
                  <img src={image.src} alt={image.alt} loading="lazy" />
                  <figcaption>{image.label}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="offer-steps" aria-labelledby="steps-title">
          <div className="offer-container offer-steps-grid">
            <div className="offer-section-heading">
              <p className="offer-eyebrow">Do acesso à aplicação</p>
              <h2 id="steps-title">Você não recebe apenas um arquivo.</h2>
              <p>
                O caminho foi organizado para que você instale as ferramentas e comece a entender a
                leitura sem depender de tentativa e erro.
              </p>
            </div>
            <ol>
              <li>
                <span>01</span>
                <div>
                  <strong>Confirme sua compra</strong>
                  <p>Finalize o pagamento com segurança pela Hotmart.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Instale os indicadores</strong>
                  <p>Siga o treinamento para configurar corretamente o pacote.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Leve contexto para o gráfico</strong>
                  <p>Use a leitura visual como apoio aos seus próprios critérios operacionais.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className="offer-final" aria-labelledby="final-title">
          <div className="offer-container offer-final-grid">
            <div>
              <p className="offer-eyebrow">
                <MessageCircle aria-hidden="true" /> Seu cupom está em mãos
              </p>
              <h2 id="final-title">Ative a condição especial e comece com o NEXUM.</h2>
              <p>Digite o mesmo cupom para revelar o preço reservado desta oferta.</p>
            </div>
            <CheckoutCard
              id="final-coupon"
              coupon={coupon}
              setCoupon={setCoupon}
              result={couponResult}
              error={couponError}
              loading={loading}
              onSubmit={applyCoupon}
            />
          </div>
        </section>
      </main>

      <footer className="offer-footer">
        <div className="offer-container">
          <img src="/nexum-logo-brand.png" alt="NEXUM — Indicador de Fluxo" />
          <p>
            O NEXUM é uma ferramenta educacional de apoio à leitura de mercado. Não oferecemos
            recomendação de investimento ou promessa de rentabilidade. Operações no mercado
            financeiro envolvem riscos.
          </p>
          <span>© 2026 Garcia Consultoria Financeira e Treinamentos LTDA</span>
        </div>
      </footer>
    </div>
  );
}
