// Cloudflare Worker: tarjoilee käyttöliittymän (public/) ja vastaa osoitteessa POST /api/chat.
// API-avain on Workerin salaisuus ANTHROPIC_API_KEY, eikä se koskaan päädy selaimeen.
// Kysymysten sisältöä ei tallenneta eikä lokiteta.
import Anthropic from "@anthropic-ai/sdk";
import kb from "./kb.generated.json";
import { askBot, InputError } from "./bot.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/chat") return env.ASSETS.fetch(request);
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    // Käyttömäärän rajoitus IP-osoitetta kohden (asetus wrangler.jsonc:ssä).
    const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
    if (env.RATE_LIMITER) {
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      if (!success) return json({ error: "rate_limited" }, 429);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "bad_request" }, 400);
    }

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1 });
    try {
      const answer = await askBot(client, kb, body?.messages);
      return json({ ...answer, usage: undefined, kbUpdated: kb.updated });
    } catch (error) {
      if (error instanceof InputError) return json({ error: "bad_request", message: error.message }, 400);
      if (error instanceof Anthropic.RateLimitError) return json({ error: "busy" }, 503);
      if (error instanceof Anthropic.APIError) {
        console.error("Claude API error", error.status);
        return json({ error: "upstream" }, 502);
      }
      console.error("Unexpected error", error?.name);
      return json({ error: "internal" }, 500);
    }
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
