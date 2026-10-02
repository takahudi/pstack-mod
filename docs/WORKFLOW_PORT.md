# pstack-workflow — project handoff

## Goal

Create a personal pstack port for `takahudi` that provides its own workflow skills for Codex and Claude Code. The intended workflow covers requirements, design, implementation, verification, review, and PR creation. Keep pstack's agent model choices inside the active vendor: OpenAI models in Codex, Claude models in Claude Code.

This directory starts from `michael-denyer/pstack-claude` with its Git history intact. The original Cursor pstack lives under `cursor/plugins/pstack`. Preserve attribution and the MIT notices from both sources.

## Agreed direction

1. Give the personal plugin its own namespace in both hosts. The user selected `pstack-mod` as the display name and `pstack-mod` as the plugin and marketplace name on 2026-10-02. A skill is selectable as, for example, `pstack-mod:architect`.
2. Track the original Cursor pstack automatically. Detect updates to the `pstack/` subtree, apply the port's conversion, run checks, and open a reviewable sync PR. Do not silently merge a failed or conflicting sync.
3. Keep pstack-mod's workflow self-contained and document its own skill for each phase.
4. Keep a SessionStart hook available as an option. The actual requirement is reliable Windows operation and an explicit user choice to enable or disable automatic routing. Explicit invocation must work when the hook is off or untrusted.
5. Stop the default delivery workflow at a reviewable PR. Merging, deployment, and history rewrites require their own explicit request.

## Implementation requirements

### Upstream ownership

- Treat Cursor pstack as the source for skill content and Michael Denyer's port as the source for host adapters and fixes. Record which revision of each source was imported.
- Reuse `tools/sync.mjs`, `tools/upstream.json`, `tools/substitutions.json`, and `tools/forks.json`. Put personal workflow policy outside imported files where possible; declare every necessary fork.
- A scheduled GitHub Actions job should check for changes, create or update one sync PR, and report conversion conflicts. Run generation, tests, namespace checks, and hook checks on the candidate before presenting it for merge.
- Keep updates from the Cursor source and the Michael port separate in the PR history so failures have a clear owner. Never automatically merge either source into the released branch.

### Identity and discovery

- Set a unique plugin name in Claude and Codex manifests and match the marketplace entries. Update generated prompts, agent dispatch names, examples, setup instructions, and any literal `pstack:` references that refer to the plugin namespace.
- Keep individual skill names stable where possible. Verify that pstack-mod's namespaced skills appear in fresh Codex and Claude Code sessions.
- Provide installation, update, rollback, and old-plugin migration instructions. Disable or remove `pstack@pstack-claude` before enabling the personal plugin; check for residual old hook registrations.

### Optional cross-platform hook

- Separate automatic routing from plugin installation. The implemented default is off until the user chooses on in setup. A missing, invalid or duplicate setting leaves routing disabled.
- Replace the current direct `.sh` invocation with a Windows-capable launch path. Prefer one small, side-effect-free implementation that reads the runtime's setting and emits context only when enabled. Document any runtime dependency, such as Node.js.
- Codex's hook must use its Windows command override when needed and still require its normal trust review. Claude Code's hook must run on native Windows, WSL, macOS, and Linux without relying on an unspecified `grep` or `cat` on `PATH`.
- Verify on/off, missing configuration, untrusted/disabled state, startup, resume, clear, and compact. A hook update must not silently reset the user's choice. The hook must not perform network requests or file writes.
- CI must reject an upstream update that restores an incompatible launcher or changes the default without an explicit review.

### Delivery and quality

- Preserve the repository's generator and test suite. Add focused checks for namespace consistency, zero duplicate skill IDs, hook behavior, and both host manifests. Add a Windows CI job for the hook and installation smoke test.
- Preserve `LICENSE`, `LICENSE-cursor-team-kit`, and attribution notices. Document the Cursor and port revisions in releases.
- Version both host manifests together and publish release notes describing upstream changes and personal changes separately.
- Keep optional scripts and playbooks that can merge, deploy, or rewrite history behind explicit user requests. Review their dependencies before pruning skills from the package.

## Decisions still open

| Decision | Starting recommendation |
| --- | --- |
| Upstream automation | Scheduled update PR, human merge |
| Skill distribution | Keep the complete port for the first release; curate only after dependency review |
| End-to-end entry point | Start with explicit phase selection; consider one entry point that routes between the bundled skills |

## Current local state and verification, 2026-10-02

- Local `main` started from `deb5c3d71e5e3b6d91c08f9696a268d7a994be97`, the imported port's `0.9.55`. The initial pstack-mod adaptation and bilingual documentation were published as a `0.1.0` preview. `tools/port-upstream.json` records the port revision. Cursor pins in `tools/upstream.json` remain unchanged: `12d587d` for pstack and `e46364b8be46000b7df0f260550cd712afbb8d36` for cursor-team-kit.
- The user created the public repository `takahudi/pstack-mod` on 2026-10-02. `origin` is `https://github.com/takahudi/pstack-mod.git`; `port-upstream` and `cursor-upstream` remain source remotes. The user authorized the first push, and local `main` now tracks `origin/main`.
- The normal installed plugins and user configuration were not changed. The prior handoff reported that the old installed `pstack@pstack-claude` plugin's SessionStart hook was disabled in Codex. Migration remains pending.

Implemented identity and hook decisions are in [the design](PSTACK_MOD_DESIGN.md). `plugins/pstack/identity.json` is the identity source. Physical upstream paths remain stable. Both sync revisions use the same personal identity derivation. Generated prompts use qualified IDs. Namespaced model sheets isolate pstack-mod from the old plugin. The read-only Node hook needs no shell utilities; Claude uses exec-form arguments and Codex has a Windows override. Setup preserves the existing valid on/off choice on model updates, and supports a hook-only path.

Codex model settings use one authoritative sheet. User `AGENTS.md` has a pointer instructing the agent to read the resolved sheet before selecting pstack-mod role models or spawning subagents. Setup migrates the earlier copied role block to this pointer and preserves unrelated user instructions. The user's existing model choices and hook choice are retained.

Verification completed:

- Windows generator check passed. Windows identity and hook suite passed 50 tests. The shipped Claude argument array and Codex PowerShell override ran with spaces, Japanese and shell metacharacters in plugin paths, and with startup/resume/clear/compact input values.
- The initial implementation's Linux generator check and all 414 existing-plus-focused tests passed using Bun 1.3.14 and Node 24.16.0. A Linux filesystem copy was used for Unix mode and symlink fixtures.
- Codex CLI 0.159.3 discovered and installed this local package in an isolated profile. All 54 skill directories and 206 installed source files matched. `tools/smoke-install.mjs` reproduces the check without changing the normal profile. The Windows CI job runs it with a locked CLI dependency.
- Claude Code 2.1.286 validated the plugin manifest with no errors or warnings. This is manifest validation, not interactive skill invocation.
- Markdown lint, offline local links, actionlint and the repository's GitHub workflow/dependabot zizmor audit passed. The Windows CI dependency was locked and its npm installation smoke was also executed locally.
- The original Windows baseline had 236 passing tests, 60 failing tests and three errors. Causes included CRLF heading anchors, Windows separators in logical generator keys, executable bits and symlink creation. LF checkout rules and logical path normalization fix the relevant generation failures. Full Unix tooling portability is outside this identity-and-hook unit.

The user changed the name to `pstack-mod` on 2026-10-02. Display name, both host and marketplace identities, generated calls, sheet references and documentation now use that name. The design document is `PSTACK_MOD_DESIGN.md`. Rename verification passed Windows's 50 focused tests and Linux's 280 related tests, generation checks on both platforms, isolated Codex installation of 54 skills and 206 matching files, Claude manifest validation, Markdown lint and offline links. The `0.1.0` preview is published on `main`.

Host-level untrusted/disabled behavior and fresh interactive discovery of pstack-mod are not yet verified. The script suite establishes launcher and output behavior, not whether a host schedules the command. No installed plugin replacement or model API call was made. See [local migration and rollback](LOCAL_INSTALL.md).

Japanese is the default repository README at `README.md`, with an English version at `README.en.md` and links to switch between them. Both include installation from the GitHub marketplace and local testing. Both manifests now reference the user's actual repository. The generator and documentation checks include the English README.

Bilingual README validation passed 83 related generator, documentation-fact and identity tests, generation checks, Markdown lint and offline local links. The existing Windows and Linux routing verification remains recorded above. The first push completed, and GitHub's default README is the Japanese version.

Next: verify pstack-mod in fresh interactive host sessions before migration; choose upstream sync automation; then refine vendor-specific model setup and phase guidance.
