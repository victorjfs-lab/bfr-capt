import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ExternalLink,
  Headphones,
  MessageCircle,
  Play,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { memberNexumLessons as lessons } from "../lib/course-content";

export const Route = createFileRoute("/acesseonexum")({
  component: FixedAccessCoursePage,
  head: () => ({
    meta: [
      { title: "Acesso ao treinamento | NEXUM" },
      {
        name: "description",
        content: "Treinamento liberado para aprender a utilizar o NEXUM.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const fixedProgressKey = "nexum-fixed-course-progress:acesseonexum";
const indicatorWhatsappUrl =
  "https://wa.me/554191554010?text=Quero%20solicitar%20o%20indicador%2C%20j%C3%A1%20fiz%20as%20aulas";

function FixedAccessCoursePage() {
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const activeLesson = lessons[0];

  useEffect(() => {
    const savedProgress = window.localStorage.getItem(fixedProgressKey);
    if (!savedProgress) return;

    try {
      const parsedProgress = JSON.parse(savedProgress) as unknown;
      if (!Array.isArray(parsedProgress)) return;
      setCompletedLessons(
        parsedProgress.filter(
          (item): item is number =>
            typeof item === "number" && Number.isInteger(item) && item === activeLesson.number,
        ),
      );
    } catch {
      window.localStorage.removeItem(fixedProgressKey);
    }
  }, [activeLesson.number]);

  const activeLessonCompleted = completedLessons.includes(activeLesson.number);
  const progress = useMemo(
    () => Math.round((completedLessons.length / lessons.length) * 100),
    [completedLessons],
  );

  function toggleLessonComplete() {
    setCompletedLessons((current) => {
      const next = current.includes(activeLesson.number) ? [] : [activeLesson.number];
      window.localStorage.setItem(fixedProgressKey, JSON.stringify(next));
      return next;
    });
  }

  return (
    <div className="course-page">
      <header className="course-header">
        <div className="course-container course-header-inner">
          <a className="course-brand" href="/" aria-label="Voltar para o site do NEXUM">
            <img src="/nexum-logo-brand.png" alt="NEXUM — Indicador de Fluxo" />
          </a>

          <div className="course-header-status">
            <span>
              <CheckCircle2 aria-hidden="true" /> Olá, aluno
            </span>
            <a href="/">
              <ArrowLeft aria-hidden="true" /> Voltar ao site
            </a>
          </div>
        </div>
      </header>

      <main className="course-main">
        <section className="course-welcome">
          <div className="course-container course-welcome-grid">
            <div>
              <span className="course-eyebrow">
                <Sparkles aria-hidden="true" /> Seu acesso está liberado
              </span>
              <h1>Domine o NEXUM e transforme pressão em decisão.</h1>
              <p>
                Assista à aula completa e aprenda a utilizar o NEXUM com mais clareza na sua
                operação.
              </p>
            </div>

            <aside className="course-progress-card" aria-label="Progresso do treinamento">
              <div className="course-progress-heading">
                <div>
                  <span>Seu progresso</span>
                  <strong>{progress}% concluído</strong>
                </div>
                <span className="course-progress-count">
                  {completedLessons.length}/{lessons.length}
                </span>
              </div>
              <div className="course-progress-track" aria-hidden="true">
                <span style={{ width: `${progress}%` }} />
              </div>
              <p>Seu progresso fica salvo automaticamente neste dispositivo.</p>
            </aside>
          </div>
        </section>

        <section className="course-content-section">
          <div className="course-container course-layout">
            <div className="course-player-column">
              <div className="course-player-frame">
                <iframe
                  src={activeLesson.embedUrl}
                  title={`Aula ${activeLesson.number} — ${activeLesson.title}`}
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>

              <div className="course-lesson-copy">
                <div className="course-lesson-heading">
                  <div>
                    <span className="course-lesson-number">Aula {activeLesson.number}</span>
                    <h2>{activeLesson.title}</h2>
                  </div>
                  <span className="course-duration">
                    <Play aria-hidden="true" /> Aula em vídeo
                  </span>
                </div>
                <p>{activeLesson.description}</p>

                {activeLesson.resource ? (
                  <a
                    className="course-lesson-resource"
                    href={activeLesson.resource.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="course-lesson-resource-icon">
                      {activeLesson.resource.type === "whatsapp" ? (
                        <MessageCircle aria-hidden="true" />
                      ) : (
                        <ExternalLink aria-hidden="true" />
                      )}
                    </span>
                    <span>
                      <strong>{activeLesson.resource.label}</strong>
                      <small>{activeLesson.resource.description}</small>
                    </span>
                    <ExternalLink aria-hidden="true" />
                  </a>
                ) : null}

                <div className="course-lesson-actions">
                  <button
                    className={activeLessonCompleted ? "is-complete" : ""}
                    type="button"
                    onClick={toggleLessonComplete}
                  >
                    <CheckCircle2 aria-hidden="true" />
                    {activeLessonCompleted ? "Aula concluída" : "Marcar como concluída"}
                  </button>
                </div>
              </div>
            </div>

            <aside className="course-sidebar">
              <div className="course-module-card">
                <div className="course-module-heading">
                  <span>Mini curso NEXUM</span>
                  <strong>1 aula prática</strong>
                </div>

                <div className="course-lessons-list">
                  <button className="is-active" type="button">
                    <span className="course-list-number">
                      {activeLessonCompleted ? <Check aria-hidden="true" /> : activeLesson.number}
                    </span>
                    <span className="course-list-copy">
                      <strong>{activeLesson.title}</strong>
                      <small>Aula em vídeo</small>
                    </span>
                  </button>
                </div>
              </div>

              <div className="course-download-card">
                <span className="course-download-icon">
                  <MessageCircle aria-hidden="true" />
                </span>
                <div>
                  <span className="course-card-label">Solicite pelo WhatsApp</span>
                  <h3>Indicadores NEXUM</h3>
                  <p>Concluiu a aula? Envie uma mensagem para receber o indicador.</p>
                </div>
                <a href={indicatorWhatsappUrl} target="_blank" rel="noreferrer">
                  <MessageCircle aria-hidden="true" />
                  Solicitar o indicador agora
                </a>
              </div>

              <div className="course-support-card">
                <Headphones aria-hidden="true" />
                <div>
                  <strong>Precisa de ajuda?</strong>
                  <p>Nossa equipe está pronta para acompanhar sua ativação.</p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
