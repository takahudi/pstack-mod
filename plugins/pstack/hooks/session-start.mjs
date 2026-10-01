import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const hookDir = dirname(fileURLToPath(import.meta.url));

export function sessionHookEnabled(text) {
  const values = text.replaceAll("\r\n", "\n").split("\n")
    .filter((line) => /^[ \t]*session hook\s*:/.test(line));
  return values.length === 1 && values[0].trimEnd() === "session hook: on";
}

export function settingPath(runtime, env, home, sheetName) {
  if (runtime === "claude") return join(env.CLAUDE_CONFIG_DIR || join(home, ".claude"), sheetName);
  if (runtime === "codex") return join(env.CODEX_HOME || join(home, ".codex"), sheetName);
  throw new Error(`unknown runtime '${runtime}' (expected claude or codex)`);
}

export function sessionContext(runtime) {
  const { name } = JSON.parse(readFileSync(join(hookDir, "../identity.json"), "utf8"));
  if (typeof name !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error("identity.json has an invalid plugin name");
  }
  const sheet = settingPath(runtime, process.env, homedir(), `${name}-models.md`);
  let text;
  try {
    text = readFileSync(sheet, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
  return sessionHookEnabled(text) ? readFileSync(join(hookDir, "session-start-context.md"), "utf8") : "";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.stdout.write(sessionContext(process.argv[2] ?? ""));
  } catch (error) {
    process.stderr.write(`session-start.mjs: ${error.message}\n`);
    process.exitCode = 1;
  }
}
