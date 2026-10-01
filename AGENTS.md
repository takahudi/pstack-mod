# pstack-workflow

This repository adapts Lauren Tan's pstack for Codex and Claude Code. Keep upstream skill content and local runtime adaptations distinguishable.

- For namespace, model routing, hooks, Matt Pocock integration, release, or upstream sync work, read [docs/WORKFLOW_PORT.md](docs/WORKFLOW_PORT.md) first. It records agreed requirements, open decisions, and the next implementation steps.
- For changes imported from Cursor's pstack, follow [CONTRIBUTING.md](CONTRIBUTING.md) and the existing `tools/sync.mjs` boundary. Record deliberate local deviations in `tools/forks.json`.
- `port-upstream` points to `michael-denyer/pstack-claude`; `cursor-upstream` points to `cursor/plugins`. Treat both as sources to read and fetch. Add the user's repository as `origin` when it exists.
- Verify plugin discovery and the selected hook behavior on Windows as well as the existing CI checks before replacing the installed pstack plugin.

