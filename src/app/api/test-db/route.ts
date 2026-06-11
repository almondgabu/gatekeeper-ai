import { getDatabase } from "@/lib/database";

export async function GET() {
  const db = await getDatabase();

  await db.run(`
    INSERT INTO projects (name)
    VALUES ('Dream World Resort');
  `);

  const projects = await db.all(`
    SELECT * FROM projects;
  `);

  return Response.json(projects);
}