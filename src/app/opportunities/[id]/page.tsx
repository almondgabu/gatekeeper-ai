"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, FolderKanban, Save, Target } from "lucide-react";
import {
  OPPORTUNITY_STAGES,
  OPPORTUNITY_URGENCY,
  buildOpportunityIntelligence,
  getOpportunityChecklist,
  getOpportunityStageLabel,
  getOpportunityTypeLabel,
  type OpportunityRecord,
  type OpportunityStage,
  type OpportunityUrgency,
} from "@/lib/opportunityIntelligence";

function formatCurrency(value: number | string | null) {
  const amount = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : 0;

  if (!Number.isFinite(amount) || amount <= 0) {
    return "Not set";
  }

  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getScoreTone(score: number) {
  if (score >= 75) {
    return "border-red-500/30 bg-red-500/10 text-red-100";
  }

  if (score >= 50) {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-100";
  }

  if (score >= 25) {
    return "border-blue-500/30 bg-blue-500/10 text-blue-100";
  }

  return "border-slate-700 bg-slate-900 text-slate-200";
}

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const opportunityId = id.trim();
  const [opportunity, setOpportunity] = useState<OpportunityRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [convertedProject, setConvertedProject] = useState<{ id: string; name: string } | null>(null);

  async function loadOpportunity() {
    setLoading(true);
    const response = await fetch(`/api/opportunities?id=${encodeURIComponent(opportunityId)}`, {
      cache: "no-store",
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setErrorMessage(result.error || "Failed to load opportunity.");
      return;
    }

    setOpportunity(result.opportunity as OpportunityRecord);
  }

  useEffect(() => {
    void loadOpportunity();
  }, [opportunityId]);

  const intelligence = useMemo(() => {
    return opportunity ? buildOpportunityIntelligence(opportunity) : null;
  }, [opportunity]);

  const checklist = opportunity ? getOpportunityChecklist(opportunity.opportunity_type) : [];

  async function saveOpportunity(nextOpportunity: OpportunityRecord) {
    setSaving(true);
    setErrorMessage(null);

    const response = await fetch("/api/opportunities", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        opportunityId: nextOpportunity.id,
        title: nextOpportunity.title,
        stage: nextOpportunity.stage,
        urgency: nextOpportunity.urgency,
        contactName: nextOpportunity.contact_name,
        locationSummary: nextOpportunity.location_summary,
        description: nextOpportunity.description,
        estimatedValue: nextOpportunity.estimated_value,
        estimatedCommission: nextOpportunity.estimated_commission,
        nextAction: nextOpportunity.next_action,
        followUpDate: nextOpportunity.follow_up_date,
        qualificationNotes: nextOpportunity.qualification_notes,
        checklistCompleted: nextOpportunity.checklist_completed ?? [],
      }),
    });

    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      setErrorMessage(result.error || "Failed to save opportunity.");
      return;
    }

    setOpportunity(result.opportunity as OpportunityRecord);
  }

  function updateField<K extends keyof OpportunityRecord>(field: K, value: OpportunityRecord[K]) {
    setOpportunity((current) => (current ? { ...current, [field]: value } : current));
  }

  async function toggleChecklistItem(itemId: string) {
    if (!opportunity) {
      return;
    }

    const currentItems = new Set(opportunity.checklist_completed ?? []);

    if (currentItems.has(itemId)) {
      currentItems.delete(itemId);
    } else {
      currentItems.add(itemId);
    }

    const nextOpportunity = {
      ...opportunity,
      checklist_completed: [...currentItems],
    };

    setOpportunity(nextOpportunity);
    await saveOpportunity(nextOpportunity);
  }

  async function convertOpportunity() {
    if (!opportunity) {
      return;
    }

    setConverting(true);
    setErrorMessage(null);

    const response = await fetch("/api/opportunities/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ opportunityId: opportunity.id }),
    });

    const result = await response.json();
    setConverting(false);

    if (!response.ok) {
      setErrorMessage(result.error || "Failed to convert opportunity.");
      return;
    }

    if (result.project) {
      setConvertedProject(result.project as { id: string; name: string });
    }

    await loadOpportunity();
  }

  if (loading) {
    return (
      <section className="min-h-screen p-6 md:p-8 lg:p-10">
        <div className="mx-auto max-w-7xl rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-slate-400">
          Loading opportunity...
        </div>
      </section>
    );
  }

  if (!opportunity || !intelligence) {
    return (
      <section className="min-h-screen p-6 md:p-8 lg:p-10">
        <div className="mx-auto max-w-7xl rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-100">
          {errorMessage || "Opportunity not found."}
        </div>
      </section>
    );
  }

  const completedChecklist = new Set(opportunity.checklist_completed ?? []);

  return (
    <section className="min-h-screen p-6 md:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)] md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-yellow-400/80">Opportunity Intelligence</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">{opportunity.title}</h1>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                  {getOpportunityTypeLabel(opportunity.opportunity_type)}
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                  {getOpportunityStageLabel(opportunity.stage)}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getScoreTone(intelligence.score.score)}`}>
                  {intelligence.score.label}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {opportunity.converted_project_id ? (
                <Link
                  href={`/projects/${opportunity.converted_project_id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-yellow-400"
                >
                  <FolderKanban size={18} />
                  Open Project
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={convertOpportunity}
                  disabled={converting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FolderKanban size={18} />
                  {converting ? "Converting..." : "Convert To Project"}
                </button>
              )}

              <button
                type="button"
                onClick={() => void saveOpportunity(opportunity)}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={18} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
              {errorMessage}
            </div>
          ) : null}

          {convertedProject ? (
            <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              Converted into project {convertedProject.name}.
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <section className="rounded-[26px] border border-slate-800 bg-slate-900/70 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Opportunity Record</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Core details</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Title">
                  <input
                    value={opportunity.title}
                    onChange={(event) => updateField("title", event.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  />
                </Field>

                <Field label="Contact name">
                  <input
                    value={opportunity.contact_name ?? ""}
                    onChange={(event) => updateField("contact_name", event.target.value || null)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  />
                </Field>

                <Field label="Stage">
                  <select
                    value={opportunity.stage}
                    onChange={(event) => updateField("stage", event.target.value as OpportunityStage)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  >
                    {OPPORTUNITY_STAGES.map((stage) => (
                      <option key={stage} value={stage}>
                        {getOpportunityStageLabel(stage)}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Urgency">
                  <select
                    value={opportunity.urgency}
                    onChange={(event) => updateField("urgency", event.target.value as OpportunityUrgency)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  >
                    {OPPORTUNITY_URGENCY.map((urgency) => (
                      <option key={urgency} value={urgency}>
                        {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Location summary">
                  <input
                    value={opportunity.location_summary ?? ""}
                    onChange={(event) => updateField("location_summary", event.target.value || null)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  />
                </Field>

                <Field label="Follow-up date">
                  <input
                    type="date"
                    value={opportunity.follow_up_date ?? ""}
                    onChange={(event) => updateField("follow_up_date", event.target.value || null)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  />
                </Field>

                <Field label="Estimated value">
                  <input
                    value={opportunity.estimated_value ?? ""}
                    onChange={(event) => updateField("estimated_value", event.target.value || null)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  />
                </Field>

                <Field label="Estimated commission">
                  <input
                    value={opportunity.estimated_commission ?? ""}
                    onChange={(event) => updateField("estimated_commission", event.target.value || null)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  />
                </Field>
              </div>

              <div className="mt-4 grid gap-4">
                <Field label="Next action">
                  <input
                    value={opportunity.next_action ?? ""}
                    onChange={(event) => updateField("next_action", event.target.value || null)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  />
                </Field>

                <Field label="Description">
                  <textarea
                    value={opportunity.description ?? ""}
                    onChange={(event) => updateField("description", event.target.value || null)}
                    rows={4}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  />
                </Field>

                <Field label="Qualification notes">
                  <textarea
                    value={opportunity.qualification_notes ?? ""}
                    onChange={(event) => updateField("qualification_notes", event.target.value || null)}
                    rows={4}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-[26px] border border-slate-800 bg-slate-900/70 p-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-400" size={20} />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Acquisition Strategy</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">Checklist</h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {checklist.map((item) => {
                  const completed = completedChecklist.has(item.id);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => void toggleChecklistItem(item.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                        completed
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                          : "border-slate-800 bg-slate-950/60 text-slate-200 hover:border-yellow-500/30"
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="text-xs uppercase tracking-[0.18em]">{completed ? "Done" : "Open"}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[26px] border border-slate-800 bg-slate-900/70 p-6">
              <div className="flex items-center gap-3">
                <Target className="text-yellow-400" size={20} />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Opportunity Score</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">{intelligence.score.label}</h2>
                </div>
              </div>

              <div className={`mt-5 rounded-2xl border p-5 ${getScoreTone(intelligence.score.score)}`}>
                <p className="text-xs uppercase tracking-[0.18em] opacity-80">Score</p>
                <p className="mt-2 text-4xl font-bold">{intelligence.score.score}</p>
                <p className="mt-3 text-sm opacity-90">{intelligence.score.explanation}</p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoCard label="Type" value={getOpportunityTypeLabel(opportunity.opportunity_type)} />
                <InfoCard label="Stage" value={getOpportunityStageLabel(opportunity.stage)} />
                <InfoCard label="Commission" value={formatCurrency(opportunity.estimated_commission)} />
                <InfoCard label="Checklist" value={`${intelligence.completedChecklistCount}/${intelligence.totalChecklistCount}`} />
              </div>
            </section>

            <section className="rounded-[26px] border border-slate-800 bg-slate-900/70 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Rule-based Recommendation</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{intelligence.recommendation.title}</h2>
              <p className="mt-3 text-sm text-slate-300">{intelligence.recommendation.description}</p>

              {opportunity.next_action ? (
                <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Next recorded action</p>
                  <p className="mt-2 text-sm text-white">{opportunity.next_action}</p>
                </div>
              ) : null}

              {opportunity.converted_project_id ? (
                <Link
                  href={`/projects/${opportunity.converted_project_id}`}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-yellow-300 transition hover:text-yellow-200"
                >
                  Open converted project
                  <ArrowRight size={14} />
                </Link>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}