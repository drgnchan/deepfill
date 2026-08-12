export interface FimRequest {
  baseUrl: string;
  apiKey: string;
  model: string;
  prompt: string;
  suffix: string;
  maxTokens: number;
  temperature: number;
}

interface FimResponse {
  choices?: Array<{ text?: string }>;
}

/**
 * Call the DeepSeek FIM completion endpoint:
 *   POST {baseUrl}/completions
 * See https://api-docs.deepseek.com/zh-cn/guides/fim_completion
 */
export async function fimComplete(
  req: FimRequest,
  signal?: AbortSignal
): Promise<string> {
  const baseUrl = req.baseUrl.replace(/\/+$/, "");
  const body = {
    model: req.model,
    prompt: req.prompt,
    suffix: req.suffix,
    max_tokens: req.maxTokens,
    temperature: req.temperature,
    stream: false,
  };

  const response = await fetch(`${baseUrl}/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${req.apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    throw new Error(`DeepSeek API error ${response.status}: ${detail}`);
  }

  const data = (await response.json()) as FimResponse;
  const text = data.choices?.[0]?.text;
  if (typeof text !== "string") {
    throw new Error("Unexpected DeepSeek API response: no choices[0].text");
  }
  return text;
}
