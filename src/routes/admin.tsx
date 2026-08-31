import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  Link2,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import { approveAdminRegistration, getAdminOverview } from "../lib/dashboard.functions";
import type { CourseRegistrationRecord } from "../lib/course.schema";
import type { LeadRecord } from "../lib/leads.schema";

export const Route = createFileRoute("/admin")({
  component: AdminOverviewPage,
  head: () => ({
    meta: [
      { title: "Dashboard administrativo | NEXUM" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type DashboardData = {
  leads: LeadRecord[];
  registrations: CourseRegistrationRecord[];
};

type ActivityItem = {
  id: string;
  type: "lead" | "invite" | "registration" | "approval";
  title: string;
  description: string;
  date: string;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const dayFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(value: string | null, compact = false) {
  if (!value) return "—";
  return (compact ? dayFormatter : dateFormatter).format(new Date(value));
}

function daysUntil(value: string | null) {
  if (!value) return 0;
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000));
}

function percentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function csvCell(value: string | number) {
  let safeValue = String(value);
  if (/^[=+\-@]/.test(safeValue)) safeValue = `'${safeValue}`;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = `\uFEFFsep=;\n${rows.map((row) => row.map(csvCell).join(";")).join("\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function accessLabel(registration: CourseRegistrationRecord) {
  if (registration.status === "invited") return "Convite enviado";
  if (registration.status === "pending") return "Aguardando liberação";
  if (registration.accessExpired) return "Acesso expirado";
  return "Acesso ativo";
}

function accessClass(registration: CourseRegistrationRecord) {
  if (registration.status === "pending") return "is-pending";
  if (registration.status === "approved" && registration.accessExpired) return "is-expired";
  if (registration.status === "approved") return "is-active";
  return "is-invited";
}

function buildActivity(data: DashboardData): ActivityItem[] {
  const leadActivity = data.leads.map<ActivityItem>((lead) => ({
    id: `lead-${lead.id}`,
    type: "lead",
    title: "Novo lead recebido",
    description: `${lead.name} · ${lead.email}`,
    date: lead.createdAt,
  }));

  const courseActivity = data.registrations.flatMap<ActivityItem>((registration) => {
    const events: ActivityItem[] = [
      {
        id: `invite-${registration.id}`,
        type: "invite",
        title: "Link protegido gerado",
        description: `${registration.name} · ${registration.email}`,
        date: registration.createdAt,
      },
    ];

    if (registration.registeredAt) {
      events.push({
        id: `registration-${registration.id}`,
        type: "registration",
        title: "Cadastro do curso confirmado",
        description: `${registration.name} confirmou o mesmo e-mail da LP`,
        date: registration.registeredAt,
      });
    }

    if (registration.approvedAt) {
      events.push({
        id: `approval-${registration.id}`,
        type: "approval",
        title: "Acesso liberado por 25 dias",
        description: `${registration.name} · vence em ${formatDate(registration.expiresAt, true)}`,
        date: registration.approvedAt,
      });
    }

    return events;
  });

  return [...leadActivity, ...courseActivity]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 12);
}

function AdminOverviewPage() {
  const [password, setPassword] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const stats = useMemo(() => {
    if (!data) return null;

    const sevenDaysAgo = Date.now() - 7 * 86_400_000;
    const leadsLastSevenDays = data.leads.filter(
      (lead) => new Date(lead.createdAt).getTime() >= sevenDaysAgo,
    ).length;
    const pending = data.registrations.filter((item) => item.status === "pending").length;
    const registrations = data.registrations.filter((item) => item.registeredAt).length;
    const approved = data.registrations.filter((item) => item.status === "approved").length;
    const active = data.registrations.filter(
      (item) => item.status === "approved" && !item.accessExpired,
    ).length;
    const expired = data.registrations.filter((item) => item.accessExpired).length;
    const expiringSoon = data.registrations.filter(
      (item) => item.status === "approved" && !item.accessExpired && daysUntil(item.expiresAt) <= 3,
    ).length;

    return {
      leads: data.leads.length,
      leadsLastSevenDays,
      invites: data.registrations.length,
      registrations,
      pending,
      approved,
      active,
      expired,
      expiringSoon,
      leadToInvite: percentage(data.registrations.length, data.leads.length),
      inviteToRegistration: percentage(registrations, data.registrations.length),
      registrationToApproval: percentage(approved, registrations),
    };
  }, [data]);

  const activity = useMemo(() => (data ? buildActivity(data) : []), [data]);

  async function loadOverview(accessPassword: string) {
    setLoading(true);
    setError("");

    try {
      const overview = await getAdminOverview({ data: { password: accessPassword } });
      setData(overview);
    } catch {
      setError("Senha incorreta ou acesso administrativo ainda não configurado.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadOverview(password);
  }

  async function approve(registration: CourseRegistrationRecord) {
    setActionId(registration.id);
    setError("");
    setSuccess("");

    try {
      const result = await approveAdminRegistration({
        data: { password, registrationId: registration.id },
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setSuccess(`Acesso de ${result.name} liberado por 25 dias.`);
      await loadOverview(password);
    } catch {
      setError("Não foi possível liberar este acesso.");
    } finally {
      setActionId(null);
    }
  }

  function exportLeads() {
    if (!data) return;
    downloadCsv(`leads-nexum-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["ID", "Nome", "WhatsApp", "E-mail", "Entrada na LP"],
      ...data.leads.map((lead) => [
        lead.id,
        lead.name,
        lead.whatsapp,
        lead.email,
        formatDate(lead.createdAt),
      ]),
    ]);
  }

  function exportAccesses() {
    if (!data) return;
    downloadCsv(`acessos-nexum-${new Date().toISOString().slice(0, 10)}.csv`, [
      [
        "ID",
        "Nome",
        "E-mail",
        "Status",
        "Convite criado em",
        "Cadastro confirmado em",
        "Liberado em",
        "Vence em",
        "Dias restantes",
      ],
      ...data.registrations.map((registration) => [
        registration.id,
        registration.name,
        registration.email,
        accessLabel(registration),
        formatDate(registration.createdAt),
        formatDate(registration.registeredAt),
        formatDate(registration.approvedAt),
        formatDate(registration.expiresAt),
        registration.status === "approved" ? daysUntil(registration.expiresAt) : "—",
      ]),
    ]);
  }

  if (!data || !stats) {
    return (
      <main className="admin-page overview-login-page">
        <section className="admin-login" aria-labelledby="overview-login-title">
          <Link to="/" className="admin-brand">
            <img src="/nexum-logo-brand.png" alt="NEXUM — Indicador de Fluxo" />
          </Link>
          <div className="admin-lock" aria-hidden="true">
            <LockKeyhole />
          </div>
          <p className="admin-eyebrow">Central protegida</p>
          <h1 id="overview-login-title">Dashboard administrativo</h1>
          <p className="admin-login-copy">
            Acompanhe leads, cadastros, liberações e a validade de cada acesso.
          </p>
          <form className="admin-login-form" onSubmit={handleLogin}>
            <label>
              <span>Senha administrativa</span>
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
              {loading ? "CARREGANDO..." : "ACESSAR DASHBOARD"}
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

  const recentLeads = data.leads.slice(0, 6);
  const recentAccesses = data.registrations.slice(0, 8);

  return (
    <main className="admin-page overview-page">
      <div className="overview-container">
        <header className="overview-header">
          <div>
            <Link to="/" className="admin-brand">
              <img src="/nexum-logo-brand.png" alt="NEXUM — Indicador de Fluxo" />
            </Link>
            <p className="admin-eyebrow">Central de operação</p>
            <h1>Visão geral</h1>
            <p>Leads, inscrições e acessos do NEXUM em um só lugar.</p>
          </div>
          <div className="overview-header-actions">
            <Link to="/inscritos" className="overview-navigation-link">
              <Users aria-hidden="true" /> Leads <ExternalLink aria-hidden="true" />
            </Link>
            <Link to="/validacao" className="overview-navigation-link">
              <ShieldCheck aria-hidden="true" /> Validações <ExternalLink aria-hidden="true" />
            </Link>
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => loadOverview(password)}
              disabled={loading}
            >
              <RefreshCw aria-hidden="true" /> {loading ? "Atualizando" : "Atualizar"}
            </button>
          </div>
        </header>

        <section className="overview-rule" aria-label="Regra de validade dos acessos">
          <CalendarClock aria-hidden="true" />
          <div>
            <strong>25 dias de acesso</strong>
            <span>O prazo começa somente quando a equipe clica em “Liberar acesso”.</span>
          </div>
          {stats.expiringSoon > 0 ? (
            <span className="overview-rule-alert">
              {stats.expiringSoon} {stats.expiringSoon === 1 ? "acesso vence" : "acessos vencem"} em
              até 3 dias
            </span>
          ) : (
            <span className="overview-rule-ok">
              <CheckCircle2 aria-hidden="true" /> Validades em dia
            </span>
          )}
        </section>

        {error ? (
          <p className="overview-feedback is-error" role="alert">
            {error}
          </p>
        ) : null}
        {success ? <p className="overview-feedback is-success">{success}</p> : null}

        <section className="overview-kpis" aria-label="Indicadores principais">
          <article>
            <span className="overview-kpi-icon is-purple">
              <Users aria-hidden="true" />
            </span>
            <div>
              <span>Total de leads</span>
              <strong>{stats.leads}</strong>
              <small>+{stats.leadsLastSevenDays} nos últimos 7 dias</small>
            </div>
          </article>
          <article>
            <span className="overview-kpi-icon is-blue">
              <Link2 aria-hidden="true" />
            </span>
            <div>
              <span>Convites gerados</span>
              <strong>{stats.invites}</strong>
              <small>{stats.leadToInvite}% dos leads receberam link</small>
            </div>
          </article>
          <article>
            <span className="overview-kpi-icon is-amber">
              <Clock3 aria-hidden="true" />
            </span>
            <div>
              <span>Aguardando liberação</span>
              <strong>{stats.pending}</strong>
              <small>Cadastros prontos para revisar</small>
            </div>
          </article>
          <article>
            <span className="overview-kpi-icon is-green">
              <UserCheck aria-hidden="true" />
            </span>
            <div>
              <span>Acessos ativos</span>
              <strong>{stats.active}</strong>
              <small>{stats.approved} liberações no total</small>
            </div>
          </article>
          <article>
            <span className="overview-kpi-icon is-rose">
              <CalendarClock aria-hidden="true" />
            </span>
            <div>
              <span>Acessos expirados</span>
              <strong>{stats.expired}</strong>
              <small>Encerrados após os 25 dias</small>
            </div>
          </article>
        </section>

        <section className="overview-main-grid">
          <article className="overview-panel overview-funnel">
            <div className="overview-panel-heading">
              <div>
                <span className="admin-eyebrow">Conversão</span>
                <h2>Jornada do cliente</h2>
              </div>
              <TrendingUp aria-hidden="true" />
            </div>
            <div className="overview-funnel-steps">
              {[
                { label: "Entradas na LP", value: stats.leads, conversion: 100 },
                {
                  label: "Links protegidos",
                  value: stats.invites,
                  conversion: stats.leadToInvite,
                },
                {
                  label: "Cadastros confirmados",
                  value: stats.registrations,
                  conversion: stats.inviteToRegistration,
                },
                {
                  label: "Acessos liberados",
                  value: stats.approved,
                  conversion: stats.registrationToApproval,
                },
              ].map((step, index) => (
                <div className="overview-funnel-step" key={step.label}>
                  <div>
                    <span>{step.label}</span>
                    <strong>{step.value}</strong>
                  </div>
                  <div className="overview-funnel-track" aria-hidden="true">
                    <span
                      style={{ width: `${Math.max(4, percentage(step.value, stats.leads))}%` }}
                    />
                  </div>
                  <small>
                    {index === 0 ? "Base total" : `${step.conversion}% da etapa anterior`}
                  </small>
                </div>
              ))}
            </div>
          </article>

          <article className="overview-panel overview-activity">
            <div className="overview-panel-heading">
              <div>
                <span className="admin-eyebrow">Tempo real</span>
                <h2>Atividade recente</h2>
              </div>
              <Activity aria-hidden="true" />
            </div>
            <div className="overview-activity-list">
              {activity.map((item) => {
                const Icon =
                  item.type === "lead"
                    ? UserPlus
                    : item.type === "invite"
                      ? Link2
                      : item.type === "registration"
                        ? Mail
                        : ShieldCheck;
                return (
                  <div className={`overview-activity-item is-${item.type}`} key={item.id}>
                    <span>
                      <Icon aria-hidden="true" />
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                    </div>
                    <time dateTime={item.date}>{formatDate(item.date)}</time>
                  </div>
                );
              })}
              {activity.length === 0 ? (
                <div className="overview-empty">Nenhuma atividade registrada ainda.</div>
              ) : null}
            </div>
          </article>
        </section>

        <section className="overview-panel overview-access-panel">
          <div className="overview-panel-heading overview-section-heading">
            <div>
              <span className="admin-eyebrow">Controle de acesso</span>
              <h2>Liberações e validade</h2>
              <p>A data final é calculada automaticamente: liberação + 25 dias.</p>
            </div>
            <div>
              <button type="button" className="admin-secondary-button" onClick={exportAccesses}>
                <Download aria-hidden="true" /> Exportar acessos
              </button>
              <Link to="/validacao" className="overview-text-link">
                Ver validações <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="overview-access-list">
            {recentAccesses.map((registration) => (
              <article className="overview-access-row" key={registration.id}>
                <span className={`overview-status ${accessClass(registration)}`}>
                  {accessLabel(registration)}
                </span>
                <div className="overview-access-person">
                  <strong>{registration.name}</strong>
                  <span>{registration.email}</span>
                </div>
                <div className="overview-access-date">
                  <span>Liberado em</span>
                  <strong>{formatDate(registration.approvedAt, true)}</strong>
                </div>
                <div className="overview-access-date">
                  <span>Vencimento</span>
                  <strong>{formatDate(registration.expiresAt, true)}</strong>
                </div>
                {registration.status === "approved" && !registration.accessExpired ? (
                  <div className="overview-days-left">
                    <strong>{daysUntil(registration.expiresAt)}</strong>
                    <span>dias restantes</span>
                  </div>
                ) : null}
                {registration.status === "pending" ? (
                  <button
                    type="button"
                    className="overview-approve-button"
                    onClick={() => approve(registration)}
                    disabled={actionId === registration.id}
                  >
                    <ShieldCheck aria-hidden="true" />
                    {actionId === registration.id ? "Liberando..." : "Liberar 25 dias"}
                  </button>
                ) : null}
              </article>
            ))}
            {recentAccesses.length === 0 ? (
              <div className="overview-empty">Nenhum convite ou acesso registrado ainda.</div>
            ) : null}
          </div>
        </section>

        <section className="overview-panel overview-leads-panel">
          <div className="overview-panel-heading overview-section-heading">
            <div>
              <span className="admin-eyebrow">Captação</span>
              <h2>Últimos leads</h2>
            </div>
            <div>
              <button type="button" className="admin-secondary-button" onClick={exportLeads}>
                <Download aria-hidden="true" /> Exportar leads
              </button>
              <Link to="/inscritos" className="overview-text-link">
                Ver lista completa <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="overview-lead-list">
            {recentLeads.map((lead) => (
              <article key={lead.id}>
                <span className="overview-lead-avatar" aria-hidden="true">
                  {lead.name.charAt(0).toLocaleUpperCase("pt-BR")}
                </span>
                <div>
                  <strong>{lead.name}</strong>
                  <span>{lead.email}</span>
                </div>
                <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}>{lead.whatsapp}</a>
                <time dateTime={lead.createdAt}>{formatDate(lead.createdAt)}</time>
              </article>
            ))}
            {recentLeads.length === 0 ? (
              <div className="overview-empty">Nenhum lead recebido ainda.</div>
            ) : null}
          </div>
        </section>

        <footer className="overview-footer">
          <Sparkles aria-hidden="true" /> Dashboard NEXUM · dados atualizados sob demanda
        </footer>
      </div>
    </main>
  );
}
