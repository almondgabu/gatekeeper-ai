import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  const models = await openai.models.list();

  const ids = models.data
    .map((m) => m.id)
    .sort();

  console.log(ids.join("\n"));
}

main();
