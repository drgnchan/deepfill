import * as vscode from "vscode";

/**
 * Extract up to `maxChars` of text before the cursor (the FIM prefix).
 * Walks backwards line by line so the result always starts at a line boundary.
 */
export function getPrefix(
  document: vscode.TextDocument,
  position: vscode.Position,
  maxChars: number
): string {
  let remaining = maxChars;
  const chunks: string[] = [];

  for (let line = position.line; line >= 0 && remaining > 0; line--) {
    const lineText = document.lineAt(line).text;
    const end = line === position.line ? position.character : lineText.length;
    let segment = lineText.substring(0, end);
    if (line !== position.line) {
      segment += "\n";
    }
    if (segment.length > remaining) {
      segment = segment.slice(segment.length - remaining);
    }
    chunks.unshift(segment);
    remaining -= segment.length;
  }

  return chunks.join("");
}

/**
 * Extract up to `maxChars` of text after the cursor (the FIM suffix).
 */
export function getSuffix(
  document: vscode.TextDocument,
  position: vscode.Position,
  maxChars: number
): string {
  let remaining = maxChars;
  const chunks: string[] = [];
  const lineCount = document.lineCount;

  for (let line = position.line; line < lineCount && remaining > 0; line++) {
    const lineText = document.lineAt(line).text;
    const start = line === position.line ? position.character : 0;
    let segment = lineText.substring(start);
    if (line !== position.line) {
      segment = "\n" + segment;
    }
    if (segment.length > remaining) {
      segment = segment.slice(0, remaining);
    }
    chunks.push(segment);
    remaining -= segment.length;
  }

  return chunks.join("");
}
