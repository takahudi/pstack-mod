# Local pstack-mod installation and migration

pstack-mod uses `pstack-mod` as its plugin and marketplace name. The physical plugin directory remains `plugins/pstack` to preserve upstream sync paths. The source repository is [takahudi/pstack-mod](https://github.com/takahudi/pstack-mod). GitHub marketplace installation uses the commands in the [README](../README.md). The local checkout remains available for testing before installation.

## Before replacing the old plugin

Keep the old `pstack@pstack-claude` installation and settings until local verification is complete. Check both hosts for the old plugin and any separately registered SessionStart hook. Disable the old plugin before enabling pstack-mod's routing. Leave Matt's plugin installed separately. Namespaced explicit calls work without routing.

For a temporary Claude Code session, use `claude --plugin-dir ./plugins/pstack` from this checkout. For persistent local installation, add this checkout through `/plugin marketplace add <absolute-checkout-path>`, then install `pstack-mod@pstack-mod`. In Codex, use the commands in the [README](../README.md#codex).

## Configuration

Node.js 18 or later must be on PATH for optional routing. Claude Code must support command hooks with `args`; the installed version checked for this work is 2.1.286. Codex must support `commandWindows`; the installed CLI is 0.159.3.

pstack-mod reads `pstack-mod-models.md` in the current host's configuration directory. Claude uses `CLAUDE_CONFIG_DIR` or `~/.claude`; Codex uses `CODEX_HOME` or `~/.codex`. Missing settings leave routing disabled. Setup preserves a single existing valid on/off choice when changing models. Only an explicit user choice enables routing. Model rows use the active vendor's models.

The old `pstack-models.md` is never read automatically. If migrating model choices, inspect the old sheet and copy only models available in the target host. Keep pstack-mod's hook off until automatic routing is selected. Codex still requires review through `/hooks`. Global or plugin hook disabling takes precedence over the sheet's on value.

## Update and rollback

Preserve the namespaced sheet before an update. Regenerate and verify the local source before reinstalling or updating its package. A hook definition change can require a new trust review. Updates do not rewrite the sheet.

To roll back, disable pstack-mod, retain its sheet, and re-enable the previously installed plugin. Inspect separately registered hook entries to avoid two routing mandates. Remove only entries confirmed to belong to pstack-mod if uninstalling it. The old sheet and Matt's plugin remain independently owned.

## Verification boundary

The automated suite executes the shipped Claude argument-vector launcher and the Codex Windows PowerShell launcher. It verifies on/off, missing and invalid settings, runtime isolation, paths with spaces and shell metacharacters, and all four lifecycle input values. Those are command-level checks. A host chooses whether to call a hook for a particular event.

Fresh interactive discovery with pstack-mod and Matt, and host-level untrusted/disabled behavior, must be checked before replacing the installed plugin. Use two distinct entries such as `pstack-mod:tdd` and `mattpocock-skills:tdd`; verify explicit selection with routing off, then test routing after its trust review. No API-backed or interactive chat invocation is part of the local automated check.
