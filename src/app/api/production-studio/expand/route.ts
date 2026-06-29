import { NextResponse } from "next/server";
import { ProductionWorkspaceProject } from "@/types/production-studio";

export const runtime = "nodejs";

type ExpansionResponse = Pick<ProductionWorkspaceProject, "contentBlocks" | "status" | "updatedAt">;

function isProjectPayload(value: unknown): value is ProductionWorkspaceProject {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<ProductionWorkspaceProject>;
  return (
    typeof payload.id === "string" &&
    typeof payload.name === "string" &&
    typeof payload.description === "string" &&
    typeof payload.updatedAt === "string" &&
    Array.isArray(payload.contentBlocks)
  );
}

function buildDeterministicBlocks(
  project: ProductionWorkspaceProject,
  now: string,
): ProductionWorkspaceProject["contentBlocks"] {
  if (project.contentBlocks.length > 0) {
    return project.contentBlocks.map((block) => ({
      ...block,
      content: block.content.trim() || `Expand ${block.type} for ${project.name}.`,
      updatedAt: now,
    }));
  }

  const heading = project.sourceMetadata?.hook || project.name;
  const concept = project.sourceMetadata?.coreConcept || project.description;
  const cta = project.sourceMetadata?.suggestedCTA || "Invite the audience to take the next step.";

  return [
    {
      id: `${project.id}-block-heading`,
      type: "heading",
      content: heading,
      order: 1,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `${project.id}-block-main`,
      type: "paragraph",
      content: `${concept}\n\nTarget audience: ${project.targetAudience}.`,
      order: 2,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `${project.id}-block-cta`,
      type: "callout",
      content: cta,
      order: 3,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!isProjectPayload(payload)) {
      return NextResponse.json({ error: "Invalid production workspace payload." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const response: ExpansionResponse = {
      contentBlocks: buildDeterministicBlocks(payload, now),
      status: "in_production",
      updatedAt: now,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[production-studio/expand] failed", error);
    return NextResponse.json({ error: "Failed to expand production workspace." }, { status: 500 });
  }
}
