// Kokoaa tietopohjan (sources/**/*.yaml) ja botin ohjeen yhdeksi JSON-tiedostoksi,
// jonka Worker ja testiskripti lukevat. Ajetaan automaattisesti ennen julkaisua.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const sourcesDir = join(root, "sources");

function walk(dir) {
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });
}

const documents = [];
for (const path of walk(sourcesDir)) {
  if (!path.endsWith(".yaml") || path.endsWith("_template.yaml")) continue;
  const text = readFileSync(path, "utf8");
  const data = parse(text);
  const rel = relative(sourcesDir, path);
  const isList = Array.isArray(data);
  documents.push({
    id: isList ? rel.replace(/\.yaml$/, "") : data.id,
    title: isList ? rel : `${data.id}: ${data.name?.en ?? data.name?.fi ?? data.id}`,
    url: isList ? null : (data.primary_sources?.[0]?.url ?? null),
    text,
  });
}

const promptFile = readFileSync(join(root, "prompts", "system-prompt.md"), "utf8");
const systemPrompt = promptFile.split(/^---\s*$/m).slice(1).join("---").trim();

const updated = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(root, "worker", "kb.generated.json"),
  JSON.stringify({ updated, systemPrompt, documents }),
);
console.log(`Tietopohja: ${documents.length} dokumenttia, päivitetty ${updated}`);
