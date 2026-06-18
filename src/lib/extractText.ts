import mammoth from "mammoth";
import { extractText as extractPdfText } from "unpdf";

export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    const result = await extractPdfText(new Uint8Array(buffer));
    return Array.isArray(result.text) ? result.text.join("\n") : result.text;
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  return buffer.toString("utf8");
}
