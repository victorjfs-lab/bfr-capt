import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-background/90 backdrop-blur-md shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-xl font-extrabold text-primary-foreground font-[family-name:var(--font-display)]">
              B
            </div>
            <span className="text-lg font-bold tracking-tight font-[family-name:var(--font-display)] text-foreground">
              BFR Investimentos
            </span>
          </div>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSfCBEBTEwAuPjCNSmVP1RPRag18ZM4_9Edh06aoEMulsxTdww/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow transition-all hover:bg-accent/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Quero conversar
          </a>
        </div>
      </header>

      {/* Hero */}
      <section
        ref={heroRef}
        className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden"
      >
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#064e3b] via-[#0a3d2e] to-[#0d7a5f]" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,#c9a84c,transparent_50%)]" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_bottom_left,#f5f0e0,transparent_50%)]" />

        {/* Decorative shapes */}
        <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-[#f5f0e0]/80 backdrop-blur-sm mb-8">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            Sua história financeira importa para mim
          </div>

          <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-[#f5f0e0] sm:text-6xl md:text-7xl font-[family-name:var(--font-display)]">
            O que você quer
            <br />
            <span className="text-accent">conquistar</span> com seu
            <br />
            dinheiro?
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#f5f0e0]/70 sm:text-xl font-[family-name:var(--font-sans)]">
            Não existem fórmulas mágicas. Mas existe uma maneira certa de construir o que você sonha
            — e eu quero te ajudar nessa jornada, passo a passo, com estratégia e sem promessas
            vazias.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="#video"
              className="inline-flex items-center justify-center rounded-xl bg-accent px-8 py-4 text-base font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:bg-accent/90 hover:shadow-xl hover:-translate-y-0.5"
            >
              Assistir ao vídeo
              <svg
                className="ml-2 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </a>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfCBEBTEwAuPjCNSmVP1RPRag18ZM4_9Edh06aoEMulsxTdww/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-[#f5f0e0] backdrop-blur-sm transition-all hover:bg-white/10 hover:-translate-y-0.5"
            >
              Responder pesquisa
            </a>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Stats */}
      <section className="relative z-10 -mt-16 mx-auto w-full max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border shadow-xl sm:grid-cols-4">
          {[
            { value: "+10mil", label: "Clientes ativos" },
            { value: "19+", label: "Especialistas no time" },
            { value: "20+", label: "Anos de experiência combinada" },
            { value: "CVM", label: "Regulada e credenciada XP" },
          ].map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center bg-card px-4 py-8 text-center"
            >
              <span className="text-3xl font-extrabold text-primary font-[family-name:var(--font-display)]">
                {stat.value}
              </span>
              <span className="mt-1 text-sm font-medium text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Video Section */}
      <section id="video" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-[family-name:var(--font-display)]">
              Assista ao meu convite
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Em poucos minutos, vou te mostrar como a gente pode construir juntos o caminho que
              leva aos seus objetivos — de verdade.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="aspect-video w-full">
              <iframe
                className="h-full w-full"
                src="https://www.veed.io/embed/8ac3c42b-db2b-462a-a781-9937cc54ac8c?watermark=0&color=&sharing=0&title=0"
                title="Convite BFR"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-[#064e3b] via-[#0a3d2e] to-[#0d7a5f]" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,#c9a84c,transparent_50%)]" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#f5f0e0] sm:text-4xl md:text-5xl font-[family-name:var(--font-display)]">
            Vamos conversar?
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[#f5f0e0]/70">
            Quero entender o que você busca — e se eu puder te ajudar, vou mostrar como. Sem
            pressão, sem promessas. Só um papo honesto sobre o seu futuro financeiro.
          </p>

          <div className="mt-10">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfCBEBTEwAuPjCNSmVP1RPRag18ZM4_9Edh06aoEMulsxTdww/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-accent px-10 py-5 text-lg font-bold text-accent-foreground shadow-xl shadow-accent/20 transition-all hover:bg-accent/90 hover:shadow-2xl hover:-translate-y-1"
            >
              Responder pesquisa
              <svg
                className="ml-3 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>

          <p className="mt-4 text-sm text-[#f5f0e0]/50">
            Leva menos de 3 minutos. Totalmente gratuito.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-extrabold text-primary-foreground font-[family-name:var(--font-display)]">
              B
            </div>
            <span className="text-sm font-semibold text-foreground font-[family-name:var(--font-display)]">
              BFR Investimentos
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} BFR Investimentos. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
