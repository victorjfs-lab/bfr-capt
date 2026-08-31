import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  Headphones,
  LockKeyhole,
  Play,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { requestCourseAccess } from "../lib/course.functions";

export const Route = createFileRoute("/curso")({
  component: CoursePage,
  validateSearch: (search: Record<string, unknown>) => ({
    convite: typeof search.convite === "string" ? search.convite : "",
  }),
  head: () => ({
    meta: [
      { title: "Área de Treinamento | NEXUM" },
      {
        name: "description",
        content: "Mini curso de ativação e utilização dos indicadores NEXUM.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const lessons = [
  {
    number: 1,
    title: "Comece por aqui",
    description: "Visão geral do treinamento e o caminho mais rápido para começar.",
    duration: "6 min",
  },
  {
    number: 2,
    title: "Instalação dos indicadores",
    description: "Passo a passo para instalar e configurar as ferramentas no seu gráfico.",
    duration: "12 min",
  },
  {
    number: 3,
    title: "Nuvens de contexto",
    description: "Como identificar a tendência e enxergar o contexto antes da entrada.",
    duration: "15 min",
  },
  {
    number: 4,
    title: "Entradas e saídas com o NEXUM",
    description: "Leitura prática das regiões de entrada, saída e possível reversão.",
    duration: "18 min",
  },
  {
    number: 5,
    title: "Seu plano operacional",
    description: "Organize critérios simples para operar com mais clareza e consistência.",
    duration: "10 min",
  },
];

function CoursePage() {
  const { convite } = Route.useSearch();
  const [accessState, setAccessState] = useState<"loading" | "granted" | "denied">("loading");
  const [accessMessage, setAccessMessage] = useState("");
  const [studentName, setStudentName] = useState("");
  const [selectedLesson, setSelectedLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);

  useEffect(() => {
    let active = true;

    async function validateAccess() {
      if (!/^[a-f0-9]{64}$/i.test(convite)) {
        setAccessMessage("Usuário não encontrado, confirmar E-mail.");
        setAccessState("denied");
        return;
      }

      try {
        const result = await requestCourseAccess({ data: { token: convite } });
        if (!active) return;

        if (!result.ok) {
          setAccessMessage(result.message);
          setAccessState("denied");
          return;
        }

        setStudentName(result.name);
        setAccessState("granted");
      } catch {
        if (active) {
          setAccessMessage("Usuário não encontrado, confirmar E-mail.");
          setAccessState("denied");
        }
      }
    }

    void validateAccess();
    return () => {
      active = false;
    };
  }, [convite]);

  useEffect(() => {
    const progressKey = `nexum-course-progress:${convite.slice(0, 12)}`;
    const savedProgress = window.localStorage.getItem(progressKey);
    if (!savedProgress) return;

    try {
      const parsedProgress = JSON.parse(savedProgress) as unknown;
      if (Array.isArray(parsedProgress)) {
        setCompletedLessons(parsedProgress.filter((item) => typeof item === "number"));
      }
    } catch {
      window.localStorage.removeItem(progressKey);
    }
  }, [convite]);

  const progress = useMemo(
    () => Math.round((completedLessons.length / lessons.length) * 100),
    [completedLessons],
  );

  function toggleLessonComplete(lessonNumber: number) {
    setCompletedLessons((current) => {
      const next = current.includes(lessonNumber)
        ? current.filter((item) => item !== lessonNumber)
        : [...current, lessonNumber];

      const progressKey = `nexum-course-progress:${convite.slice(0, 12)}`;
      window.localStorage.setItem(progressKey, JSON.stringify(next));
      return next;
    });
  }

  const activeLesson = lessons[selectedLesson];
  const activeLessonCompleted = completedLessons.includes(activeLesson.number);

  if (accessState !== "granted") {
    return (
      <CourseAccessStatus state={accessState} message={accessMessage} invitationToken={convite} />
    );
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
              <LockKeyhole aria-hidden="true" /> Olá, {studentName.split(" ")[0]}
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
                <Sparkles aria-hidden="true" /> Seu acesso começou
              </span>
              <h1>Domine o NEXUM e transforme pressão em decisão.</h1>
              <p>
                Assista às aulas na ordem, instale as ferramentas e aprenda a reconhecer com mais
                clareza quando entrar, quando sair e quando ficar de fora.
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
                <img src="/nexum-video-poster-v4.png" alt="Área do vídeo da aula NEXUM" />
                <div className="course-player-overlay">
                  <span className="course-player-icon">
                    <Play aria-hidden="true" />
                  </span>
                  <strong>Aula {activeLesson.number}</strong>
                  <span>O vídeo desta aula será conectado aqui</span>
                </div>
              </div>

              <div className="course-lesson-copy">
                <div className="course-lesson-heading">
                  <div>
                    <span className="course-lesson-number">Aula {activeLesson.number}</span>
                    <h2>{activeLesson.title}</h2>
                  </div>
                  <span className="course-duration">
                    <Clock3 aria-hidden="true" /> {activeLesson.duration}
                  </span>
                </div>
                <p>{activeLesson.description}</p>

                <div className="course-lesson-actions">
                  <button
                    className={activeLessonCompleted ? "is-complete" : ""}
                    type="button"
                    onClick={() => toggleLessonComplete(activeLesson.number)}
                  >
                    <CheckCircle2 aria-hidden="true" />
                    {activeLessonCompleted ? "Aula concluída" : "Marcar como concluída"}
                  </button>

                  {selectedLesson < lessons.length - 1 ? (
                    <button
                      className="course-next-button"
                      type="button"
                      onClick={() => setSelectedLesson((current) => current + 1)}
                    >
                      Próxima aula <ChevronRight aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <aside className="course-sidebar">
              <div className="course-module-card">
                <div className="course-module-heading">
                  <span>Mini curso NEXUM</span>
                  <strong>5 aulas práticas</strong>
                </div>

                <div className="course-lessons-list">
                  {lessons.map((lesson, index) => {
                    const isActive = index === selectedLesson;
                    const isComplete = completedLessons.includes(lesson.number);

                    return (
                      <button
                        className={`${isActive ? "is-active" : ""} ${isComplete ? "is-complete" : ""}`}
                        type="button"
                        onClick={() => setSelectedLesson(index)}
                        key={lesson.number}
                      >
                        <span className="course-list-number">
                          {isComplete ? <Check aria-hidden="true" /> : lesson.number}
                        </span>
                        <span className="course-list-copy">
                          <strong>{lesson.title}</strong>
                          <small>{lesson.duration}</small>
                        </span>
                        <ChevronRight aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="course-download-card">
                <span className="course-download-icon">
                  <Download aria-hidden="true" />
                </span>
                <div>
                  <span className="course-card-label">Material exclusivo</span>
                  <h3>Indicadores NEXUM</h3>
                  <p>Pacote de instalação e manual rápido para acompanhar as aulas.</p>
                </div>
                <button type="button" disabled>
                  <FileText aria-hidden="true" /> Arquivo em preparação
                </button>
              </div>

              <div className="course-support-card">
                <Headphones aria-hidden="true" />
                <div>
                  <strong>Ficou com alguma dúvida?</strong>
                  <span>Fale com nossa equipe de suporte.</span>
                </div>
                <a
                  href="https://wa.me/555133765598?text=Ol%C3%A1%21%20Preciso%20de%20ajuda%20com%20o%20treinamento%20NEXUM."
                  target="_blank"
                  rel="noreferrer"
                >
                  Chamar no WhatsApp
                </a>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}

function CourseAccessStatus({
  state,
  message,
  invitationToken,
}: {
  state: "loading" | "denied";
  message: string;
  invitationToken: string;
}) {
  const needsRegistration = message === "Finalize sua inscrição pelo link protegido.";

  return (
    <main className="course-gate-page">
      <section className="course-gate-card">
        <a href="/" className="enrollment-brand">
          <img src="/nexum-logo-brand.png" alt="NEXUM — Indicador de Fluxo" />
        </a>
        <div className={`course-gate-icon ${state === "loading" ? "is-loading" : ""}`}>
          <LockKeyhole aria-hidden="true" />
        </div>
        <p className="enrollment-eyebrow">Área de treinamento protegida</p>
        <h1>{state === "loading" ? "Validando seu acesso..." : "Acesso ainda não liberado"}</h1>
        <p>{state === "loading" ? "Aguarde só um instante." : message}</p>

        {state === "denied" && needsRegistration ? (
          <a className="course-gate-button" href={`/inscricao?convite=${invitationToken}`}>
            FINALIZAR MINHA INSCRIÇÃO
          </a>
        ) : null}
        {state === "denied" && !needsRegistration ? (
          <a className="course-gate-link" href="/">
            Voltar para o site
          </a>
        ) : null}
      </section>
    </main>
  );
}
