export const developerStructure = [
  "src/app: App Router pages, route handlers, and layouts.",
  "src/components: Reusable UI modules grouped by feature.",
  "src/lib: Domain logic, persistence helpers, and bridge utilities.",
  "src/types: Shared TypeScript contracts.",
  "docs: Product and architecture documentation snapshots.",
];

export const developerStandards = [
  "Keep workflow phases isolated and only persist approved artifacts to the bridge.",
  "Preserve TypeScript strictness and avoid any-type shortcuts.",
  "Use Tailwind utility classes with consistent spacing scales.",
  "Prefer composition over deep component nesting.",
  "Run npm run build before shipping changes.",
  "Validate mobile breakpoints at 390px and 430px for major UX surfaces.",
];

export const qaProcess = [
  "Run creator lifecycle walkthrough from Idea Explorer to Intelligence.",
  "Confirm bridge milestones update in sequence p1 through p6.",
  "Verify approval gate wording and single primary CTA per phase.",
  "Check no horizontal overflow and no nested scrollbars on key pages.",
  "Run npm run build and fix regressions before merge.",
];
