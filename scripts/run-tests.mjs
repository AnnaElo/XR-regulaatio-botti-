// Ajaa tests/cases.yaml -testitapaukset oikeaa Claude API:a vastaan ja kirjoittaa raportin.
// Vaatii ympäristömuuttujan ANTHROPIC_API_KEY. Jokainen ajo maksaa (noin 0,05 $ / tapaus).
// Käyttö: node scripts/run-tests.mjs [tapauksen-id ...]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { parse } from "yaml";
import Anthropic from "@anthropic-ai/sdk";
import { askBot } from "../worker/bot.js";

execFileSync("node", ["scripts/build-kb.mjs"], { stdio: "inherit" });
const kb = JSON.parse(readFileSync("worker/kb.generated.json", "utf8"));
const only = process.argv.slice(2);
const cases = parse(readFileSync("tests/cases.yaml", "utf8")).filter((c) => !only.length || only.includes(c.id));
const client = new Anthropic();

const rows = [];
let report = `# Testiraportti ${new Date().toISOString().slice(0, 16).replace("T", " ")}\n\n`;
for (const c of cases) {
  process.stdout.write(`${c.id} … `);
  const answer = await askBot(client, kb, [{ role: "user", text: c.question }]);
  const cited = new Set(answer.sources.map((s) => s.id));
  const missing = (c.must_cite ?? []).filter((id) => !cited.has(id));
  const unwanted = (c.must_not_cite ?? []).filter((id) => cited.has(id));
  const text = (answer.text ?? "").toLowerCase();
  const standardsMissing = (c.recommend_standards ?? []).filter((id) => !cited.has(id) && !text.includes(id));
  const pass = !answer.refused && !missing.length && !unwanted.length;
  rows.push({ id: c.id, pass, missing, unwanted, standardsMissing });
  console.log(pass ? "OK" : "HUOM");
  report += `## ${c.id} ${pass ? "✅" : "⚠️"}\n\n**Kysymys:** ${c.question}\n\n`;
  report += `**Viitatut lähteet:** ${[...cited].join(", ") || "–"}\n\n`;
  if (missing.length) report += `**Puuttuvat pakolliset lähteet:** ${missing.join(", ")}\n\n`;
  if (unwanted.length) report += `**Ylimääräiset lähteet:** ${unwanted.join(", ")}\n\n`;
  if (standardsMissing.length) report += `**Mainitsematta jääneet standardit:** ${standardsMissing.join(", ")}\n\n`;
  if (c.expect?.length) report += `**Tarkistettava käsin:**\n${c.expect.map((e) => `- [ ] ${e}`).join("\n")}\n\n`;
  report += `<details><summary>Vastaus</summary>\n\n${answer.refused ? "(kieltäytyi)" : answer.text}\n\n</details>\n\n`;
  report += `Tokenit: syöte ${answer.usage.input_tokens}, välimuistista ${answer.usage.cache_read_input_tokens ?? 0}, tuloste ${answer.usage.output_tokens}\n\n`;
}
const passed = rows.filter((r) => r.pass).length;
report = report.replace("\n\n", `\n\nAutomaattiset tarkistukset: ${passed}/${rows.length} läpi.\n\n`);
mkdirSync("tests/results", { recursive: true });
const out = `tests/results/raportti-${Date.now()}.md`;
writeFileSync(out, report);
console.log(`\n${passed}/${rows.length} läpi. Raportti: ${out}`);
