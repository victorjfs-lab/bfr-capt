import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, LockKeyhole, RefreshCw, Search, Users } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import { getLeads } from "../lib/leads.functions";
import type { LeadRecord } from "../lib/leads.schema";

export const Route = createFileRoute("/inscritos")({ component: LeadsAdmin });

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function csvCell(value: string | number) {
  let safeValue = String(value);
  if (/^[=+\-@]/.test(safeValue)) safeValue = `'${safeValue}`;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

function LeadsAdmin() {
  const [password, setPassword] = useState("");
  const [leads, setLeads] = useState<LeadRecord[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    if (!normalizedQuery) return leads;

    return leads.filter((lead) =>
      [lead.name, lead.whatsapp, lead.email].some((value) =>
        value.toLocaleLowerCase("pt-BR").includes(normalizedQuery),
      ),
    );
  }, [leads, query]);

  async function loadLeads(accessPassword: string) {
    setError("");
    setLoading(true);

    try {
      const result = await getLeads({ data: { password: accessPassword } });
      setLeads(result);
    } catch {
      setError("Senha incorreta ou acesso ainda não configurado.");
      setLeads(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadLeads(password);
  }

  function exportCsv() {
    const rows = [
      ["ID", "Nome", "WhatsApp", "E-mail", "Inscrito em"],
      ...filteredLeads.map((lead) => [
        lead.id,
        lead.name,
        lead.whatsapp,
        lead.email,
        formatDate(lead.createdAt),
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `inscritos-nexum-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!leads) {
    return (
      <main className="admin-page">
        <section className="admin-login" aria-labelledby="admin-title">
          <Link to="/" className="admin-brand" aria-label="Voltar para a página do NEXUM">
            <img src="/nexum-logo-brand.png" alt="NEXUM — Indicador de Fluxo" />
          </Link>
          <div className="admin-lock" aria-hidden="true">
            <LockKeyhole />
          </div>
          <p className="admin-eyebrow">Área protegida</p>
          <h1 id="admin-title">Lista de inscritos</h1>
          <p className="admin-login-copy">Digite sua senha para acessar os contatos cadastrados.</p>

          <form onSubmit={handleLogin} className="admin-login-form">
            <label>
              <span>Senha de acesso</span>
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
              {loading ? "ENTRANDO..." : "ACESSAR INSCRITOS"}
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
    <main className="admin-page admin-dashboard">
      <div className="admin-dashboard-inner">
        <header className="admin-dashboard-header">
          <div>
            <Link to="/" className="admin-brand" aria-label="Voltar para a página do NEXUM">
              <img src="/nexum-logo-brand.png" alt="NEXUM — Indicador de Fluxo" />
            </Link>
            <p className="admin-eyebrow">Painel NEXUM</p>
            <h1>Inscritos</h1>
          </div>
          <div className="admin-header-actions">
            <button type="button" className="admin-secondary-button" onClick={exportCsv}>
              <Download aria-hidden="true" /> Exportar CSV
            </button>
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => loadLeads(password)}
              disabled={loading}
            >
              <RefreshCw aria-hidden="true" /> {loading ? "Atualizando" : "Atualizar"}
            </button>
          </div>
        </header>

        <section className="admin-stat" aria-label="Total de inscritos">
          <div className="admin-stat-icon">
            <Users aria-hidden="true" />
          </div>
          <div>
            <span>Total de inscritos</span>
            <strong>{leads.length}</strong>
          </div>
        </section>

        <section className="admin-list" aria-labelledby="leads-table-title">
          <div className="admin-list-header">
            <div>
              <p className="admin-eyebrow">Contatos captados</p>
              <h2 id="leads-table-title">Lista completa</h2>
            </div>
            <label className="admin-search">
              <Search aria-hidden="true" />
              <span className="sr-only">Pesquisar inscritos</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar nome, WhatsApp ou e-mail"
              />
            </label>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>WhatsApp</th>
                  <th>E-mail</th>
                  <th>Inscrito em</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td data-label="Nome">{lead.name}</td>
                    <td data-label="WhatsApp">
                      <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}>
                        {lead.whatsapp}
                      </a>
                    </td>
                    <td data-label="E-mail">
                      <a href={`mailto:${lead.email}`}>{lead.email}</a>
                    </td>
                    <td data-label="Inscrito em">{formatDate(lead.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredLeads.length === 0 ? (
              <div className="admin-empty">
                <Users aria-hidden="true" />
                <p>
                  {leads.length === 0 ? "Nenhum inscrito ainda." : "Nenhum contato encontrado."}
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
