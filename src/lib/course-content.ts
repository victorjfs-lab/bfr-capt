type NexumLesson = {
  number: number;
  title: string;
  description: string;
  embedUrl: string;
  poster?: string | null;
  resource?: {
    href: string;
    label: string;
    description: string;
    type: "whatsapp" | "external";
  };
};

export const nexumLessons: readonly NexumLesson[] = [
  {
    number: 1,
    title: "Como utilizar o Nexum",
    description:
      "Aprenda, em uma única aula, como utilizar o NEXUM de forma prática na sua operação.",
    embedUrl:
      "https://www.veed.io/embed/aa03563b-a437-496c-be74-45c0d1d949e0?watermark=0&color=&sharing=0&title=0",
    resource: {
      href: "https://paredesofrer.fluxosimplificado.com/",
      label: "Acessar o Pare de Sofrer",
      description: "Continue sua evolução operacional.",
      type: "external" as const,
    },
  },
] as const;

export const memberNexumLessons = nexumLessons;

export const MEMBER_LESSON_COUNT = memberNexumLessons.length;
