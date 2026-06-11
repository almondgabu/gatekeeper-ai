import { initializeDatabase } from "@/lib/initDatabase";

export async function GET() {
  await initializeDatabase();

  return Response.json({
    success: true,
    message: "Database initialized successfully.",
  });
}