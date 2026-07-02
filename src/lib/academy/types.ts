export type AcademyTextBlock = {
  kind: "paragraph";
  text: string;
};

export type AcademyListBlock = {
  kind: "list";
  items: string[];
};

export type AcademyStepsBlock = {
  kind: "steps";
  items: string[];
};

export type AcademyPairsBlock = {
  kind: "pairs";
  rows: Array<{ label: string; value: string }>;
};

export type AcademyCardsBlock = {
  kind: "cards";
  cards: Array<{
    title: string;
    body: string[];
  }>;
};

export type AcademyDetailsBlock = {
  kind: "details";
  items: Array<{
    title: string;
    points: string[];
  }>;
};

export type AcademyFaqBlock = {
  kind: "faq";
  items: Array<{
    question: string;
    answer: string;
  }>;
};

export type AcademyTimelineBlock = {
  kind: "timeline";
  items: Array<{
    title: string;
    summary: string;
    completed?: string[];
    planned?: string[];
  }>;
};

export type AcademyBlock =
  | AcademyTextBlock
  | AcademyListBlock
  | AcademyStepsBlock
  | AcademyPairsBlock
  | AcademyCardsBlock
  | AcademyDetailsBlock
  | AcademyFaqBlock
  | AcademyTimelineBlock;

export type AcademySection = {
  id: string;
  title: string;
  keywords: string[];
  blocks: AcademyBlock[];
};
