import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Play,
  Sparkles,
  UnlockKeyhole,
} from "lucide-react";
import { useState } from "react";

import { nexumLessons } from "../lib/course-content";

export const Route = createFileRoute("/nexumaulaaberta")({
  component: OpenNexumCoursePage,
  head: () => ({
    meta: [
      { title: "Aulas abertas NEXUM" },
      {
        name: "description",
        content: "Assista gratuitamente às quatro aulas práticas do treinamento NEXUM.",
      },
      { name: "robots", content: "index, follow" },
    ],
  }),
});

function OpenNexumCoursePage() {
  const [selectedLesson, setSelectedLesson] = useState(0);
  const [playingLesson, setPlayingLesson] = useState<number | null>(null);
  const activeLesson = nexumLessons[selectedLesson];

  function selectLesson(index: number) {
    setSelectedLesson(index);
    setPlayingLesson(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="course-page open-course-page">
      <header className="course-header">
        <div className="course-container course-header-inner">
          <a className="course-brand" href="/" aria-label="Voltar para o site do NEXUM">
            <img src="/nexum-logo-brand.png" alt="NEXUM — Indicador de Fluxo" />
          </a>

          <div className="course-header-status">
            <span>
              <UnlockKeyhole aria-hidden="true" /> Acesso aberto
            </span>
            <a href="/">
              <ArrowLeft aria-hidden="true" /> Voltar ao site
            </a>
          </div>
        </div>
      </header>

      <main className="course-main">
        <section className="course-welcome open-course-welcome">
          <div className="course-container">
            <div>
              <span className="course-eyebrow">
                <Sparkles aria-hidden="true" /> Aulas abertas NEXUM
              </span>
              <h1>Domine o NEXUM e transforme pressão em decisão.</h1>
              <p>
                Assista às quatro aulas práticas na ordem e aprenda a instalar e utilizar as
                ferramentas com mais clareza na sua operação.
              </p>
            </div>
          </div>
        </section>

        <section className="course-content-section">
          <div className="course-container course-layout open-course-layout">
            <div className="course-player-column">
              <div className="course-player-frame">
                {"poster" in activeLesson &&
                activeLesson.poster &&
                playingLesson !== activeLesson.number ? (
                  <button
                    className="course-player-cover"
                    type="button"
                    onClick={() => setPlayingLesson(activeLesson.number)}
                    aria-label={`Assistir à Aula ${activeLesson.number}: ${activeLesson.title}`}
                  >
                    <img src={activeLesson.poster} alt="" />
                  </button>
                ) : (
                  <iframe
                    key={activeLesson.videoId}
                    src={`https://player.vimeo.com/video/${activeLesson.videoId}?dnt=1&title=0&byline=0&portrait=0${playingLesson === activeLesson.number ? "&autoplay=1" : ""}`}
                    title={`Aula ${activeLesson.number} — ${activeLesson.title}`}
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                )}
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

                {"resource" in activeLesson && activeLesson.resource ? (
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

                {selectedLesson < nexumLessons.length - 1 ? (
                  <div className="course-lesson-actions open-course-actions">
                    <button
                      className="course-next-button"
                      type="button"
                      onClick={() => selectLesson(selectedLesson + 1)}
                    >
                      Próxima aula <ChevronRight aria-hidden="true" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <aside className="course-sidebar">
              <div className="course-module-card">
                <div className="course-module-heading">
                  <span>Treinamento NEXUM</span>
                  <strong>4 aulas abertas</strong>
                </div>

                <div className="course-lessons-list">
                  {nexumLessons.map((lesson, index) => (
                    <button
                      className={index === selectedLesson ? "is-active" : ""}
                      type="button"
                      onClick={() => selectLesson(index)}
                      key={lesson.number}
                    >
                      <span className="course-list-number">{lesson.number}</span>
                      <span className="course-list-copy">
                        <strong>{lesson.title}</strong>
                        <small>Aula em vídeo</small>
                      </span>
                      <ChevronRight aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
