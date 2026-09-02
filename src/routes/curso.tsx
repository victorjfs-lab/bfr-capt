import { createFileRoute } from "@tanstack/react-router";
import Player from "@vimeo/player";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  Headphones,
  LockKeyhole,
  MessageCircle,
  Play,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { nexumLessons as lessons } from "../lib/course-content";
import { requestCourseAccess, saveCourseProgress } from "../lib/course.functions";

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

function savedCourseProgress(token: string) {
  const progressKey = `nexum-course-progress:${token.slice(0, 12)}`;
  const savedProgress = window.localStorage.getItem(progressKey);
  if (!savedProgress) return [];

  try {
    const parsedProgress = JSON.parse(savedProgress) as unknown;
    if (!Array.isArray(parsedProgress)) return [];
    return parsedProgress.filter(
      (item): item is number =>
        typeof item === "number" && Number.isInteger(item) && item >= 1 && item <= lessons.length,
    );
  } catch {
    window.localStorage.removeItem(progressKey);
    return [];
  }
}

function CoursePage() {
  const { convite } = Route.useSearch();
  const [accessState, setAccessState] = useState<"loading" | "granted" | "denied">("loading");
  const [accessMessage, setAccessMessage] = useState("");
  const [studentName, setStudentName] = useState("");
  const [selectedLesson, setSelectedLesson] = useState(0);
  const [playingLesson, setPlayingLesson] = useState<number | null>(null);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [indicatorDownloaded, setIndicatorDownloaded] = useState(false);
  const completedLessonsRef = useRef<number[]>([]);
  const playerIframeRef = useRef<HTMLIFrameElement | null>(null);

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

        const serverProgress = result.completedLessons ?? [];
        const localProgress = savedCourseProgress(convite);
        const mergedProgress = [...new Set([...serverProgress, ...localProgress])].sort(
          (lessonA, lessonB) => lessonA - lessonB,
        );

        setStudentName(result.name);
        completedLessonsRef.current = mergedProgress;
        setCompletedLessons(mergedProgress);
        setIndicatorDownloaded(Boolean(result.indicatorDownloaded));
        setAccessState("granted");

        if (mergedProgress.length !== serverProgress.length) {
          void saveCourseProgress({
            data: { token: convite, completedLessons: mergedProgress },
          }).catch(() => undefined);
        }
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

  const progress = useMemo(
    () => Math.round((completedLessons.length / lessons.length) * 100),
    [completedLessons],
  );

  const persistCompletedLessons = useCallback(
    (next: number[]) => {
      const normalizedLessons = [...new Set(next)].sort((lessonA, lessonB) => lessonA - lessonB);
      completedLessonsRef.current = normalizedLessons;
      setCompletedLessons(normalizedLessons);

      const progressKey = `nexum-course-progress:${convite.slice(0, 12)}`;
      window.localStorage.setItem(progressKey, JSON.stringify(normalizedLessons));
      void saveCourseProgress({
        data: { token: convite, completedLessons: normalizedLessons },
      }).catch(() => undefined);
    },
    [convite],
  );

  function toggleLessonComplete(lessonNumber: number) {
    const current = completedLessonsRef.current;
    const next = current.includes(lessonNumber)
      ? current.filter((item) => item !== lessonNumber)
      : [...current, lessonNumber];
    persistCompletedLessons(next);
  }

  const markLessonWatched = useCallback(
    (lessonNumber: number) => {
      if (completedLessonsRef.current.includes(lessonNumber)) return;
      persistCompletedLessons([...completedLessonsRef.current, lessonNumber]);
    },
    [persistCompletedLessons],
  );

  const activeLesson = lessons[selectedLesson];
  const activeLessonCompleted = completedLessons.includes(activeLesson.number);

  useEffect(() => {
    const iframe = playerIframeRef.current;
    if (accessState !== "granted" || !iframe) return;

    const player = new Player(iframe);
    let listening = true;
    const handleTimeUpdate = ({ percent }: { percent: number }) => {
      if (listening && percent >= 0.9) markLessonWatched(activeLesson.number);
    };

    player.on("timeupdate", handleTimeUpdate);
    return () => {
      listening = false;
      player.off("timeupdate", handleTimeUpdate);
    };
  }, [accessState, activeLesson.number, activeLesson.videoId, markLessonWatched, playingLesson]);

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
              <p>Seu progresso fica salvo automaticamente no seu acesso.</p>
            </aside>
          </div>
        </section>

        <section className="course-content-section">
          <div className="course-container course-layout">
            <div className="course-player-column">
              <div className="course-player-frame">
                {activeLesson.poster && playingLesson !== activeLesson.number ? (
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
                    ref={playerIframeRef}
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
                    onClick={() => toggleLessonComplete(activeLesson.number)}
                  >
                    <CheckCircle2 aria-hidden="true" />
                    {activeLessonCompleted ? "Aula concluída" : "Marcar como concluída"}
                  </button>

                  {selectedLesson < lessons.length - 1 ? (
                    <button
                      className="course-next-button"
                      type="button"
                      onClick={() => {
                        setSelectedLesson((current) => current + 1);
                        setPlayingLesson(null);
                      }}
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
                  <strong>4 aulas práticas</strong>
                </div>

                <div className="course-lessons-list">
                  {lessons.map((lesson, index) => {
                    const isActive = index === selectedLesson;
                    const isComplete = completedLessons.includes(lesson.number);

                    return (
                      <button
                        className={`${isActive ? "is-active" : ""} ${isComplete ? "is-complete" : ""}`}
                        type="button"
                        onClick={() => {
                          setSelectedLesson(index);
                          setPlayingLesson(null);
                        }}
                        key={lesson.number}
                      >
                        <span className="course-list-number">
                          {isComplete ? <Check aria-hidden="true" /> : lesson.number}
                        </span>
                        <span className="course-list-copy">
                          <strong>{lesson.title}</strong>
                          <small>Aula em vídeo</small>
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
                  <p>Baixe o pacote com os três indicadores apresentados no treinamento.</p>
                </div>
                <a
                  href={`/api/indicadores?convite=${encodeURIComponent(convite)}`}
                  onClick={() => setIndicatorDownloaded(true)}
                >
                  <Download aria-hidden="true" />
                  {indicatorDownloaded ? "Baixar novamente" : "Baixar indicadores"}
                </a>
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
