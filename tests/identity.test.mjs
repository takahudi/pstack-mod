import { describe, expect, test } from "bun:test";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { adaptIdentity, loadIdentity } from "../tools/identity.mjs";
import { apply, changes, deriveSkill, loadLeadLines, loadModels, plan, validateIdentity } from "../tools/generate.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const identity = loadIdentity(root);

describe("personal plugin identity", () => {
  test("both hosts and discovery catalogs expose unique namespaced IDs", () => {
    expect(identity).toEqual({ name: "pstack-mod", displayName: "pstack-mod" });
    expect(() => validateIdentity(root)).not.toThrow();
    const text = readFileSync(join(root, "plugins/pstack/.codex-plugin/prompts/tdd.md"), "utf8");
    expect(text).toContain("Invoke the `pstack-mod:tdd` skill");
    expect(text).not.toContain("Invoke the `tdd` skill");
  });
  test("conversion preserves third-party IDs, attribution and upstream locations", () => {
    const source = "pstack:architect pstack:effort-high pstack-models.md example-skills:code-review\n" +
      "Original pstack by Lauren Tan. https://github.com/cursor/plugins/tree/main/pstack\n";
    const result = adaptIdentity(source, identity);
    expect(result).toBe("pstack-mod:architect pstack-mod:effort-high pstack-mod-models.md example-skills:code-review\n" +
      "Original pstack by Lauren Tan. https://github.com/cursor/plugins/tree/main/pstack\n");
    expect(adaptIdentity(result, identity)).toBe(result);
    expect(adaptIdentity("other-pstack:architect other-pstack-models.md", identity)).toBe("other-pstack:architect other-pstack-models.md");
  });
  test("sync derives Windows and POSIX logical paths into the same namespaced result", () => {
    const models = loadModels(root), leads = loadLeadLines(root);
    const source = "---\nname: How\ndescription: Explain it\n---\n\n# How\n\nUse pstack:poteto-agent and pstack-models.md.\n";
    const posix = deriveSkill("plugins/pstack/skills/how/SKILL.md", source, models, leads, identity);
    expect(posix).toContain("pstack-mod:poteto-agent");
    expect(posix).toContain("pstack-mod-models.md");
    expect(posix).toContain("## Models");
    expect(deriveSkill("plugins\\pstack\\skills\\how\\SKILL.md", source, models, leads, identity)).toBe(posix);
    expect(deriveSkill("plugins/pstack/skills/how/SKILL.md", posix, models, leads, identity)).toBe(posix);
  });
  test("a subsequent rename updates the prior own identity and remains idempotent", () => {
    const copy = mkdtempSync(join(tmpdir(), "flow-rename-"));
    try {
      cpSync(root, copy, {recursive: true, filter: (p) => ![".git", ".local-tools", "node_modules"].includes(basename(p))});
      writeFileSync(join(copy, "plugins/pstack/identity.json"), JSON.stringify({name: "takahudi-next", displayName: "Next"}));
      const notices = ["LICENSE", "LICENSE-cursor-team-kit", "NOTICE.md", "CHANGES.md"].map((p) => [p, readFileSync(join(copy, p), "utf8")]);
      apply(copy, plan(copy), {log: () => {}});
      expect(() => validateIdentity(copy)).not.toThrow();
      expect(changes(copy, plan(copy))).toEqual([]);
      expect(readFileSync(join(copy, "plugins/pstack/skills/architect/SKILL.md"), "utf8")).not.toContain("pstack-mod:");
      expect(readFileSync(join(copy, "plugins/pstack/.codex-plugin/prompts/tdd.md"), "utf8")).toContain("takahudi-next:tdd");
      for (const [p, text] of notices) expect(readFileSync(join(copy, p), "utf8")).toBe(text);
    } finally { rmSync(copy, {recursive: true, force: true}); }
  });
  test("setup's default is off and preserves a user's explicit choice during updates", () => {
    const setup = readFileSync(join(root, "plugins/pstack/skills/setup-pstack/SKILL.md"), "utf8");
    expect(setup).toContain("The default is off.");
    expect(setup).toContain("Preserve an existing valid choice during model-only updates.");
    expect(setup).toContain("For a hook-only request, update only that line, preserve all model rows");
    const sheet = setup.match(/```markdown\n([\s\S]*?)\n```/)[1];
    expect(sheet).toContain("session hook: off");
    expect(sheet).not.toContain("\nsession hook: on");
  });
});
