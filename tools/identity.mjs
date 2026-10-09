import { readFileSync } from "node:fs";
import { join } from "node:path";

export const canonicalIdentity = { name: "pstack", displayName: "pstack" };

export function loadIdentity(root) {
  const value = JSON.parse(readFileSync(join(root, "plugins/pstack/identity.json"), "utf8"));
  if (!value || typeof value !== "object" || Object.keys(value).sort().join() !== "displayName,name" ||
      typeof value.name !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.name) || value.name.length > 64 ||
      typeof value.displayName !== "string" || !value.displayName.trim()) {
    throw new Error("identity.json must contain a portable name and a nonempty displayName");
  }
  return value;
}

export function adaptIdentity(text, identity, previousName = "pstack") {
  for (const name of new Set(["pstack", previousName])) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) throw new Error(`invalid source namespace: ${name}`);
    text = text.replace(new RegExp(`(?<![a-z0-9-])${name}:`, "g"), `${identity.name}:`);
    text = text.replace(new RegExp(`(?<![a-z0-9-])${name}-models\\.md`, "g"), `${identity.name}-models.md`);
  }
  return text;
}

export function stampIdentity(manifest, identity, kind) {
  manifest.name = identity.name;
  if (kind.endsWith("marketplace")) {
    if (manifest.plugins?.length !== 1) throw new Error(`${kind} must contain one personal plugin`);
    manifest.plugins[0].name = identity.name;
    if (kind === "codex-marketplace") manifest.interface.displayName = identity.displayName;
  } else if (kind === "claude") {
    manifest.displayName = identity.displayName;
  } else if (kind === "codex") {
    manifest.interface.displayName = identity.displayName;
  }
  return JSON.stringify(manifest, null, 2) + "\n";
}
