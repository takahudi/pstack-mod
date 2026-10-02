import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { agentSkills, validateRoutingHooks } from "../tools/generate.mjs";
import { sessionHookEnabled, settingPath } from "../plugins/pstack/hooks/session-start.mjs";

const pluginRoot = fileURLToPath(new URL("../plugins/pstack/", import.meta.url));
const identity = JSON.parse(readFileSync(join(pluginRoot, "identity.json"), "utf8"));
const mandate = readFileSync(join(pluginRoot, "hooks/session-start-context.md"), "utf8");
const codexManifest = JSON.parse(readFileSync(join(pluginRoot, ".codex-plugin/plugin.json"), "utf8"));
const definitions = Object.fromEntries(Object.entries({claude: "hooks/hooks.json", codex: codexManifest.hooks})
  .map(([runtime, file]) => [runtime, JSON.parse(readFileSync(join(pluginRoot, file), "utf8"))]));
const variants = [
  ["claude", null], ["claude", "CLAUDE_CONFIG_DIR"], ["codex", null], ["codex", "CODEX_HOME"],
];

// Windows CI's first Node launch took 11.3s. Bound child startup and execution
// separately from the outer test, leaving time for assertions and cleanup.
const PROCESS_TIMEOUT_MS = 15_000;
const PROCESS_TEST_TIMEOUT_MS = 20_000;

function runHook(runtime, sheet, relocated = null, { oddPath = false, legacy = false, other = false, source = "startup" } = {}) {
  const home = mkdtempSync(join(tmpdir(), "flow-hook-"));
  const root = oddPath ? join(home, "plugin 日本語 space ' $ `") : pluginRoot;
  if (oddPath) {
    mkdirSync(root);
    cpSync(join(pluginRoot, "hooks"), join(root, "hooks"), {recursive: true});
    cpSync(join(pluginRoot, "identity.json"), join(root, "identity.json"));
  }
  const config = join(home, relocated ? "custom config 日本語" : runtime === "claude" ? ".claude" : ".codex");
  mkdirSync(config, {recursive: true});
  const sheetPath = join(config, `${identity.name}-models.md`);
  if (sheet !== null) writeFileSync(sheetPath, sheet);
  if (legacy) writeFileSync(join(config, "pstack-models.md"), "session hook: on\n");
  if (other) {
    const otherDir = join(home, runtime === "claude" ? ".codex" : ".claude");
    mkdirSync(otherDir, {recursive: true});
    writeFileSync(join(otherDir, `${identity.name}-models.md`), "session hook: on\n");
  }
  const before = readdirSync(config).map((file) => [file, readFileSync(join(config, file), "utf8")]);
  const env = { ...process.env, HOME: home, USERPROFILE: home, CLAUDE_PLUGIN_ROOT: root, PLUGIN_ROOT: "unrelated", CODEX_HOME: "", CLAUDE_CONFIG_DIR: "" };
  if (relocated) env[relocated] = config;
  const handler = definitions[runtime].hooks.SessionStart[0].hooks[0];
  let executable, args;
  if (runtime === "claude") {
    executable = handler.command;
    args = handler.args.map((arg) => arg.replaceAll("${CLAUDE_PLUGIN_ROOT}", root));
  } else if (process.platform === "win32") {
    executable = "powershell.exe";
    args = ["-NoProfile", "-NonInteractive", "-Command", handler.commandWindows];
  } else {
    executable = "sh";
    args = ["-c", handler.command];
  }
  try {
    const result = spawnSync(executable, args, {env, encoding: "utf8", input: JSON.stringify({hook_event_name: "SessionStart", source}), timeout: PROCESS_TIMEOUT_MS});
    expect(result.error).toBeUndefined();
    expect(readdirSync(config).map((file) => [file, readFileSync(join(config, file), "utf8")])).toEqual(before);
    return {status: result.status, out: result.stdout, err: result.stderr};
  } finally { rmSync(home, {recursive: true, force: true}); }
}

describe("optional SessionStart hook", () => {
  test("declares every lifecycle source and Windows override", () => {
    expect(codexManifest.hooks).toBe("./hooks/codex-hooks.json");
    expect(() => validateRoutingHooks(JSON.stringify(definitions.claude), JSON.stringify(definitions.codex))).not.toThrow();
  });
  test("rejects restoration of a shell launcher or loss of the Windows override", () => {
    for (const commandWindows of [undefined, '"${CLAUDE_PLUGIN_ROOT}/hooks/session-start.sh" codex']) {
      const bad = structuredClone(definitions.codex);
      bad.hooks.SessionStart[0].hooks[0].commandWindows = commandWindows;
      expect(() => validateRoutingHooks(JSON.stringify(definitions.claude), JSON.stringify(bad))).toThrow("cross-platform Node");
    }
  });
  test("names only installed own skills", () => {
    const named = [...mandate.matchAll(new RegExp(`${identity.name}:([a-z0-9-]+)`, "g"))].map((match) => match[1]);
    const names = new Set(agentSkills(join(pluginRoot, "skills")).map((skill) => skill.name));
    expect(named).toContain("poteto-mode");
    expect(named.filter((name) => !names.has(name))).toEqual([]);
  });
  test("settings parser accepts one explicit on and rejects malformed or duplicate choices", () => {
    expect(sessionHookEnabled("session hook: on\r\n")).toBe(true);
    for (const text of ["", "session hook: off\n", "session hook: yes\n", "session hook: ON\n", "session hook: on\nsession hook: off\n", "session hook: on\n session hook: off\n", "session hook: on\nsession hook: on\n"]) {
      expect(sessionHookEnabled(text)).toBe(false);
    }
  });
  test("unknown runtime is rejected", () => {
    expect(() => settingPath("cursor", {}, "home", "sheet.md")).toThrow("unknown runtime");
    const result = spawnSync("node", [join(pluginRoot, "hooks/session-start.mjs"), "cursor"], {encoding: "utf8", timeout: PROCESS_TIMEOUT_MS});
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("unknown runtime 'cursor'");
  }, PROCESS_TEST_TIMEOUT_MS);
  for (const [runtime, relocated] of variants) describe(`${runtime} ${relocated ?? "default home"}`, () => {
    for (const sheet of [null, "bug-fix: configured-model\n", "session hook: off\n", "session hook: invalid\n"]) {
      test(`disabled for ${JSON.stringify(sheet)}`, () => {
        expect(runHook(runtime, sheet, relocated)).toEqual({status: 0, out: "", err: ""});
      }, PROCESS_TEST_TIMEOUT_MS);
    }
    for (const source of ["startup", "resume", "clear", "compact"]) {
      test(`enabled on ${source}, using the shipped launcher`, () => {
        expect(runHook(runtime, "bug-fix: configured-model\r\nsession hook: on\r\n", relocated, {source})).toEqual({status: 0, out: mandate, err: ""});
      }, PROCESS_TEST_TIMEOUT_MS);
    }
    test("ignores the old plugin and other runtime's setting", () => {
      expect(runHook(runtime, null, relocated, {legacy: true, other: true})).toEqual({status: 0, out: "", err: ""});
    }, PROCESS_TEST_TIMEOUT_MS);
    test("preserves spaces, Japanese and shell metacharacters in the plugin path", () => {
      expect(runHook(runtime, "session hook: on\n", relocated, {oddPath: true})).toEqual({status: 0, out: mandate, err: ""});
    }, PROCESS_TEST_TIMEOUT_MS);
  });
});
