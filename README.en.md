# pstack-mod

[日本語](README.md) | [English](README.en.md)

pstack-mod is takahudi's personal adaptation of Lauren Tan's [pstack](https://github.com/cursor/plugins/tree/main/pstack), based on [Michael Denyer's port](https://github.com/michael-denyer/pstack-claude). Its namespace is `pstack-mod` in Codex and Claude Code. Upstream skill content and local runtime adaptations remain distinguishable through [`tools/forks.json`](tools/forks.json) and [the design](docs/PSTACK_MOD_DESIGN.md).

Tell `pstack-mod:poteto-mode` your goal and it will invoke the workflow that fits the task. It keeps your code concise, simple and verified.

## Install

### Claude Code

Run in Claude Code to register the GitHub marketplace and install the plugin:

```text
/plugin marketplace add takahudi/pstack-mod
/plugin install pstack-mod@pstack-mod
```

### Codex

Run in your terminal:

```shell
codex plugin marketplace add takahudi/pstack-mod
codex plugin add pstack-mod@pstack-mod
```

Start a new session after installation. Invoke `pstack-mod:setup-pstack` to choose runtime-specific models and reasoning effort, or enable automatic routing. Routing defaults to off. Only an explicit `session hook: on` in the runtime's `pstack-mod-models.md` enables it, and model updates preserve that choice. The optional hook requires Node.js 18 or later on PATH. Codex also requires trust through `/hooks`. See [migration, update and rollback](docs/LOCAL_INSTALL.md) before replacing the old plugin.

For Prime Agent, OpenCode, Gemini CLI, or skills-only installs for any harness, see [shared installation](docs/reference.md#shared-skills-installation).

### Try the local checkout

For a temporary Claude Code session, run from this checkout:

```shell
claude --plugin-dir ./plugins/pstack
```

For a local Codex marketplace, register this checkout instead of the GitHub source:

```shell
codex plugin marketplace add .
codex plugin add pstack-mod@pstack-mod
```

## Getting started

```text
Use pstack-mod:poteto-mode to fix the search filter resetting when I change pages.
```

For a bug, it reproduces the failure, uses `how` and `why` to investigate, delegates the fix, then reruns the failing case. If the fix crosses a function boundary, it brings in `architect` before implementation. You receive the fix and the failing and passing evidence.

[Other playbooks](plugins/pstack/skills/poteto-mode/SKILL.md#playbooks) cover planning, features, refactoring, performance issues, investigations, prototypes, PR maintenance, shipping, and longer projects.

![A request enters poteto-mode. Playbook options include Plan, Bugs, Features, and Refactor. Planning can use architect, arena, or swarm; review and verification can use interrogate, tests, and measurements. Supporting skills include how, why, and unslop. The output is Finished work validated.](assets/pstack-overview.png)

## Details

- [Skills and slash commands](docs/reference.md#slash-commands)
- [Runtime setup](docs/reference.md#runtime-support)
- [Models and dependencies](docs/reference.md#configuration-and-dependencies)
- [Maintenance and port scope](docs/reference.md#maintenance)

## Data handling

pstack-mod has no server or telemetry. Anything its skills ask your agent to read, including session transcripts, goes to your model provider. Scripts run locally, and PR tools use your GitHub CLI login.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the checks and where a change belongs. Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## License

This adaptation preserves the [MIT license](LICENSE) and upstream attribution. Michael Denyer's port is © 2026 Michael Denyer. Original pstack is © 2026 Lauren Tan; imported cursor-team-kit skills are © 2026 Cursor. See [LICENSE-cursor-team-kit](LICENSE-cursor-team-kit) and [NOTICE.md](NOTICE.md).
