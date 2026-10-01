import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { loadIdentity } from "./identity.mjs";
import { walk } from "./validate-skills.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = process.argv[2];
if (!cli || process.argv.length !== 3) throw new Error("usage: node tools/smoke-install.mjs <codex executable or bin/codex.js>");
const identity = loadIdentity(root);
const profile = mkdtempSync(join(tmpdir(), "flow-install-"));
const env = { ...process.env, CODEX_HOME: profile, HOME: profile, USERPROFILE: profile };
const run = (...args) => {
  const result = spawnSync(cli.endsWith(".js") ? "node" : cli,
    [...(cli.endsWith(".js") ? [cli] : []), ...args], { env, encoding: "utf8", timeout: 30000 });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
};

run("plugin", "marketplace", "add", root);
const catalog = JSON.parse(run("plugin", "list", "--marketplace", identity.name, "--available", "--json"));
assert.equal(catalog.available.length, 1);
assert.equal(catalog.available[0].pluginId, `${identity.name}@${identity.name}`);
const installed = JSON.parse(run("plugin", "add", `${identity.name}@${identity.name}`, "--json"));
const source = join(root, "plugins/pstack");
for (const file of walk(source)) {
  assert.deepEqual(readFileSync(join(installed.installedPath, relative(source, file))), readFileSync(file),
    `installed file differs: ${relative(source, file)}`);
}
const manifest = JSON.parse(readFileSync(join(installed.installedPath, ".codex-plugin/plugin.json"), "utf8"));
assert.equal(manifest.name, identity.name);
const leaves = readdirSync(join(installed.installedPath, manifest.skills)).sort();
assert(leaves.includes("architect") && leaves.includes("tdd"));
console.log(JSON.stringify({ namespace: identity.name, version: installed.version, skills: leaves.length,
  files: walk(source).length, profile, installedPath: installed.installedPath }, null, 2));
