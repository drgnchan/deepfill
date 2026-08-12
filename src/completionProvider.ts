import * as vscode from "vscode";
import { fimComplete } from "./apiClient";
import { getConfig } from "./config";
import { getPrefix, getSuffix } from "./context";
import { DeepFillStatus } from "./statusBar";

export class DeepFillProvider implements vscode.InlineCompletionItemProvider {
  private currentController: AbortController | undefined;

  constructor(
    private readonly status: DeepFillStatus,
    private readonly getApiKey: () => Promise<string>
  ) {}

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionItem[]> {
    const cfg = getConfig();
    if (!cfg.enabled || token.isCancellationRequested) {
      return [];
    }

    const apiKey = await this.getApiKey();
    if (!apiKey) {
      return [];
    }

    // Debounce: rapid typing keeps cancelling the token, so the request
    // only fires after the user pauses.
    await delay(cfg.debounceMs, token);
    if (token.isCancellationRequested) {
      return [];
    }

    const prefix = getPrefix(document, position, cfg.prefixLength);
    if (!prefix.trim()) {
      return [];
    }
    const suffix = getSuffix(document, position, cfg.suffixLength);

    const controller = new AbortController();
    const cancelSub = token.onCancellationRequested(() =>
      controller.abort()
    );
    this.currentController?.abort();
    this.currentController = controller;

    this.status.loading();
    try {
      const completion = await fimComplete(
        {
          baseUrl: cfg.baseUrl,
          apiKey,
          model: cfg.model,
          prompt: prefix,
          suffix,
          maxTokens: cfg.maxTokens,
          temperature: cfg.temperature,
        },
        controller.signal
      );

      const text = cleanCompletion(completion, document, position);
      if (!text) {
        return [];
      }

      this.status.ready();
      const range = new vscode.Range(position, position);
      return [new vscode.InlineCompletionItem(text, range)];
    } catch (err) {
      if (controller.signal.aborted) {
        return [];
      }
      this.status.error(err);
      return [];
    } finally {
      cancelSub.dispose();
      if (this.currentController === controller) {
        this.currentController = undefined;
      }
    }
  }
}

/**
 * Post-process the model output before showing it as ghost text.
 */
function cleanCompletion(
  raw: string,
  document: vscode.TextDocument,
  position: vscode.Position
): string {
  let text = raw.replace(/\r\n/g, "\n");

  // If the cursor is already after whitespace, drop leading whitespace.
  const lineText = document.lineAt(position.line).text;
  const charBefore =
    position.character > 0
      ? lineText.charAt(position.character - 1)
      : "\n";
  if (/\s/.test(charBefore)) {
    text = text.replace(/^\s+/, "");
  }

  // Ghost text should not end with trailing whitespace/newlines.
  text = text.replace(/\s+$/, "");

  // The model may repeat the text that already follows the cursor.
  // Drop the overlapping tail so accepting the completion doesn't duplicate.
  const afterCursor = document.getText(
    new vscode.Range(position, document.positionAt(document.getText().length))
  );
  text = dropSuffixOverlap(text, afterCursor);

  return text.trim() ? text : "";
}

function dropSuffixOverlap(completion: string, afterCursor: string): string {
  if (!completion || !afterCursor) {
    return completion;
  }
  const max = Math.min(completion.length, afterCursor.length, 500);
  for (let i = max; i > 0; i--) {
    if (completion.endsWith(afterCursor.substring(0, i))) {
      return completion.substring(0, completion.length - i);
    }
  }
  return completion;
}

function delay(ms: number, token: vscode.CancellationToken): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    const sub = token.onCancellationRequested(() => {
      clearTimeout(timer);
      sub.dispose();
      resolve();
    });
  });
}
