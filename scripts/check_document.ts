import fs from "fs";
import path from "path";
// load env from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, "utf8");
  raw.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  });
}

import { createClient } from "@supabase/supabase-js";

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error("Usage: ts-node scripts/check_document.ts <documentId>");
    process.exit(1);
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );

  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Supabase error:", error);
    process.exit(2);
  }

  if (!data) {
    console.log("Document not found");
    process.exit(0);
  }

  console.log(JSON.stringify(data, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(3);
});
