/**
 * API routes — Hono catch-all for Cloudflare Pages Functions
 *
 * Five routes that bridge the React UI to the AI engines:
 *   POST /api/examine    → Examiner (Haiku)
 *   POST /api/chat       → Conversant (Sonnet, SSE streaming) + Clue Detector (Haiku)
 *   POST /api/summarize  → Summarizer (Haiku)
 *   POST /api/accuse     → Judge (Sonnet)
 *   POST /api/give-up    → Judge (Sonnet)
 *
 * Each route: parse body → validate → call engine → return result.
 * Game state travels with each request (stateless server).
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
// POST /api/examine
// ---------------------------------------------------------------------------

app.post("/examine", async (c) => {
  const { gameState, locationId, query } = await c.req.json<{
    gameState: GameState;
    locationId: string;
    query: string;
  }>();

  const action = { type: "EXAMINE" as const, locationId, query };
  const validation = validateAction(gameState, action);
  if (!validation.valid) {
    return c.json({ error: validation.reason }, 400);
  }

  const client = createClient(c.env.ANTHROPIC_API_KEY);
  const result = await examine(client, gameState, action);
  return c.json(result);
});

// ---------------------------------------------------------------------------
// POST /api/chat — SSE streaming
// ---------------------------------------------------------------------------

app.post("/chat", async (c) => {
  const { gameState, characterId, message } = await c.req.json<{
    gameState: GameState;
    characterId: string;
    message: string;
  }>();

  const action = { type: "SAY" as const, characterId, message };
  const validation = validateAction(gameState, action);
  if (!validation.valid) {
    return c.json({ error: validation.reason }, 400);
  }

  const client = createClient(c.env.ANTHROPIC_API_KEY);

  // Stream the NPC response via SSE
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

        // Final event with complete result
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
// POST /api/summarize
// ---------------------------------------------------------------------------

app.post("/summarize", async (c) => {
  const { gameState, characterId } = await c.req.json<{
    gameState: GameState;
    characterId: string;
  }>();

  const action = { type: "END_CONVERSATION" as const, characterId };
  const validation = validateAction(gameState, action);
  if (!validation.valid) {
    return c.json({ error: validation.reason }, 400);
  }

  const client = createClient(c.env.ANTHROPIC_API_KEY);
  const result = await summarize(client, gameState, action);
  return c.json(result);
});

// ---------------------------------------------------------------------------
// POST /api/accuse
// ---------------------------------------------------------------------------

app.post("/accuse", async (c) => {
  const { gameState, suspectId, motive, method, evidenceCited } =
    await c.req.json<{
      gameState: GameState;
      suspectId: string;
      motive: string;
      method: string;
      evidenceCited: string[];
    }>();

  const action = {
    type: "ACCUSE" as const,
    suspectId,
    motive,
    method,
    evidenceCited,
  };
  const validation = validateAction(gameState, action);
  if (!validation.valid) {
    return c.json({ error: validation.reason }, 400);
  }

  const client = createClient(c.env.ANTHROPIC_API_KEY);
  const result = await evaluate(client, gameState, action);
  return c.json(result);
});

// ---------------------------------------------------------------------------
// POST /api/give-up
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
