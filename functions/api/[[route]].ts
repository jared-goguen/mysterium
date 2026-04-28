/**
 * API routes — Hono catch-all for Cloudflare Pages Functions
 *
 * Six routes bridging the React UI to the AI engines:
 *   POST /api/start      → Initialize game from mystery registry
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
import { createGameState } from "../../lib/initializers";
import {
  stripMystery,
  stripGameState,
  reconstructGameState,
} from "../../types/client";
import { getMystery, listMysteries } from "../mysteries";
import type { ClientGameState } from "../../types/client";
import type { GameState } from "../../types/state";

type Env = {
  Bindings: {
    ANTHROPIC_API_KEY: string;
    ENVIRONMENT?: string;
  };
};

const app = new Hono<Env>().basePath("/api");

// ---------------------------------------------------------------------------
// Global error handler — structured errors instead of opaque 500s
// ---------------------------------------------------------------------------

app.onError((err, c) => {
  console.error(`[${c.req.method} ${c.req.path}]`, err.message, err.stack);
  return c.json(
    {
      error: err.message,
      // Include stack in non-production (preview deployments)
      ...(c.env.ENVIRONMENT !== "production" && { stack: err.stack }),
    },
    500,
  );
});

// ---------------------------------------------------------------------------
// GET /api/health — runtime validation (no AI calls)
// ---------------------------------------------------------------------------

app.get("/health", (c) => {
  const mysteries = listMysteries();
  const hasApiKey = Boolean(c.env.ANTHROPIC_API_KEY);

  // Exercise the full pipeline minus AI: pick the first mystery,
  // create initial state, strip it, reconstruct it.
  const first = mysteries[0];
  let pipelineOk = false;
  let pipelineError: string | null = null;
  if (first) {
    try {
      const mystery = getMystery(first.id);
      if (mystery) {
        const state = createGameState(mystery);
        const client = stripGameState(state);
        const reconstructed = reconstructGameState(client, mystery);
        pipelineOk = reconstructed.phase === "playing";
      }
    } catch (err) {
      pipelineError = err instanceof Error ? err.message : String(err);
    }
  }

  return c.json({
    ok: hasApiKey && pipelineOk,
    mysteries: mysteries.length,
    hasApiKey,
    pipeline: pipelineOk ? "ok" : pipelineError ?? "no mysteries",
    nodeCompat: typeof process !== "undefined",
  });
});

// ---------------------------------------------------------------------------
// Helper: reconstruct full GameState from client payload
// ---------------------------------------------------------------------------

/**
 * Parse { mysteryId, state } from the request body and reconstruct
 * the full GameState by looking up the mystery from the server registry.
 * Returns the full GameState or a 400/404 error response.
 */
function resolveGameState(
  mysteryId: string,
  clientState: ClientGameState,
): GameState | { error: string; status: 400 | 404 } {
  if (!mysteryId || !clientState) {
    return { error: "Missing mysteryId or state", status: 400 };
  }
  const mystery = getMystery(mysteryId);
  if (!mystery) {
    return { error: `Unknown mystery: ${mysteryId}`, status: 404 };
  }
  return reconstructGameState(clientState, mystery);
}

function isError(
  result: GameState | { error: string; status: 400 | 404 },
): result is { error: string; status: 400 | 404 } {
  return "error" in result && "status" in result;
}

// ---------------------------------------------------------------------------
// GET /api/mysteries — list all available mysteries
// ---------------------------------------------------------------------------

app.get("/mysteries", (c) => {
  return c.json(listMysteries());
});

// ---------------------------------------------------------------------------
// POST /api/start — initialize a new game from a mystery ID
// ---------------------------------------------------------------------------

app.post("/start", async (c) => {
  const { mysteryId } = await c.req.json<{
    mysteryId: string;
  }>();

  const mystery = getMystery(mysteryId);
  if (!mystery) {
    return c.json({ error: `Unknown mystery: ${mysteryId}` }, 404);
  }

  const initialState = createGameState(mystery);
  return c.json({
    clientMystery: stripMystery(mystery),
    state: stripGameState(initialState),
  });
});

// ---------------------------------------------------------------------------
// POST /api/examine — location examination
// ---------------------------------------------------------------------------

app.post("/examine", async (c) => {
  const { mysteryId, state, message } = await c.req.json<{
    mysteryId: string;
    state: ClientGameState;
    message: string;
  }>();

  const resolved = resolveGameState(mysteryId, state);
  if (isError(resolved)) {
    return c.json({ error: resolved.error }, resolved.status);
  }
  const gameState = resolved;

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
  const { mysteryId, state, message } = await c.req.json<{
    mysteryId: string;
    state: ClientGameState;
    message: string;
  }>();

  const resolved = resolveGameState(mysteryId, state);
  if (isError(resolved)) {
    return c.json({ error: resolved.error }, resolved.status);
  }
  const gameState = resolved;

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
  const { mysteryId, state, characterId } = await c.req.json<{
    mysteryId: string;
    state: ClientGameState;
    characterId: string;
  }>();

  const resolved = resolveGameState(mysteryId, state);
  if (isError(resolved)) {
    return c.json({ error: resolved.error }, resolved.status);
  }
  const gameState = resolved;

  const client = createClient(c.env.ANTHROPIC_API_KEY);
  const result = await summarize(client, gameState, characterId);
  return c.json(result);
});

// ---------------------------------------------------------------------------
// POST /api/solve — timeline reconstruction evaluation
// ---------------------------------------------------------------------------

app.post("/solve", async (c) => {
  const { mysteryId, state, answers, evidenceCited } = await c.req.json<{
    mysteryId: string;
    state: ClientGameState;
    answers: Record<string, string>;
    evidenceCited: string[];
  }>();

  const resolved = resolveGameState(mysteryId, state);
  if (isError(resolved)) {
    return c.json({ error: resolved.error }, resolved.status);
  }
  const gameState = resolved;

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
  const { mysteryId, state } = await c.req.json<{
    mysteryId: string;
    state: ClientGameState;
  }>();

  const resolved = resolveGameState(mysteryId, state);
  if (isError(resolved)) {
    return c.json({ error: resolved.error }, resolved.status);
  }
  const gameState = resolved;

  const validation = validateAction(gameState, { type: "GIVE_UP" });
  if (!validation.valid) {
    return c.json({ error: validation.reason }, 400);
  }

  const client = createClient(c.env.ANTHROPIC_API_KEY);
  const result = await giveUp(client, gameState);
  return c.json(result);
});

export const onRequest = handle(app);
