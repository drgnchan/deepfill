import * as vscode from "vscode";

type Status = "ready" | "loading" | "disabled" | "error";

export class DeepFillStatus implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem;
  private state: Status = "ready";

  constructor() {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.item.command = "deepfill.toggle";
    this.render("ready");
    this.item.show();
  }

  ready(): void {
    this.render("ready");
  }

  loading(): void {
    this.render("loading");
  }

  disabled(): void {
    this.render("disabled");
  }

  error(err: unknown): void {
    const message = err instanceof Error ? err.message : String(err);
    this.item.tooltip = `DeepFill: ${message}`;
    this.item.color = new vscode.ThemeColor(
      "statusBarItem.errorForeground"
    );
    this.item.text = "$(error) DeepFill";
    this.state = "error";
  }

  dispose(): void {
    this.item.dispose();
  }

  private render(state: Status): void {
    this.state = state;
    switch (state) {
      case "ready":
        this.item.text = "$(sparkle) DeepFill";
        this.item.tooltip = "DeepFill enabled — click to toggle";
        this.item.color = undefined;
        break;
      case "loading":
        this.item.text = "$(sync~spin) DeepFill";
        this.item.tooltip = "DeepFill: requesting completion…";
        this.item.color = undefined;
        break;
      case "disabled":
        this.item.text = "$(circle-slash) DeepFill";
        this.item.tooltip = "DeepFill disabled — click to toggle";
        this.item.color = new vscode.ThemeColor(
          "statusBarItem.warningForeground"
        );
        break;
      case "error":
        // handled by error(); kept for completeness
        break;
    }
  }
}
