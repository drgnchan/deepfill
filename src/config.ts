import * as vscode from "vscode";

export interface DeepFillConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  prefixLength: number;
  suffixLength: number;
  debounceMs: number;
  enabled: boolean;
}

export const DEFAULT_BASE_URL = "https://api.deepseek.com/beta";
export const DEFAULT_MODEL = "deepseek-v4-pro";

export function getConfig(): DeepFillConfig {
  const cfg = vscode.workspace.getConfiguration("deepfill");
  return {
    apiKey: cfg.get<string>("apiKey", ""),
    baseUrl: cfg.get<string>("baseUrl", DEFAULT_BASE_URL),
    model: cfg.get<string>("model", DEFAULT_MODEL),
    maxTokens: cfg.get<number>("maxTokens", 256),
    temperature: cfg.get<number>("temperature", 0.2),
    prefixLength: cfg.get<number>("prefixLength", 4000),
    suffixLength: cfg.get<number>("suffixLength", 1024),
    debounceMs: cfg.get<number>("debounceMs", 300),
    enabled: cfg.get<boolean>("enabled", true),
  };
}
