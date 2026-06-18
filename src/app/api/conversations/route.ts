import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectIdValue = searchParams.get("projectId");
  const projectId = typeof projectIdValue === "string" && projectIdValue.trim() ? projectIdValue.trim() : null;

  const query = projectId
    ? supabase.from("conversations").select("*").eq("project_id", projectId)
    : supabase.from("conversations").select("*").is("project_id", null);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return Response.json(data);
}