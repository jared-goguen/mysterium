/**
 * API routes — Hono catch-all for Cloudflare Pages Functions
 *
 * Five routes bridging the React UI to the AI engines:
 *   POST /api/examine    → Examiner (Haiku)
 *   POST /api/chat       → Conversant (Sonnet, SSE) + Clue Detector (Haiku)
 *   POST /api/summarize  → Summarizer (Haiku) — auto-called on FOCUS away from character
 *   POST /api/solve      → Judge (Sonnet) — timeline reconstruction evaluation
 *   POST /api/give-up    → Judge (Sonnet) — reveal solution
 */

import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import { createClient } from "../../lib/ai/client";
import { examine } from "../../lib/ai/engines/examiner";
import { converse } from "../../lib/ai/engines/conversant";
import { summarize } from "../../lib/ai/engines/summarizer";
import { evaluate, giveUp } from "../../lib/ai/engines/judge";
import { validateAction } from "../../lib/validators";
import type { GameState } from "../../types/state";

type Env = {
  Bindings: {
    ANTHROPIC_API_KEY: string;
  };
};

const app = new Hono<Env>().basePath("/api");

// ---------------------------------------------------------------------------
// POST /api/examine — location examination
// ---------------------------------------------------------------------------

app.post("/examine", async (c) => {
  const { gameState, message } = await c.req.json<{
    gameState: GameState;
    message: string;
  }>();

  const action = { type: "INTERACT" as const, message };
  const validation = validateAction(gameState, action);
  if (!validation.valid) {
    return c.json({ error: validation.reason }, 400);
  }

  const client = createClient(c.env.ANTHROPIC_API_KEY);
  const result = await examine(client, gameState, action);
  return c.json(result);
});

// ---------------------------------------------------------------------------
// POST /api/chat — NPC conversation (SSE streaming)
// ---------------------------------------------------------------------------

app.post("/chat", async (c) => {
  const { gameState, message } = await c.req.json<{
    gameState: GameState;
    message: string;
  }>();

  const action = { type: "INTERACT" as const, message };
  const validation = validateAction(gameState, action);
  if (!validation.valid) {
    return c.json({ error: validation.reason }, 400);
  }

  const client = createClient(c.env.ANTHROPIC_API_KEY);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function sendEvent(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      }

      try {
        const result = await converse(client, gameState, action, (delta) => {
          sendEvent("delta", { text: delta });
        });

        sendEvent("done", {
          response: result.response,
          cluesRevealed: result.cluesRevealed,
        });
      } catch (err) {
        sendEvent("error", {
          message: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

// ---------------------------------------------------------------------------
// POST /api/summarize — conversation summarization (auto on FOCUS away)
// ---------------------------------------------------------------------------

app.post("/summarize", async (c) => {
  const { gameState, characterId } = await c.req.json<{
    gameState: GameState;
    characterId: string;
  }>();

  const client = createClient(c.env.ANTHROPIC_API_KEY);
  const result = await summarize(client, gameState, characterId);
  return c.json(result);
});

// ---------------------------------------------------------------------------
// POST /api/solve — timeline reconstruction evaluation
// ---------------------------------------------------------------------------

app.post("/solve", async (c) => {
  const { gameState, answers, evidenceCited } = await c.req.json<{
    gameState: GameState;
    answers: Record<string, string>;
    evidenceCited: string[];
  }>();

  const action = { type: "SOLVE" as const, answers, evidenceCited };
  const validation = validateAction(gameState, action);
  if (!validation.valid) {
    return c.json({ error: validation.reason }, 400);
  }

  const client = createClient(c.env.ANTHROPIC_API_KEY);
  const result = await evaluate(client, gameState, action);
  return c.json(result);
});

// ---------------------------------------------------------------------------
// POST /api/give-up — reveal the full solution
// ---------------------------------------------------------------------------

app.post("/give-up", async (c) => {
  const { gameState } = await c.req.json<{
    gameState: GameState;
  }>();

  const validation = validateAction(gameState, { type: "GIVE_UP" });
  if (!validation.valid) {
    return c.json({ error: validation.reason }, 400);
  }

  const client = createClient(c.env.ANTHROPIC_API_KEY);
  const result = await giveUp(client, gameState);
  return c.json(result);
});

export const onRequest = handle(app);
