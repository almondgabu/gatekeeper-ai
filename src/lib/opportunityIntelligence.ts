export const OPPORTUNITY_TYPES = [
  "buyer_request",
  "new_listing",
  "match_opportunity",
  "follow_up",
] as const;

export const OPPORTUNITY_STAGES = [
  "new",
  "contacted",
  "qualified",
  "searching_owner",
  "negotiating",
  "converted",
  "closed_lost",
  "on_hold",
] as const;

export const OPPORTUNITY_URGENCY = ["low", "medium", "high", "urgent"] as const;

export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];
export type OpportunityUrgency = (typeof OPPORTUNITY_URGENCY)[number];
export type OpportunityPriorityBand = "high" | "active" | "warm" | "low";

export type OpportunityRecord = {
  id: string;
  title: string;
  opportunity_type: OpportunityType;
  stage: OpportunityStage;
  contact_name: string | null;
  location_summary: string | null;
  description: string | null;
  estimated_value: number | string | null;
  estimated_commission: number | string | null;
  urgency: OpportunityUrgency;
  next_action: string | null;
  follow_up_date: string | null;
  qualification_notes: string | null;
  checklist_completed: string[] | null;
  converted_project_id: string | null;
  created_at: string;
  updated_at: string;
};

export type OpportunityMetric = {
  score: number;
  label: string;
  explanation: string;
};

export type OpportunityRecommendation = {
  key:
    | "follow-up-now"
    | "capture-contact"
    | "qualify-buyer"
    | "verify-listing"
    | "advance-match"
    | "define-next-step"
    | "convert-to-project"
    | "maintain-momentum"
    | "wait"
    | "closed";
  title: string;
  description: string;
  actionLabel: string;
};

export type OpportunityChecklistItem = {
  id: string;
  label: string;
};

export type OpportunityIntelligenceResult = {
  score: OpportunityMetric;
  recommendation: OpportunityRecommendation;
  checklist: OpportunityChecklistItem[];
  completedChecklistCount: number;
  totalChecklistCount: number;
  priorityBand: OpportunityPriorityBand;
  isActive: boolean;
  isHighPriority: boolean;
  estimatedCommission: number;
};

export type OpportunityDashboardSummary = {
  activeOpportunities: number;
  highPriorityOpportunities: number;
  potentialCommission: number;
  bestOpportunityToday: {
    id: string;
    title: string;
    opportunityType: OpportunityType;
    stage: OpportunityStage;
    score: number;
    priorityBand: OpportunityPriorityBand;
    recommendation: string;
    nextAction: string | null;
    estimatedCommission: number;
    followUpDate: string | null;
  } | null;
};

const TYPE_LABELS: Record<OpportunityType, string> = {
  buyer_request: "Buyer Request",
  new_listing: "New Listing",
  match_opportunity: "Match Opportunity",
  follow_up: "Follow-up",
};

const STAGE_LABELS: Record<OpportunityStage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  searching_owner: "Searching Owner",
  negotiating: "Negotiating",
  converted: "Converted",
  closed_lost: "Closed Lost",
  on_hold: "On Hold",
};

const CHECKLIST_BY_TYPE: Record<OpportunityType, OpportunityChecklistItem[]> = {
  buyer_request: [
    { id: "buyer-location", label: "Confirm target location or area" },
    { id: "buyer-budget", label: "Confirm budget or price range" },
    { id: "buyer-timeline", label: "Confirm purchase timeline" },
    { id: "buyer-funding", label: "Confirm funding readiness" },
    { id: "buyer-use-case", label: "Confirm intended land or property use" },
  ],
  new_listing: [
    { id: "listing-authority", label: "Verify seller or broker authority" },
    { id: "listing-docs", label: "Confirm title and supporting documents" },
    { id: "listing-price", label: "Confirm asking price or price expectation" },
    { id: "listing-facts", label: "Capture key property facts" },
    { id: "listing-commission", label: "Confirm commission or exclusivity basis" },
  ],
  match_opportunity: [
    { id: "match-fit", label: "Confirm buyer and listing fit" },
    { id: "match-availability", label: "Confirm availability is still live" },
    { id: "match-price", label: "Confirm price alignment" },
    { id: "match-intro", label: "Plan buyer and seller introduction" },
    { id: "match-next-step", label: "Define viewing or offer path" },
  ],
  follow_up: [
    { id: "followup-refresh", label: "Refresh current need or interest" },
    { id: "followup-status", label: "Confirm availability or buyer status" },
    { id: "followup-price", label: "Update price, terms, or scope" },
    { id: "followup-call", label: "Set the next call or message" },
    { id: "followup-disposition", label: "Decide whether to convert or close" },
  ],
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function getDaysUntil(dateValue: string | null, now: Date) {
  if (!dateValue) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = Date.parse(dateValue);

  if (!Number.isFinite(timestamp)) {
    return Number.POSITIVE_INFINITY;
  }

  return (timestamp - now.getTime()) / (1000 * 60 * 60 * 24);
}

function getTypeWeight(type: OpportunityType) {
  switch (type) {
    case "match_opportunity":
      return 28;
    case "new_listing":
      return 22;
    case "buyer_request":
      return 18;
    case "follow_up":
      return 14;
  }
}

function getStageWeight(stage: OpportunityStage) {
  switch (stage) {
    case "negotiating":
      return 26;
    case "qualified":
      return 20;
    case "searching_owner":
      return 16;
    case "contacted":
      return 10;
    case "new":
      return 6;
    case "on_hold":
      return -18;
    case "closed_lost":
      return -40;
    case "converted":
      return -30;
  }
}

function getUrgencyWeight(urgency: OpportunityUrgency) {
  switch (urgency) {
    case "urgent":
      return 20;
    case "high":
      return 14;
    case "medium":
      return 8;
    case "low":
      return 2;
  }
}

function getPriorityBand(score: number): OpportunityPriorityBand {
  if (score >= 75) {
    return "high";
  }

  if (score >= 50) {
    return "active";
  }

  if (score >= 25) {
    return "warm";
  }

  return "low";
}

function isActiveStage(stage: OpportunityStage) {
  return !["converted", "closed_lost"].includes(stage);
}

export function getOpportunityTypeLabel(type: OpportunityType) {
  return TYPE_LABELS[type];
}

export function getOpportunityStageLabel(stage: OpportunityStage) {
  return STAGE_LABELS[stage];
}

export function getOpportunityChecklist(type: OpportunityType) {
  return CHECKLIST_BY_TYPE[type];
}

export function buildOpportunityIntelligence(opportunity: OpportunityRecord, now = new Date()): OpportunityIntelligenceResult {
  const completedChecklist = new Set(opportunity.checklist_completed ?? []);
  const checklist = getOpportunityChecklist(opportunity.opportunity_type);
  const completedChecklistCount = checklist.filter((item) => completedChecklist.has(item.id)).length;
  const totalChecklistCount = checklist.length;
  const estimatedCommission = normalizeNumber(opportunity.estimated_commission);
  const estimatedValue = normalizeNumber(opportunity.estimated_value);
  const daysUntilFollowUp = getDaysUntil(opportunity.follow_up_date, now);
  const active = isActiveStage(opportunity.stage);

  let scoreValue = 0;
  scoreValue += getTypeWeight(opportunity.opportunity_type);
  scoreValue += getStageWeight(opportunity.stage);
  scoreValue += getUrgencyWeight(opportunity.urgency);
  scoreValue += hasText(opportunity.contact_name) ? 5 : 0;
  scoreValue += hasText(opportunity.location_summary) ? 5 : 0;
  scoreValue += hasText(opportunity.description) ? 6 : 0;
  scoreValue += hasText(opportunity.next_action) ? 7 : -8;
  scoreValue += hasText(opportunity.qualification_notes) ? 6 : 0;
  scoreValue += opportunity.follow_up_date ? 5 : 0;
  scoreValue += estimatedValue > 0 ? 5 : 0;
  scoreValue += estimatedCommission > 0 ? 7 : 0;
  scoreValue += Math.min(12, completedChecklistCount * 2);

  if (daysUntilFollowUp < 0) {
    scoreValue += 12;
  } else if (daysUntilFollowUp <= 1) {
    scoreValue += 8;
  } else if (daysUntilFollowUp <= 3) {
    scoreValue += 4;
  }

  if (opportunity.stage === "on_hold") {
    scoreValue -= 8;
  }

  if (!active) {
    scoreValue = Math.min(scoreValue, 18);
  }

  const score = clampScore(scoreValue);
  const priorityBand = getPriorityBand(score);
  const isHighPriority = active && score >= 75;

  let label = "Low";
  let explanation = "This opportunity is early or weakly qualified and does not need immediate action yet.";

  if (!active) {
    label = opportunity.stage === "converted" ? "Converted" : opportunity.stage === "closed_lost" ? "Closed Lost" : "On Hold";
    explanation = "This opportunity is not currently in the active pipeline, so it should not compete with active work.";
  } else if (score >= 75) {
    label = "High Priority";
    explanation = "This opportunity has strong qualification or urgency signals and should be worked now.";
  } else if (score >= 50) {
    label = "Active";
    explanation = "This opportunity is real and progressing, but it still needs a few steps before it becomes top priority.";
  } else if (score >= 25) {
    label = "Warm";
    explanation = "This opportunity has some potential but still lacks enough signal or follow-through to rank near the top.";
  }

  let recommendation: OpportunityRecommendation;

  if (opportunity.stage === "converted") {
    recommendation = {
      key: "closed",
      title: "Work this inside the project workspace",
      description: "This opportunity has already been converted, so follow-through should now happen inside the project workspace.",
      actionLabel: "Open Project",
    };
  } else if (opportunity.stage === "closed_lost") {
    recommendation = {
      key: "closed",
      title: "Keep for reference only",
      description: "The opportunity is closed lost, so only retain key notes in case it becomes relevant again later.",
      actionLabel: "Review Notes",
    };
  } else if (opportunity.stage === "on_hold") {
    recommendation = {
      key: "wait",
      title: "Hold and schedule the next check-in",
      description: "This opportunity is on hold. Keep a clear follow-up date so it can re-enter the pipeline at the right time.",
      actionLabel: "Set Follow-up",
    };
  } else if (daysUntilFollowUp < 0) {
    recommendation = {
      key: "follow-up-now",
      title: "Follow up today",
      description: "The follow-up date has passed, so the next action should be immediate contact or a clear status update.",
      actionLabel: "Follow Up",
    };
  } else if (!hasText(opportunity.contact_name)) {
    recommendation = {
      key: "capture-contact",
      title: "Capture the decision-maker contact",
      description: "The opportunity still lacks a usable contact, which limits follow-through and qualification.",
      actionLabel: "Add Contact",
    };
  } else if (opportunity.opportunity_type === "buyer_request" && !hasText(opportunity.qualification_notes)) {
    recommendation = {
      key: "qualify-buyer",
      title: "Qualify the buyer request",
      description: "Capture budget, timeline, funding, and intended use before spending more time searching.",
      actionLabel: "Qualify Buyer",
    };
  } else if (opportunity.opportunity_type === "new_listing" && (!hasText(opportunity.qualification_notes) || estimatedValue <= 0)) {
    recommendation = {
      key: "verify-listing",
      title: "Verify listing authority and pricing",
      description: "Confirm seller authority, supporting documents, and the expected price before pushing the listing forward.",
      actionLabel: "Verify Listing",
    };
  } else if (opportunity.opportunity_type === "match_opportunity") {
    recommendation = {
      key: "advance-match",
      title: "Advance the match",
      description: "This is already a match opportunity, so the next step should move toward an introduction, viewing, or offer path.",
      actionLabel: "Advance Match",
    };
  } else if (!hasText(opportunity.next_action)) {
    recommendation = {
      key: "define-next-step",
      title: "Define the next concrete step",
      description: "The opportunity needs one explicit next action so Almond can follow through without ambiguity.",
      actionLabel: "Set Next Action",
    };
  } else if (score >= 82 && ["qualified", "negotiating"].includes(opportunity.stage)) {
    recommendation = {
      key: "convert-to-project",
      title: "Convert this into a project",
      description: "The opportunity is qualified enough that structured project work is likely more useful than keeping it only in the pipeline.",
      actionLabel: "Convert To Project",
    };
  } else {
    recommendation = {
      key: "maintain-momentum",
      title: "Maintain momentum with the current next step",
      description: "The opportunity already has a usable next action. The priority is disciplined follow-through rather than re-qualification.",
      actionLabel: "Review Opportunity",
    };
  }

  return {
    score: {
      score,
      label,
      explanation,
    },
    recommendation,
    checklist,
    completedChecklistCount,
    totalChecklistCount,
    priorityBand,
    isActive: active,
    isHighPriority,
    estimatedCommission,
  };
}

export function buildOpportunityDashboardSummary(opportunities: OpportunityRecord[], now = new Date()): OpportunityDashboardSummary {
  const evaluated = opportunities.map((opportunity) => ({
    opportunity,
    intelligence: buildOpportunityIntelligence(opportunity, now),
  }));

  const activeItems = evaluated.filter((item) => item.intelligence.isActive && item.opportunity.stage !== "on_hold");
  const activeOpportunities = activeItems.length;
  const highPriorityOpportunities = activeItems.filter((item) => item.intelligence.isHighPriority).length;
  const potentialCommission = activeItems.reduce((total, item) => total + item.intelligence.estimatedCommission, 0);

  const bestOpportunity = [...activeItems].sort((left, right) => {
    if (right.intelligence.score.score !== left.intelligence.score.score) {
      return right.intelligence.score.score - left.intelligence.score.score;
    }

    const leftDays = getDaysUntil(left.opportunity.follow_up_date, now);
    const rightDays = getDaysUntil(right.opportunity.follow_up_date, now);

    const leftOverdue = leftDays < 0 ? 1 : 0;
    const rightOverdue = rightDays < 0 ? 1 : 0;

    if (leftOverdue !== rightOverdue) {
      return rightOverdue - leftOverdue;
    }

    if (leftDays !== rightDays) {
      return leftDays - rightDays;
    }

    return new Date(right.opportunity.updated_at).getTime() - new Date(left.opportunity.updated_at).getTime();
  })[0] ?? null;

  return {
    activeOpportunities,
    highPriorityOpportunities,
    potentialCommission,
    bestOpportunityToday: bestOpportunity
      ? {
          id: bestOpportunity.opportunity.id,
          title: bestOpportunity.opportunity.title,
          opportunityType: bestOpportunity.opportunity.opportunity_type,
          stage: bestOpportunity.opportunity.stage,
          score: bestOpportunity.intelligence.score.score,
          priorityBand: bestOpportunity.intelligence.priorityBand,
          recommendation: bestOpportunity.intelligence.recommendation.title,
          nextAction: bestOpportunity.opportunity.next_action,
          estimatedCommission: bestOpportunity.intelligence.estimatedCommission,
          followUpDate: bestOpportunity.opportunity.follow_up_date,
        }
      : null,
  };
}