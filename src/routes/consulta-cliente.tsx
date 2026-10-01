import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, CalendarDays, Clock3, LockKeyhole, Search, ShieldCheck } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { getClientLookupAccess, lookupClientAcrossSites } from "../lib/client-lookup.functions";
import type { ClientLookupResult } from "../lib/client-lookup.schema";

export const Route = createFileRoute("/consulta-cliente")({
  component: ClientLookupPage,
  head: () => ({
    meta: [
      { title: "Consulta de cliente | NEXUM" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const entryDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatEntryDate(value: string) {
  return entryDateFormatter.format(new Date(value));
}

function ClientLookupPage() {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ClientLookupResult | null>(null);

  useEffect(() => {
    let active = true;

    getClientLookupAccess({ data: { password: "" } })
      .then(() => {
        if (active) setAuthorized(true);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await getClientLookupAccess({ data: { password } });
      setAuthorized(true);
    } catch {
      setError("Senha incorreta ou acesso ainda não configurado.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const lookupResult = await lookupClientAcrossSites({ data: { password, email } });
      setResult(lookupResult);
    } catch {
      setError("Não foi possível consultar este e-mail agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="admin-page client-lookup-login-page">
        <section className="admin-login admin-session-check" aria-live="polite">
          <Link to="/" className="admin-brand">
            <img src="/nexum-logo-brand.png" alt="NEXUM — Indicador de Fluxo" />
          </Link>
          <div className="admin-lock" aria-hidden="true">
            <LockKeyhole />
          </div>
          <p className="admin-eyebrow">Acesso principal</p>
          <h1>Reconhecendo seu acesso</h1>
          <p className="admin-login-copy">Verificando a sessão segura deste navegador...</p>
        </section>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="admin-page client-lookup-login-page">
        <section className="admin-login" aria-labelledby="lookup-login-title">
          <Link to="/" className="admin-brand">
            <img src="/nexum-logo-brand.png" alt="NEXUM — Indicador de Fluxo" />
          </Link>
          <div className="admin-lock" aria-hidden="true">
            <LockKeyhole />
          </div>
          <p className="admin-eyebrow">Área protegida</p>
          <h1 id="lookup-login-title">Consulta de cliente</h1>
          <p className="admin-login-copy">
            Entre com a senha principal para consultar os cadastros BFR e FOREX.
          </p>
          <form className="admin-login-form" onSubmit={handleLogin}>
            <label>
              <span>Senha principal</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Sua senha"
                required
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? "ENTRANDO..." : "ACESSAR CONSULTA"}
            </button>
            {error ? (
              <p className="admin-error" role="alert">
                {error}
              </p>
            ) : null}
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page client-lookup-page">
      <div className="client-lookup-container">
        <header className="client-lookup-header">
          <div>
            <Link to="/" className="admin-brand">
              <img src="/nexum-logo-brand.png" alt="NEXUM — Indicador de Fluxo" />
            </Link>
            <p className="admin-eyebrow">Consulta integrada</p>
            <h1>Tempo de cliente</h1>
            <p>Pesquise uma vez e confira os cadastros validados nos dois sistemas.</p>
          </div>
          <Link to="/admin" className="admin-secondary-button client-lookup-admin-link">
            <ShieldCheck aria-hidden="true" /> Voltar ao dashboard
          </Link>
        </header>

        <section className="client-lookup-search" aria-labelledby="lookup-title">
          <div>
            <span className="admin-eyebrow">Busca por e-mail</span>
            <h2 id="lookup-title">Localizar cliente</h2>
            <p>Digite o mesmo e-mail usado na validação do acesso.</p>
          </div>
          <form onSubmit={handleLookup}>
            <label>
              <span>E-mail do cliente</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="cliente@email.com"
                autoComplete="email"
                required
              />
            </label>
            <button type="submit" disabled={loading}>
              <Search aria-hidden="true" /> {loading ? "CONSULTANDO..." : "CONSULTAR"}
            </button>
          </form>
          {error ? (
            <p className="client-lookup-message is-error" role="alert">
              <AlertCircle aria-hidden="true" /> {error}
            </p>
          ) : null}
        </section>

        {result ? (
          <section className="client-lookup-results" aria-live="polite">
            <div className="client-lookup-result-heading">
              <div>
                <span className="admin-eyebrow">Resultado</span>
                <h2>{result.email}</h2>
              </div>
              <span>{result.clients.length} cadastro(s) validado(s)</span>
            </div>

            {!result.forexAvailable ? (
              <p className="client-lookup-message is-warning">
                <AlertCircle aria-hidden="true" /> O site FOREX não respondeu. O resultado BFR
                continua válido; tente novamente para completar a consulta.
              </p>
            ) : null}

            {result.clients.length > 0 ? (
              <div className="client-lookup-cards">
                {result.clients.map((client) => {
                  const overdue = client.daysWithSystem > 30;
                  return (
                    <article className="client-lookup-card" key={client.system}>
                      <div className="client-lookup-card-title">
                        <span>CLIENTE {client.system}</span>
                        <strong>{client.name}</strong>
                      </div>
                      <div className="client-lookup-detail">
                        <CalendarDays aria-hidden="true" />
                        <span>Data de entrada</span>
                        <strong>{formatEntryDate(client.approvedAt)}</strong>
                      </div>
                      <div
                        className={`client-lookup-days ${overdue ? "is-overdue" : "is-current"}`}
                      >
                        <Clock3 aria-hidden="true" />
                        <span>Dias com o sistema</span>
                        <strong>{client.daysWithSystem}</strong>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : result.forexAvailable ? (
              <div className="client-lookup-empty">
                <Search aria-hidden="true" />
                <h3>Cliente não encontrado</h3>
                <p>Este e-mail não possui validação aprovada no BFR nem no FOREX.</p>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
