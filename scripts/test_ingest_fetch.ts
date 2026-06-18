const documentId = "4edd0e30-2c14-4f45-8fb0-e538cd006164";

async function main() {
  const response = await fetch("http://localhost:3000/api/vault/ingest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ documentId }),
  });

  const text = await response.text();

  console.log("STATUS:", response.status);
  console.log("BODY:", text);
}

main().catch(console.error);
