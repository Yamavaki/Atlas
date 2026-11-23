// Atlas - gera app/web.json: a lista dos arquivos da interface (pasta app/) com o hash de cada um.
// Vai dentro do app (para saber o que ele já tem) e no Release (para o app baixar só o que mudou).
// Uso: node scripts/web-json.mjs   (roda no build, antes do Tauri)
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
const versao = JSON.parse(readFileSync("src-tauri/tauri.conf.json", "utf8")).version;
const nativo = Number(readFileSync("app/nativo.txt", "utf8").trim()) || 1;
const arquivos = {};
for (const f of execSync("git ls-files app", { encoding: "utf8" }).split("\n").filter(Boolean).sort()) {
  const rel = f.slice(4);
  if (rel === "web.json") continue;
  arquivos[rel] = createHash("sha256").update(readFileSync(f)).digest("hex").slice(0, 16);
}
writeFileSync("app/web.json", JSON.stringify({ versao, nativo, arquivos }));
console.log(`web.json: versão ${versao}, nativa ${nativo}, ${Object.keys(arquivos).length} arquivos`);
