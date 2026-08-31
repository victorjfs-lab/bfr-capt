import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  CheckCircle2,
  Clipboard,
  Clock3,
  Link2,
  LockKeyhole,
  RefreshCw,
  Send,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import {
  approveCourseRegistration,
  generateCourseInvite,
  getCourseRegistrations,
} from "../lib/course.functions";
import type { CourseRegistrationRecord } from "../lib/course.schema";

export const Route = createFileRoute("/validacao")({
  component: ValidationPage,
  head: () => ({
    meta: [
      { title: "Liberação de acessos | NEXUM" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const statusLabels = {
  invited: "Link enviado",
  pending: "Aguardando liberação",
  approved: "Acesso liberado",
} as const;

function ValidationPage() {
  const [password, setPassword] = useState("");
  const [registrations, setRegistrations] = useState<CourseRegistrationRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const pendingCount = useMemo(
    () => registrations?.filter((item) => item.status === "pending").length ?? 0,
    [registrations],
  );

  function invitationLink(token: string) {
    return `${window.location.origin}/inscricao?convite=${token}`;
  }

  async function loadRegistrations(accessPassword: string) {
    setLoading(true);
    setError("");
    try {
      const result = await getCourseRegistrations({ data: { password: accessPassword } });
      setRegistrations(result);
    } catch {
      setError("Senha incorreta ou acesso ainda não configurado.");
      setRegistrations(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadRegistrations(password);
  }

  async function handleGenerateLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");

    setLoading(true);
    setError("");
    setSuccess("");
    setGeneratedLink("");
    setCopied(false);

    try {
      const result = await generateCourseInvite({ data: { password, email } });
      if (!result.ok) {
        setError(result.message);
        return;
      }

      setGeneratedLink(invitationLink(result.token));
      setSuccess(`Link protegido de ${result.name} pronto para envio.`);
      await loadRegistrations(password);
    } catch {
      setError("Não foi possível gerar o link protegido.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function approve(registration: CourseRegistrationRecord) {
    setActionId(registration.id);
    setError("");
    setSuccess("");

    try {
      const result = await approveCourseRegistration({
        data: { password, registrationId: registration.id },
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setSuccess(`Acesso de ${result.name} liberado com sucesso.`);
      await loadRegistrations(password);
    } catch {
      setError("Não foi possível liberar este acesso.");
    } finally {
      setActionId(null);
    }
  }

  if (!registrations) {
    return (
      <main className="admin-page validation-login-page">
        <section className="admin-login" aria-labelledby="validation-login-title">
          <Link to="/" className="admin-brand">
            <img src="/nexum-logo-brand.png" alt="NEXUM — Indicador de Fluxo" />
          </Link>
          <div className="admin-lock" aria-hidden="true">
            <LockKeyhole />
          </div>
          <p className="admin-eyebrow">Área protegida</p>
          <h1 id="validation-login-title">Liberação de acessos</h1>
          <p className="admin-login-copy">
            Entre com a senha da equipe para gerar convites e liberar alunos.
          </p>
          <form className="admin-login-form" onSubmit={handleLogin}>
            <label>
              <span>Senha de acesso</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Senha da equipe"
                required
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? "ENTRANDO..." : "ACESSAR VALIDAÇÕES"}
            </button>
            {error ? <p className="admin-error">{error}</p> : null}
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page validation-dashboard">
      <div className="validation-container">
        <header className="validation-header">
          <div>
            <Link to="/" className="admin-brand">
              <img src="/nexum-logo-brand.png" alt="NEXUM — Indicador de Fluxo" />
            </Link>
            <p className="admin-eyebrow">Operação simplificada</p>
            <h1>Liberação de acessos</h1>
          </div>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => loadRegistrations(password)}
            disabled={loading}
          >
            <RefreshCw aria-hidden="true" /> Atualizar
          </button>
        </header>

        <section className="validation-summary" aria-label="Resumo das validações">
          <div>
            <Clock3 aria-hidden="true" />
            <span>Aguardando liberação</span>
            <strong>{pendingCount}</strong>
          </div>
          <div>
            <UserCheck aria-hidden="true" />
            <span>Total de convites</span>
            <strong>{registrations.length}</strong>
          </div>
        </section>

        <section className="validation-generator" aria-labelledby="invite-title">
          <div className="validation-section-copy">
            <span className="admin-eyebrow">Passo 1</span>
            <h2 id="invite-title">Gerar link protegido</h2>
            <p>Informe somente o e-mail usado pelo cliente na página inicial.</p>
          </div>
          <form onSubmit={handleGenerateLink}>
            <label>
              <span>E-mail do cliente</span>
              <input name="email" type="email" placeholder="cliente@email.com" required />
            </label>
            <button type="submit" disabled={loading}>
              <Link2 aria-hidden="true" /> GERAR LINK
            </button>
          </form>

          {generatedLink ? (
            <div className="validation-link-result">
              <div>
                <CheckCircle2 aria-hidden="true" />
                <span>{success}</span>
              </div>
              <code>{generatedLink}</code>
              <button type="button" onClick={() => copyLink(generatedLink)}>
                {copied ? <Check aria-hidden="true" /> : <Clipboard aria-hidden="true" />}
                {copied ? "COPIADO" : "COPIAR LINK"}
              </button>
            </div>
          ) : null}

          {error ? (
            <p className="validation-message is-error" role="alert">
              {error}
            </p>
          ) : null}
          {success && !generatedLink ? (
            <p className="validation-message is-success">{success}</p>
          ) : null}
        </section>

        <section className="validation-list" aria-labelledby="validation-list-title">
          <div className="validation-section-copy">
            <span className="admin-eyebrow">Passo 2</span>
            <h2 id="validation-list-title">Liberar acessos</h2>
            <p>Quando o cliente concluir o cadastro, basta clicar em liberar.</p>
          </div>

          <div className="validation-rows">
            {registrations.map((registration) => (
              <article className="validation-row" key={registration.id}>
                <span className={`validation-status is-${registration.status}`}>
                  {statusLabels[registration.status]}
                </span>
                <div className="validation-person">
                  <strong>{registration.name}</strong>
                  <span>{registration.email}</span>
                </div>
                <div className="validation-row-actions">
                  <button
                    type="button"
                    className="validation-copy-button"
                    onClick={() => copyLink(invitationLink(registration.inviteToken))}
                  >
                    <Send aria-hidden="true" /> Copiar link
                  </button>
                  {registration.status === "pending" ? (
                    <button
                      type="button"
                      className="validation-approve-button"
                      onClick={() => approve(registration)}
                      disabled={actionId === registration.id}
                    >
                      <ShieldCheck aria-hidden="true" />
                      {actionId === registration.id ? "LIBERANDO..." : "LIBERAR ACESSO"}
                    </button>
                  ) : null}
                  {registration.status === "approved" ? (
                    <span className="validation-approved-label">
                      <CheckCircle2 aria-hidden="true" /> Liberado
                    </span>
                  ) : null}
                </div>
              </article>
            ))}

            {registrations.length === 0 ? (
              <div className="validation-empty">
                <Link2 aria-hidden="true" />
                <p>Nenhum convite gerado ainda.</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
