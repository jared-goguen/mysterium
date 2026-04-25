/**
 * client.ts — Anthropic API wrapper
 *
 * Two calling modes:
 *   callTool()   — non-streaming, returns parsed tool result
 *   streamChat() — streaming, returns a ReadableStream of text deltas
 *
 * All engines use Haiku for speed and cost.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { Tool, MessageParam } from "@anthropic-ai/sdk/resources/messages";

export const MODELS = {
  /** Fast + cheap. For structured extraction: examiner, clue detector, summarizer. */
  fast: "claude-haiku-4-20250414",
  /** Quality roleplay + writing. For conversant and judge. */
  quality: "claude-sonnet-4-20250514",
} as const;

export type ModelTier = keyof typeof MODELS;

const DEFAULT_MAX_TOKENS = 1024;

export type { Tool, MessageParam };

/** Create an Anthropic client. API key from env or explicit. */
export function createClient(apiKey?: string): Anthropic {
  return new Anthropic({
    apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY,
  });
}

/**
 * Call Claude with a tool, expecting structured output.
 * Returns the parsed tool input (the JSON the model filled in).
 * Throws if the model doesn't use the tool.
 */
export async function callTool<T>(
  client: Anthropic,
  system: string,
  messages: MessageParam[],
  tool: Tool,
  tier: ModelTier = "fast",
): Promise<T> {
  const response = await client.messages.create({
    model: MODELS[tier],
    max_tokens: DEFAULT_MAX_TOKENS,
    system,
    messages,
    tools: [tool],
    tool_choice: { type: "tool", name: tool.name },
  });

  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error(
      `Expected tool_use block for "${tool.name}", got: ${response.content.map((b) => b.type).join(", ")}`,
    );
  }

  return toolBlock.input as T;
}

/**
 * Stream a chat response from Claude.
 * Returns the full text after streaming completes.
 *
 * The `onDelta` callback receives each text chunk as it arrives —
 * the caller (API route) can forward these to the client via SSE.
 */
export async function streamChat(
  client: Anthropic,
  system: string,
  messages: MessageParam[],
  onDelta?: (text: string) => void,
  tier: ModelTier = "quality",
): Promise<string> {
  const stream = client.messages.stream({
    model: MODELS[tier],
    max_tokens: DEFAULT_MAX_TOKENS,
    system,
    messages,
  });

  let fullText = "";

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      fullText += event.delta.text;
      onDelta?.(event.delta.text);
    }
  }

  return fullText;
}
