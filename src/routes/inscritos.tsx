import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  LockKeyhole,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Pagination, PaginationContent, PaginationItem } from "../components/ui/pagination";
import { getLeads } from "../lib/leads.functions";
import type { LeadRecord } from "../lib/leads.schema";

export const Route = createFileRoute("/inscritos")({ component: LeadsAdmin });

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const leadsPerPage = 40;

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
  const [checkingSession, setCheckingSession] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / leadsPerPage));
  const paginatedLeads = useMemo(() => {
    const firstLead = (currentPage - 1) * leadsPerPage;
    return filteredLeads.slice(firstLead, firstLead + leadsPerPage);
  }, [currentPage, filteredLeads]);

  const paginationPages = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

    return [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])]
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((pageA, pageB) => pageA - pageB);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    let active = true;

    getLeads({ data: { password: "" } })
      .then((result) => {
        if (active) setLeads(result);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, []);

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

  if (checkingSession) {
    return (
      <main className="admin-page">
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
                onChange={(event) => {
                  setQuery(event.target.value);
                  setCurrentPage(1);
                }}
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
                {paginatedLeads.map((lead) => (
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

          {filteredLeads.length > 0 ? (
            <div className="admin-pagination">
              <p>
                Mostrando <strong>{(currentPage - 1) * leadsPerPage + 1}</strong>–
                <strong>{Math.min(currentPage * leadsPerPage, filteredLeads.length)}</strong> de
                <strong>{filteredLeads.length}</strong>
              </p>

              <Pagination className="admin-pagination-nav">
                <PaginationContent>
                  <PaginationItem>
                    <button
                      type="button"
                      className="admin-pagination-button is-direction"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft aria-hidden="true" /> Anterior
                    </button>
                  </PaginationItem>

                  {paginationPages.map((page, index) => {
                    const previousPage = paginationPages[index - 1];
                    return (
                      <PaginationItem key={page}>
                        {previousPage && page - previousPage > 1 ? (
                          <span className="admin-pagination-ellipsis">…</span>
                        ) : null}
                        <button
                          type="button"
                          className={`admin-pagination-button ${page === currentPage ? "is-active" : ""}`}
                          onClick={() => setCurrentPage(page)}
                          aria-current={page === currentPage ? "page" : undefined}
                          aria-label={`Ir para a página ${page}`}
                        >
                          {page}
                        </button>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <button
                      type="button"
                      className="admin-pagination-button is-direction"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima <ChevronRight aria-hidden="true" />
                    </button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
