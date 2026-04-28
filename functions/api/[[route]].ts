/**
 * API routes — Hono catch-all for Cloudflare Pages Functions
 *
 * Four game endpoints mirroring the action model:
 *   POST /api/start      → Initialize game from mystery registry
 *   POST /api/focus      → Navigate — server auto-summarizes when leaving a character
 *   POST /api/interact   → Context-dependent — server routes to examine or converse (always SSE)
 *   POST /api/solve      → Judge — timeline reconstruction evaluation
 *   POST /api/give-up    → Judge — reveal solution
 *
 * Plus infrastructure:
 *   GET  /api/health     → Runtime validation (no AI calls)
 *   GET  /api/mysteries  → Mystery catalog
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
  clientGetConversation,
} from "../../types/client";
import { getMystery, listMysteries } from "../mysteries";
import type { ClientGameState } from "../../types/client";
import type { GameState } from "../../types/state";
import type { FocusResult, InteractResult } from "../../types/actions";

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
// SSE helpers
// ---------------------------------------------------------------------------

function sseResponse(
  handler: (send: (event: string, data: unknown) => void) => Promise<void>,
): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      }

      try {
        await handler(send);
      } catch (err) {
        send("error", {
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
// POST /api/focus — navigate to a location or character
//
// Server handles summarization automatically when leaving a character
// with unsummarized messages. Client just says where to go.
// ---------------------------------------------------------------------------

app.post("/focus", async (c) => {
  const { mysteryId, state, target } = await c.req.json<{
    mysteryId: string;
    state: ClientGameState;
    target: { type: "location" | "character"; id: string };
  }>();

  const resolved = resolveGameState(mysteryId, state);
  if (isError(resolved)) {
    return c.json({ error: resolved.error }, resolved.status);
  }
  const gameState = resolved;

  const action = { type: "FOCUS" as const, target };
  const validation = validateAction(gameState, action);
  if (!validation.valid) {
    return c.json({ error: validation.reason }, 400);
  }

  // Check if we're leaving a character that needs summarization
  let focusResult: FocusResult = {};

  const leavingCharacter =
    gameState.focus.type === "character" &&
    (target.type !== "character" || target.id !== gameState.focus.id);

  if (leavingCharacter) {
    const characterId = gameState.focus.id;
    const conversation = clientGetConversation(state, characterId);
    const hasMessages = conversation && conversation.messages.length > 0;
    const lastSummaryCount = conversation?.summaries.length ?? 0;
    const needsSummary =
      hasMessages && conversation.messages.length > lastSummaryCount * 2;

    if (needsSummary) {
      const client = createClient(c.env.ANTHROPIC_API_KEY);
      const conversationEnded = await summarize(
        client,
        gameState,
        characterId,
      );
      focusResult = { conversationEnded };
    }
  }

  return c.json({ focusResult });
});

// ---------------------------------------------------------------------------
// POST /api/interact — context-dependent action (always SSE)
//
// Server checks focus type:
//   location  → examine engine → single "done" event
//   character → converse engine → "delta" events + "done" event
// ---------------------------------------------------------------------------

app.post("/interact", async (c) => {
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

  if (gameState.focus.type === "location") {
    // Examination — call engine, return as single SSE "done" event
    return sseResponse(async (send) => {
      const result = await examine(client, gameState, action);
      send("done", result);
    });
  } else {
    // Conversation — stream deltas, then "done" with full result
    return sseResponse(async (send) => {
      const result = await converse(client, gameState, action, (delta) => {
        send("delta", { text: delta });
      });
      send("done", result);
    });
  }
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
