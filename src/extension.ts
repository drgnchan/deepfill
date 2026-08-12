import * as vscode from "vscode";
import { DeepFillProvider } from "./completionProvider";
import { getConfig } from "./config";
import { DeepFillStatus } from "./statusBar";

export function activate(context: vscode.ExtensionContext): void {
  const status = new DeepFillStatus();

  // API key resolution: secret storage first, settings as fallback.
  const getApiKey = async (): Promise<string> => {
    const stored = await context.secrets.get("deepfill.apiKey");
    if (stored) {
      return stored;
    }
    return getConfig().apiKey;
  };

  const provider = new DeepFillProvider(status, getApiKey);
  const registration = vscode.languages.registerInlineCompletionItemProvider(
    { pattern: "**" },
    provider
  );

  context.subscriptions.push(
    registration,
    status,
    vscode.commands.registerCommand("deepfill.trigger", () =>
      vscode.commands.executeCommand("editor.action.inlineSuggest.trigger")
    ),
    vscode.commands.registerCommand("deepfill.setApiKey", async () => {
      const key = await vscode.window.showInputBox({
        title: "DeepFill: Set DeepSeek API Key",
        prompt:
          "Enter your DeepSeek API key (https://platform.deepseek.com/api_keys)",
        password: true,
        ignoreFocusOut: true,
      });
      if (key !== undefined) {
        await context.secrets.store("deepfill.apiKey", key.trim());
        void vscode.window.showInformationMessage(
          "DeepFill: API key saved to secret storage."
        );
      }
    }),
    vscode.commands.registerCommand("deepfill.toggle", async () => {
      const cfg = vscode.workspace.getConfiguration("deepfill");
      const enabled = !cfg.get<boolean>("enabled", true);
      await cfg.update("enabled", enabled, vscode.ConfigurationTarget.Global);
      if (enabled) {
        status.ready();
      } else {
        status.disabled();
      }
      void vscode.window.showInformationMessage(
        `DeepFill: completions ${enabled ? "enabled" : "disabled"}.`
      );
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("deepfill")) {
        if (getConfig().enabled) {
          status.ready();
        } else {
          status.disabled();
        }
      }
    })
  );
}

export function deactivate(): void {}
