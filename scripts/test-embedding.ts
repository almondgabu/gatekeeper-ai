import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: "Hello Gatekeeper AI",
  });

  console.log("SUCCESS");
  console.log(response.data[0].embedding.length);
}

main().catch(console.error);
