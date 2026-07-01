import Anthropic from "@anthropic-ai/sdk";

// A free-text, custom-system-prompt chat completion — distinct from
// adjudicator.ts's callLLM(), which hard-codes the adjudication system prompt
// and forces JSON-mode output on every provider. This is the general-purpose
// "ask the configured provider a question, get plain text back" path used by
// portfolio Q&A (and could replace /api/chat's inline Claude-only branch later).
export async function chatCompletion(
  kind: string,
  cfg: any,
  system: string,
  userPrompt: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
  maxTokens = 800
): Promise<string> {
  const recent = history.slice(-6);
  switch (kind) {
    case "claude": {
      const client = new Anthropic({ apiKey: cfg.apiKey || process.env.ANTHROPIC_API_KEY });
      const res = await client.messages.create({
        model: cfg.model || "claude-haiku-4-5-20251001",
        max_tokens: maxTokens,
        temperature: 0.2,
        system,
        messages: [...recent, { role: "user", content: userPrompt }],
      });
      return ((res.content.find((b) => b.type === "text") as any)?.text ?? "").trim();
    }
    case "openai":
    case "grok": {
      const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
        body: JSON.stringify({
          model: cfg.model,
          temperature: 0.2,
          max_tokens: maxTokens,
          messages: [{ role: "system", content: system }, ...recent, { role: "user", content: userPrompt }],
        }),
      });
      const j = await res.json();
      return (j.choices?.[0]?.message?.content ?? "").trim();
    }
    case "gemini": {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${cfg.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [
              ...recent.map((h) => ({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: h.content }] })),
              { role: "user", parts: [{ text: userPrompt }] },
            ],
            generationConfig: { temperature: 0.2, maxOutputTokens: maxTokens },
          }),
        }
      );
      const j = await res.json();
      return (j.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
    }
    case "ollama": {
      const res = await fetch(`${cfg.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: cfg.model,
          stream: false,
          options: { temperature: 0.2, num_predict: maxTokens },
          messages: [{ role: "system", content: system }, ...recent, { role: "user", content: userPrompt }],
        }),
      });
      const j = await res.json();
      return (j.message?.content ?? "").trim();
    }
    case "claudecode": {
      const { execFile } = await import("child_process");
      return new Promise((resolve, reject) => {
        execFile(
          "claude",
          ["-p", `${system}\n\n${userPrompt}`, "--model", cfg.model || "sonnet"],
          { timeout: 60000, maxBuffer: 1024 * 1024 },
          (err, stdout) => {
            if (err) reject(err);
            else resolve((stdout || "").trim());
          }
        );
      });
    }
    default:
      throw new Error(`unknown engine ${kind}`);
  }
}
