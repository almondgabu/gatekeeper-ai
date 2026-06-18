import { NextResponse } from "next/server";
import { storeAndIngestDocument } from "@/lib/storeDocument";

export const runtime = "nodejs";

const ALLOWED_PREFIXES = [
  "https://chatgpt.com/share/",
  "https://chat.openai.com/share/",
];

const EXTRACTION_ERROR =
  "Could not extract readable text from this shared link. Please copy the conversation manually and upload as .md.";

function decodeHtmlEntities(input: string) {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(parseInt(decimal, 10)));
}

function extractTagContent(html: string, tagName: string) {
  const match = html.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, "i"));
  return match ? decodeHtmlEntities(match[1]).replace(/\s+/g, " ").trim() : "";
}

function extractReadableText(html: string) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const rawBody = bodyMatch ? bodyMatch[1] : html;
  const withoutNonContent = rawBody
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  const decoded = decodeHtmlEntities(withoutNonContent)
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/ +\n/g, "\n")
    .replace(/\n +/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \f\v]{2,}/g, " ")
    .trim();

  return decoded;
}

function toMarkdown(title: string, url: string, extractedText: string) {
  return [
    `# ${title}`,
    `Source URL: ${url}`,
    `Imported At: ${new Date().toISOString()}`,
    "",
    extractedText,
  ].join("\n");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const projectId = typeof body?.projectId === "string" && body.projectId.trim() ? body.projectId.trim() : null;

    if (!url || !ALLOWED_PREFIXES.some((prefix) => url.startsWith(prefix))) {
      return NextResponse.json(
        { error: "URL must start with https://chatgpt.com/share/ or https://chat.openai.com/share/." },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "GatekeeperAI/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch shared link (${response.status}).` },
        { status: 400 }
      );
    }

    const html = await response.text();
    const pageTitle = extractTagContent(html, "title");
    const extractedText = extractReadableText(html);

    if (!extractedText || extractedText.length < 80) {
      return NextResponse.json({ error: EXTRACTION_ERROR }, { status: 400 });
    }

    const markdown = toMarkdown(title || pageTitle || "Imported ChatGPT Conversation", url, extractedText);
    const buffer = Buffer.from(markdown, "utf8");
    const filename = `${title.replace(/[^a-zA-Z0-9._-]+/g, "-") || "imported-chatgpt-link"}.md`;

    const result = await storeAndIngestDocument({
      buffer,
      filename,
      mimeType: "text/markdown",
      projectId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}