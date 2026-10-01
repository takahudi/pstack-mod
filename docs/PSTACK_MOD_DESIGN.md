# pstack-mod identity and optional routing design

## Problem

The personal port must coexist with Matt Pocock's plugin in Codex and Claude Code. Both existing manifests call this plugin `pstack`, its Codex prompts invoke bare skill names, and its hook executes a shell script that enables routing when no setting exists. The upstream conversion boundary must remain recognizable.

## Usage

The user selected display name `pstack-mod` and namespace `pstack-mod` on 2026-10-02. Both marketplaces use `pstack-mod`. Invoke `pstack-mod:architect` or `mattpocock-skills:code-review` explicitly. Leaf skill names and the physical `plugins/pstack` directory stay stable.

Run `pstack-mod:setup-pstack` to configure models or routing. The runtime's `pstack-mod-models.md` contains `session hook: off` by default. Only a single explicit `session hook: on` enables routing. Reconfiguration preserves an existing valid choice unless the user asks to change it. Model-only changes preserve the choice. Hook-only changes preserve the model rows.

Claude reads the sheet under `CLAUDE_CONFIG_DIR`, or the user's `.claude` directory. Codex reads it under `CODEX_HOME`, or the user's `.codex` directory. Old `pstack-models.md` is never an implicit fallback. Setup migration requires an explicit selection of the old values.

## Traced ownership

Cursor subtree and substitutions → `syncComponent` → `deriveSkill` → three-way comparison → generator plan → committed runtime files. `tools/upstream.json` owns the upstream component and physical path. `tools/forks.json` declares deviations from the derived source. The local identity transform belongs in common derivation, so it applies before comparing both upstream revisions.

Host manifests → hook definitions → Node entry point → runtime sheet → context next to the entry point. The hook reads local files and emits context. Host trust and disable controls decide whether the entry point runs.

## Shape

One local identity JSON supplies the namespace and display name. The sheet filename and marketplace name derive from that namespace. The generator stamps host and discovery metadata, qualifies prompt calls, and converts canonical upstream identifiers and sheet references. A subsequent rename recognizes the prior matching manifest identity. It preserves third-party namespaces, source URLs, attribution and release history.

```js
loadIdentity(root) // { name, displayName }, validated at this boundary
adaptIdentity(text, identity, previousName = "pstack") // idempotent local rendering
deriveSkill(file, text, models, leads, identity) // canonical conversion then local identity
promptStub(skill, { preamble, identity }) // qualified invocation
validateIdentity(root, identity) // manifests, active IDs, discovery

sessionHookEnabled(text) // one valid explicit on, otherwise false
settingPath(runtime, env, home, sheetName) // runtime-isolated path
sessionContext(runtime) // reads sheet, then context only if enabled
```

Use POSIX paths for logical sync keys on Windows. Runtime filesystem paths use Node's platform path handling. Keep LF checkout text across hosts so generator anchors and upstream comparisons agree.

Claude launches `node` with an argument array, using the host's exec form. Codex uses a quoted POSIX command and its `commandWindows` override with PowerShell environment syntax. Both launch the same `.mjs` file and pass their runtime explicitly. Node.js 18 or later must be on the host's PATH.

## Synthesis decision

The namespace explorer's identity transform is the base. The hook explorer's single Markdown sheet and explicit-on parser are incorporated. These concentrate runtime policy in existing generator/setup boundaries. Renaming the physical tree would churn upstream paths and fork declarations. A separate hook JSON would add a second configuration store without a present consumer that needs it. Global branding replacement would corrupt attribution and third-party identities.

An independent design judge agreed with this choice and required real PowerShell execution, third-party preservation, runtime isolation and a clear distinction between command tests and host trust behavior. Both explorers and the judge used the inherited model, so this comparison did not provide model diversity.

## Tradeoffs accepted

- The internal directory retains its upstream name to keep sync ownership stable.
- Routing depends on Node on PATH. It needs no shell utilities or third-party Node packages.
- Host trust, hook disabling, and interactive skill discovery require host-level evidence. Script tests do not establish those behaviors.
- No publication, replacement of the installed plugin, or automatic configuration migration is part of this change.

## Implementation reconciliation

The unmodified Windows checkout failed generation because CRLF left carriage returns in heading anchors. Explicit LF checkout rules and normalization of existing tracked text address this before changing behavior. Baseline failures and final verification are recorded in the handoff.

The identity source is shipped at `plugins/pstack/identity.json` so the hook can derive its sheet filename without reaching maintainer-only tooling. Both sync and generation load that source. The local preview starts its own version series at `0.1.0`, while the imported port and Cursor revisions are recorded separately. The user created `takahudi/pstack-mod` on 2026-10-02, and both manifests now reference that repository. The installation smoke uses an isolated Codex profile and compares every installed file with its source. The root `README.md` is Japanese, with `README.en.md` as the linked English version; both document GitHub and local installation.

## Work sequence

1. Ground the generator, upstream conversion, hook, setup and manifests. Complete.
2. Compare identity transformation and tree relocation; compare shared Markdown and separate hook JSON. Complete.
3. Synthesize and record the contract; receive the namespace selection. Complete.
4. Implement identity, optional Node hook and focused checks. Complete.
5. Verify generated files, hook commands on Windows, local host discovery and CI checks. Command and static checks complete; interactive discovery and host trust behavior remain open in the [handoff](WORKFLOW_PORT.md#current-local-state-and-verification-2026-10-02).

## Open work

Repository visibility, scheduled sync PR automation, model routing refinements, and first-release skill curation remain separate decisions. GitHub repository creation and push are explicitly deferred.

## Sources

- [Codex plugin package and trust](https://developers.openai.com/plugins/build/plugins)
- [Codex hooks and commandWindows](https://learn.chatgpt.com/docs/hooks)
- [Claude hook exec form](https://code.claude.com/docs/en/hooks#exec-form-and-shell-form)
