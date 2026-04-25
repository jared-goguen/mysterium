import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";

const app = new Hono().basePath("/api");

// POST /api/examine — mock location examination
app.post("/examine", async (c) => {
  const { locationId, query } = await c.req.json();
  return c.json({
    narrative: `You examine ${query}. The details come into focus...`,
    clueFound: null,
  });
});

// POST /api/chat — mock NPC response (simulates streaming with a simple response)
app.post("/chat", async (c) => {
  const { characterId, message } = await c.req.json();
  return c.json({
    response: `The suspect considers your question carefully before responding...`,
    cluesRevealed: [],
  });
});

// POST /api/accuse — mock accusation
app.post("/accuse", async (c) => {
  const { suspectId } = await c.req.json();
  return c.json({
    outcome: "wrong",
    consequence: {
      narrative:
        "Your accusation falls flat. The suspect looks at you with a mix of anger and pity.",
      npcStateChanges: {},
      secretsRevealed: [],
      gameOver: false,
    },
  });
});

export const onRequest = handle(app);
