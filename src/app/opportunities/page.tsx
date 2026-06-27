"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Target, TrendingUp } from "lucide-react";
import {
  OPPORTUNITY_STAGES,
  OPPORTUNITY_TYPES,
  buildOpportunityIntelligence,
  getOpportunityStageLabel,
  getOpportunityTypeLabel,
  type OpportunityRecord,
  type OpportunityStage,
  type OpportunityType,
} from "@/lib/opportunityIntelligence";

type CreateOpportunityForm = {
  title: string;
  opportunityType: OpportunityType;
  contactName: string;
  locationSummary: string;
  description: string;
  estimatedValue: string;
  estimatedCommission: string;
  nextAction: string;
  followUpDate: string;
  qualificationNotes: string;
};

const DEFAULT_FORM: CreateOpportunityForm = {
  title: "",
  opportunityType: "buyer_request",
  contactName: "",
  locationSummary: "",
  description: "",
  estimatedValue: "",
  estimatedCommission: "",
  nextAction: "",
  followUpDate: "",
  qualificationNotes: "",
};

function getPriorityPillClass(score: number) {
  if (score >= 75) {
    return "border-red-500/30 bg-red-500/10 text-red-200";
  }

  if (score >= 50) {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-200";
  }

  if (score >= 25) {
    return "border-blue-500/30 bg-blue-500/10 text-blue-200";
  }

  return "border-slate-700 bg-slate-900 text-slate-300";
}

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

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<OpportunityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<OpportunityStage | "all">("all");
  const [typeFilter, setTypeFilter] = useState<OpportunityType | "all">("all");
  const [form, setForm] = useState<CreateOpportunityForm>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadOpportunities() {
    setLoading(true);

    const response = await fetch("/api/opportunities", { cache: "no-store" });
    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setFormError(result.error || "Failed to load opportunities.");
      return;
    }

    setOpportunities((result.opportunities ?? []) as OpportunityRecord[]);
  }

  useEffect(() => {
    void loadOpportunities();
  }, []);

  const filteredOpportunities = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return opportunities.filter((opportunity) => {
      if (stageFilter !== "all" && opportunity.stage !== stageFilter) {
        return false;
      }

      if (typeFilter !== "all" && opportunity.opportunity_type !== typeFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        opportunity.title,
        opportunity.contact_name,
        opportunity.location_summary,
        opportunity.description,
        opportunity.next_action,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [opportunities, search, stageFilter, typeFilter]);

  const activeCount = opportunities.filter(
    (opportunity) => !["converted", "closed_lost", "on_hold"].includes(opportunity.stage)
  ).length;
  const highPriorityCount = opportunities.filter(
    (opportunity) => buildOpportunityIntelligence(opportunity).isHighPriority
  ).length;

  async function createOpportunity() {
    if (!form.title.trim()) {
      setFormError("Opportunity title is required.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const response = await fetch("/api/opportunities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: form.title,
        opportunityType: form.opportunityType,
        contactName: form.contactName,
        locationSummary: form.locationSummary,
        description: form.description,
        estimatedValue: form.estimatedValue || null,
        estimatedCommission: form.estimatedCommission || null,
        nextAction: form.nextAction,
        followUpDate: form.followUpDate || null,
        qualificationNotes: form.qualificationNotes,
      }),
    });

    const result = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setFormError(result.error || "Failed to create opportunity.");
      return;
    }

    setOpportunities((current) => [result.opportunity as OpportunityRecord, ...current]);
    setForm(DEFAULT_FORM);
  }

  return (
    <section className="min-h-screen p-6 md:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)] md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-yellow-400/80">Pipeline</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">Opportunity Hub</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-400 md:text-base">
                Capture buyer requests, new listings, matches, and follow-ups in one working pipeline Almond can use tomorrow.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
              <SummaryTile label="Active Opportunities" value={activeCount} icon={<Target size={18} />} />
              <SummaryTile label="High Priority" value={highPriorityCount} icon={<TrendingUp size={18} />} />
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_1.7fr]">
          <section className="rounded-[26px] border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">New Opportunity</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Capture it now</h2>
              </div>
              <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-yellow-200">
                <Plus size={18} />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm text-slate-300">Title</span>
                <input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Example: Buyer needs 8-acre agricultural land near Kuching"
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm text-slate-300">Type</span>
                  <select
                    value={form.opportunityType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        opportunityType: event.target.value as OpportunityType,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  >
                    {OPPORTUNITY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {getOpportunityTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm text-slate-300">Follow-up date</span>
                  <input
                    type="date"
                    value={form.followUpDate}
                    onChange={(event) => setForm((current) => ({ ...current, followUpDate: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm text-slate-300">Contact name</span>
                  <input
                    value={form.contactName}
                    onChange={(event) => setForm((current) => ({ ...current, contactName: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-slate-300">Location summary</span>
                  <input
                    value={form.locationSummary}
                    onChange={(event) => setForm((current) => ({ ...current, locationSummary: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm text-slate-300">Estimated value</span>
                  <input
                    value={form.estimatedValue}
                    onChange={(event) => setForm((current) => ({ ...current, estimatedValue: event.target.value }))}
                    placeholder="1500000"
                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-slate-300">Estimated commission</span>
                  <input
                    value={form.estimatedCommission}
                    onChange={(event) => setForm((current) => ({ ...current, estimatedCommission: event.target.value }))}
                    placeholder="45000"
                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm text-slate-300">Next action</span>
                <input
                  value={form.nextAction}
                  onChange={(event) => setForm((current) => ({ ...current, nextAction: event.target.value }))}
                  placeholder="Call buyer to confirm budget and location"
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">Qualification notes</span>
                <textarea
                  value={form.qualificationNotes}
                  onChange={(event) => setForm((current) => ({ ...current, qualificationNotes: event.target.value }))}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                />
              </label>

              {formError ? <p className="text-sm text-red-300">{formError}</p> : null}

              <button
                type="button"
                onClick={createOpportunity}
                disabled={submitting}
                className="w-full rounded-2xl bg-yellow-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Creating..." : "Create Opportunity"}
              </button>
            </div>
          </section>

          <section className="rounded-[26px] border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Pipeline View</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Current opportunities</h2>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-300">
                  <Search size={18} className="text-slate-500" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search..."
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </label>

                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value as OpportunityType | "all")}
                  className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="all">All types</option>
                  {OPPORTUNITY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {getOpportunityTypeLabel(type)}
                    </option>
                  ))}
                </select>

                <select
                  value={stageFilter}
                  onChange={(event) => setStageFilter(event.target.value as OpportunityStage | "all")}
                  className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="all">All stages</option>
                  {OPPORTUNITY_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {getOpportunityStageLabel(stage)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {loading ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-400">
                  Loading opportunities...
                </div>
              ) : filteredOpportunities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-5 text-sm text-slate-400">
                  No opportunities match the current filters.
                </div>
              ) : (
                filteredOpportunities.map((opportunity) => {
                  const intelligence = buildOpportunityIntelligence(opportunity);

                  return (
                    <Link
                      key={opportunity.id}
                      href={`/opportunities/${opportunity.id}`}
                      className="block rounded-2xl border border-slate-800 bg-slate-950/60 p-5 transition hover:border-yellow-500/30 hover:bg-slate-950"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                              {getOpportunityTypeLabel(opportunity.opportunity_type)}
                            </span>
                            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                              {getOpportunityStageLabel(opportunity.stage)}
                            </span>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getPriorityPillClass(intelligence.score.score)}`}>
                              {intelligence.score.label}
                            </span>
                          </div>

                          <h3 className="mt-4 text-xl font-semibold text-white">{opportunity.title}</h3>
                          <p className="mt-2 text-sm text-slate-400">
                            {opportunity.location_summary || opportunity.contact_name || "No location or contact added yet."}
                          </p>
                          <p className="mt-3 text-sm text-slate-300">{intelligence.recommendation.title}</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 lg:w-[330px]">
                          <MiniMetric label="Score" value={String(intelligence.score.score)} />
                          <MiniMetric label="Commission" value={formatCurrency(opportunity.estimated_commission)} />
                          <MiniMetric label="Follow-up" value={opportunity.follow_up_date || "Not set"} />
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function SummaryTile({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex items-center justify-between gap-3 text-slate-400">
        <p className="text-xs uppercase tracking-[0.2em]">{label}</p>
        <span className="text-yellow-300">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}