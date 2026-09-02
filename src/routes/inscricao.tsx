import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { getCourseInvitation, registerProtectedCourseUser } from "../lib/course.functions";
import type { CoursePublicInvitation } from "../lib/course.schema";

export const Route = createFileRoute("/inscricao")({
  component: CourseRegistrationPage,
  validateSearch: (search: Record<string, unknown>) => ({
    convite: typeof search.convite === "string" ? search.convite : "",
  }),
  head: () => ({
    meta: [
      { title: "Inscrição protegida | NEXUM" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type RegistrationState = "loading" | "form" | "pending" | "approved" | "invalid";

function CourseRegistrationPage() {
  const { convite } = Route.useSearch();
  const [invitation, setInvitation] = useState<CoursePublicInvitation | null>(null);
  const [state, setState] = useState<RegistrationState>("loading");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadInvitation() {
      if (!/^[a-f0-9]{64}$/i.test(convite)) {
        setState("invalid");
        return;
      }

      try {
        const result = await getCourseInvitation({ data: { token: convite } });
        if (!active) return;

        if (!result) {
          setState("invalid");
          return;
        }

        setInvitation(result);
        setState(
          result.status === "approved"
            ? "approved"
            : result.status === "pending"
              ? "pending"
              : "form",
        );
      } catch {
        if (active) setState("invalid");
      }
    }

    void loadInvitation();
    return () => {
      active = false;
    };
  }, [convite]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");

    setSubmitting(true);
    setError("");

    try {
      const result = await registerProtectedCourseUser({
        data: { token: convite, name, email },
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setInvitation((current) => (current ? { ...current, name, status: result.status } : current));
      setState(result.status === "approved" ? "approved" : "pending");
    } catch {
      setError("Não foi possível confirmar seu cadastro. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="enrollment-page">
      <section className="enrollment-card" aria-labelledby="enrollment-title">
        <Link to="/" className="enrollment-brand" aria-label="NEXUM — página inicial">
          <img src="/nexum-logo-brand.png" alt="NEXUM — Indicador de Fluxo" />
        </Link>

        {state === "loading" ? (
          <div className="enrollment-feedback">
            <span className="enrollment-spinner" aria-hidden="true" />
            <h1 id="enrollment-title">Validando seu convite...</h1>
            <p>Aguarde só um instante.</p>
          </div>
        ) : null}

        {state === "invalid" ? (
          <div className="enrollment-feedback is-error">
            <LockKeyhole aria-hidden="true" />
            <p className="enrollment-eyebrow">Link protegido</p>
            <h1 id="enrollment-title">Convite não encontrado</h1>
            <p>Usuário não encontrado, confirmar E-mail.</p>
          </div>
        ) : null}

        {state === "form" && invitation ? (
          <>
            <div className="enrollment-heading">
              <span className="enrollment-security">
                <ShieldCheck aria-hidden="true" /> Link individual protegido
              </span>
              <h1 id="enrollment-title">Confirme sua inscrição no mini curso.</h1>
              <p>
                Use o mesmo e-mail informado no primeiro cadastro para que o sistema reconheça seu
                acesso.
              </p>
            </div>

            <form className="enrollment-form" onSubmit={handleSubmit}>
              <label>
                <span>Nome completo</span>
                <input
                  name="name"
                  type="text"
                  defaultValue={invitation.name}
                  autoComplete="name"
                  required
                />
              </label>
              <label>
                <span>E-mail usado no primeiro cadastro</span>
                <input
                  name="email"
                  type="email"
                  placeholder="voce@email.com"
                  autoComplete="email"
                  required
                />
              </label>
              <button type="submit" disabled={submitting}>
                {submitting ? "CONFIRMANDO..." : "CONFIRMAR MINHA INSCRIÇÃO"}
                <ArrowRight aria-hidden="true" />
              </button>
              {error ? (
                <p className="enrollment-error" role="alert">
                  {error}
                </p>
              ) : null}
            </form>
          </>
        ) : null}

        {state === "pending" ? (
          <div className="enrollment-feedback is-success">
            <CheckCircle2 aria-hidden="true" />
            <p className="enrollment-eyebrow">Cadastro confirmado</p>
            <h1 id="enrollment-title">Tudo certo, {invitation?.name?.split(" ")[0]}.</h1>
            <p>
              Seus dados foram reconhecidos. A liberação será concluída automaticamente ao acessar o
              treinamento.
            </p>
            <a href={`/curso?convite=${convite}`}>ACESSAR O MINI CURSO</a>
          </div>
        ) : null}

        {state === "approved" ? (
          <div className="enrollment-feedback is-success">
            <CheckCircle2 aria-hidden="true" />
            <p className="enrollment-eyebrow">Acesso liberado</p>
            <h1 id="enrollment-title">Seu treinamento está disponível.</h1>
            <p>
              E-mail reconhecido. Seus 25 dias de acesso começam agora e o treinamento já está
              disponível.
            </p>
            <a href={`/curso?convite=${convite}`}>
              ACESSAR O MINI CURSO <ArrowRight aria-hidden="true" />
            </a>
          </div>
        ) : null}
      </section>
    </main>
  );
}
