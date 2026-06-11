import { getDatabase } from "@/lib/database";

export async function GET() {
  const db = await getDatabase();

  const projects = await db.all(
    "SELECT * FROM projects ORDER BY id DESC"
  );

  return Response.json(projects);
}

export async function POST(request: Request) {
  const body = await request.json();

  const db = await getDatabase();

  await db.run(
    "INSERT INTO projects (name) VALUES (?)",
    [body.name]
  );

  return Response.json({
    success: true,
  });
}