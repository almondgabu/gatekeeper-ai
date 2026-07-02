import type { AcademyBlock, AcademySection as AcademySectionType } from "@/lib/academy/types";

function renderBlock(block: AcademyBlock, key: string) {
  if (block.kind === "paragraph") {
    return (
      <p key={key} className="text-sm leading-7 text-slate-300">
        {block.text}
      </p>
    );
  }

  if (block.kind === "list") {
    return (
      <ul key={key} className="list-disc space-y-2 pl-6 text-sm leading-7 text-slate-300">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  if (block.kind === "steps") {
    return (
      <ol key={key} className="space-y-3 text-sm leading-7 text-slate-200">
        {block.items.map((item, index) => (
          <li key={item} className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
            <span className="font-semibold text-cyan-200">{index + 1}. </span>
            <span>{item}</span>
            {index < block.items.length - 1 ? <div className="mt-2 text-xs text-slate-500">↓</div> : null}
          </li>
        ))}
      </ol>
    );
  }

  if (block.kind === "pairs") {
    return (
      <dl key={key} className="space-y-4">
        {block.rows.map((row) => (
          <div key={row.label} className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">{row.label}</dt>
            <dd className="mt-2 text-sm leading-7 text-slate-300">{row.value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  if (block.kind === "cards") {
    return (
      <div key={key} className="grid gap-4 lg:grid-cols-2">
        {block.cards.map((card) => (
          <article key={card.title} className="rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-5">
            <h3 className="text-base font-semibold text-white">{card.title}</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-300">
              {card.body.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    );
  }

  if (block.kind === "details") {
    return (
      <div key={key} className="space-y-3">
        {block.items.map((item) => (
          <details key={item.title} className="rounded-xl border border-slate-800 bg-slate-900/65 px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-white">{item.title}</summary>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-7 text-slate-300">
              {item.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    );
  }

  if (block.kind === "faq") {
    return (
      <div key={key} className="space-y-3">
        {block.items.map((entry) => (
          <details key={entry.question} className="rounded-xl border border-slate-800 bg-slate-900/65 px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-white">{entry.question}</summary>
            <p className="mt-3 text-sm leading-7 text-slate-300">{entry.answer}</p>
          </details>
        ))}
      </div>
    );
  }

  return (
    <div key={key} className="space-y-4">
      {block.items.map((item) => (
        <article key={item.title} className="relative border-l border-cyan-400/40 pl-4">
          <h3 className="text-sm font-semibold text-white">{item.title}</h3>
          <p className="mt-1 text-sm leading-7 text-slate-300">{item.summary}</p>
          {item.completed?.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-200">
              {item.completed.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
          {item.planned?.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-cyan-200">
              {item.planned.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export default function AcademySection({ section }: { section: AcademySectionType }) {
  return (
    <section id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-24 space-y-5 rounded-2xl border border-slate-800 bg-slate-950/55 px-5 py-6 md:px-7">
      <h2 id={`${section.id}-title`} className="text-2xl font-semibold text-white md:text-3xl">
        {section.title}
      </h2>
      <div className="space-y-4">{section.blocks.map((block, index) => renderBlock(block, `${section.id}-${index}`))}</div>
    </section>
  );
}
