// Botin ydin: rakentaa pyynnön Claude API:lle ja muuttaa vastauksen tekstiksi ja lähteiksi.
// Käytössä sekä Workerissa että testiskriptissä.

export const MODEL = "claude-opus-5-5";
const MAX_TURNS = 20;
const MAX_CHARS = 4000;

/**
 * @param {import("@anthropic-ai/sdk").default} client
 * @param {{updated: string, systemPrompt: string, documents: {id: string, title: string, url: string|null, text: string}[]}} kb
 * @param {{role: "user"|"assistant", text: string}[]} history  keskustelu, viimeisenä käyttäjän kysymys
 */
export async function askBot(client, kb, history) {
  const turns = sanitize(history);
  const today = new Date().toISOString().slice(0, 10);

  // Tietopohja liitetään ensimmäiseen käyttäjäviestiin dokumentteina, joista Claude viittaa.
  // Viimeinen dokumentti merkitään välimuistiin, joten tietopohja maksaa täyden hinnan vain kerran.
  const docBlocks = kb.documents.map((doc, i) => ({
    type: "document",
    source: { type: "text", media_type: "text/plain", data: doc.text },
    title: doc.title,
    citations: { enabled: true },
    ...(i === kb.documents.length - 1 ? { cache_control: { type: "ephemeral", ttl: "1h" } } : {}),
  }));

  const messages = turns.map((turn, i) => ({
    role: turn.role,
    content:
      i === 0
        ? [
            ...docBlocks,
            {
              type: "text",
              text: `Knowledge base last updated: ${kb.updated}. Today: ${today}.\n\n${turn.text}`,
            },
          ]
        : turn.text,
  }));

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "medium" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: kb.systemPrompt,
    messages,
  });

  if (response.stop_reason === "refusal") {
    return { text: null, refused: true, sources: [], usage: response.usage };
  }

  // Kootaan teksti ja numeroidaan lähteet siinä järjestyksessä kuin niihin viitataan.
  const sources = [];
  const indexOf = new Map();
  let text = "";
  for (const block of response.content) {
    if (block.type !== "text") continue;
    text += block.text;
    const marks = new Set();
    for (const c of block.citations ?? []) {
      const doc = kb.documents[c.document_index];
      if (!doc) continue;
      if (!indexOf.has(doc.id)) {
        indexOf.set(doc.id, sources.length + 1);
        sources.push({ n: sources.length + 1, id: doc.id, title: doc.title, url: doc.url });
      }
      marks.add(indexOf.get(doc.id));
    }
    if (marks.size) text += " " + [...marks].map((n) => `[${n}]`).join("");
  }

  return {
    text,
    refused: false,
    sources,
    truncated: response.stop_reason === "max_tokens",
    usage: response.usage,
  };
}

function sanitize(history) {
  if (!Array.isArray(history) || history.length === 0) throw new InputError("Tyhjä kysymys.");
  const turns = history.slice(-MAX_TURNS).map((t) => ({
    role: t?.role === "assistant" ? "assistant" : "user",
    text: String(t?.text ?? "").slice(0, MAX_CHARS).trim(),
  }));
  // Keskustelun on alettava ja päätyttävä käyttäjän viestiin.
  while (turns.length && turns[0].role !== "user") turns.shift();
  if (!turns.length || turns.at(-1).role !== "user" || !turns.at(-1).text) {
    throw new InputError("Viimeisen viestin on oltava käyttäjän kysymys.");
  }
  return turns;
}

export class InputError extends Error {}
