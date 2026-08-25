import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Check, Gem, ListChecks } from "lucide-react";
import { FormEvent, useState } from "react";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const [videoStarted, setVideoStarted] = useState(false);

  function handleLeadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const message = [
      "Olá! Quero ativar meus 30 dias grátis no NEXUM.",
      "",
      `Nome: ${data.get("name")}`,
      `WhatsApp: ${data.get("whatsapp")}`,
      `E-mail: ${data.get("email")}`,
    ].join("\n");

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="reference-page">
      <main>
        <section className="reference-hero" aria-labelledby="main-title">
          <div className="reference-container reference-hero-inner">
            <a className="reference-brand" href="#inicio" aria-label="NEXUM — início">
              <img src="/nexum-logo-brand.png" alt="NEXUM — Indicador de Fluxo" />
            </a>

            <div id="inicio" className="reference-grid">
              <div className="reference-copy">
                <h1 id="main-title" className="reference-title">
                  Entradas perfeitas começam antes do clique.
                  <span>O poder de 2 indicadores na consistência definitiva</span>
                </h1>

                <div className="reference-lead">
                  <p>
                    O <strong>NEXUM</strong> é o indicador que te mostra com exatidão as regiões
                    perfeitas para entradas e saídas no mercado.
                  </p>
                </div>

                <form className="lead-form" onSubmit={handleLeadSubmit}>
                  <label className="lead-field">
                    <span>Nome</span>
                    <input
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Seu nome"
                      required
                    />
                  </label>

                  <label className="lead-field">
                    <span>WhatsApp</span>
                    <input
                      name="whatsapp"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </label>

                  <label className="lead-field lead-field-email">
                    <span>E-mail</span>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="voce@email.com"
                      required
                    />
                  </label>

                  <button className="reference-button" type="submit">
                    ATIVAR MEUS 30 DIAS GRÁTIS
                    <ArrowRight aria-hidden="true" />
                  </button>
                </form>

                <div className="reference-proof" aria-label="Benefícios da ativação">
                  <span>
                    <Check aria-hidden="true" /> 30 dias de acesso gratuito
                  </span>
                  <span>
                    <Check aria-hidden="true" /> Ativação acompanhada
                  </span>
                  <span>
                    <Check aria-hidden="true" /> Aulas e suporte incluídos
                  </span>
                </div>

                <p className="reference-legal">
                  Benefício disponibilizado através de uma ação em parceria com a BFR. Consulte as
                  condições de ativação.
                </p>
              </div>

              <div className="reference-media">
                <div className="reference-video">
                  {videoStarted ? (
                    <iframe
                      src="https://player.vimeo.com/video/1218385882?autoplay=1&color=8a2cff&title=0&portrait=0&byline=0"
                      title="Demonstração do indicador NEXUM"
                      allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                      allowFullScreen
                    />
                  ) : (
                    <button
                      className="reference-poster"
                      type="button"
                      aria-label="Reproduzir demonstração do NEXUM"
                      onClick={() => setVideoStarted(true)}
                    >
                      <img
                        src="/nexum-video-poster-v4.png"
                        alt="Apresentador ao lado do gráfico NEXUM — Veja a pressão antes do movimento"
                      />
                    </button>
                  )}
                </div>

                <div className="video-features" aria-label="Diferenciais do NEXUM">
                  <div className="video-feature">
                    <BarChart3 aria-hidden="true" />
                    <span>Operacional completo</span>
                  </div>
                  <div className="video-feature">
                    <Gem aria-hidden="true" />
                    <span>B3, cripto e Forex</span>
                  </div>
                  <div className="video-feature">
                    <ListChecks aria-hidden="true" />
                    <span>Critério de entrada</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="showcase-section" aria-labelledby="showcase-title">
          <div className="reference-container">
            <h2 id="showcase-title" className="showcase-title">
              Simples e eficiente
            </h2>

            <div className="showcase-grid">
              <figure className="showcase-card">
                <img
                  src="/nexum-exemplo-1.png"
                  alt="NEXUM identificando uma região de continuidade compradora"
                  loading="lazy"
                />
              </figure>
              <figure className="showcase-card">
                <img
                  src="/nexum-exemplo-2.png"
                  alt="NEXUM sinalizando uma entrada e o desenvolvimento do movimento"
                  loading="lazy"
                />
              </figure>
              <figure className="showcase-card">
                <img
                  src="/nexum-exemplo-3.png"
                  alt="NEXUM mostrando contexto vendedor e possível reversão"
                  loading="lazy"
                />
              </figure>
              <figure className="showcase-card">
                <img
                  src="/nexum-exemplo-4.png"
                  alt="NEXUM destacando uma região de entrada compradora"
                  loading="lazy"
                />
              </figure>
            </div>
          </div>
        </section>

        <footer className="legal-footer">
          <div className="reference-container legal-footer-inner">
            <div className="legal-company">
              <strong>© 2026 Garcia Consultoria Financeira e Treinamentos LTDA</strong>
              <span>CNPJ: 39.484.899/0001-09</span>
            </div>

            <div className="legal-warning">
              <p className="legal-warning-title">Aviso importante:</p>
              <p>
                O Sistema Trader é um treinamento educacional. Não prestamos recomendações de
                investimento, consultoria ou promessa de rentabilidade. O mercado financeiro envolve
                riscos e resultados passados não garantem resultados futuros.
              </p>
            </div>

            <nav className="legal-links" aria-label="Links legais">
              <a href="#politica-de-privacidade">Política de Privacidade</a>
              <a href="#termos-de-uso">Termos de Uso</a>
              <a href="#contato">Contato</a>
            </nav>
          </div>
        </footer>
      </main>
    </div>
  );
}
