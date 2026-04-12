---
date: 2026-04-12
topic: Nanobanana — Extract from AT to Universal Package
type: feasibility
status: complete
github_issue: null
items_researched: 5
---

# Research: Nanobanana — Extract from AT to Universal Package

## Context

Nanobanana is an image generation wrapper around Google's Gemini CLI extension (`gemini-cli-extensions/nanobanana`). Currently lives in `packages/agent-tools/src/nanobanana/index.ts` (191 lines) as a thin CLI wrapper that shells out to the `gemini` binary. Goal: move to `packages/nanobanana/` as a standalone package covering all upstream plugin options, usable as both a Gemini CLI extension and a direct CLI/MCP tool.

## Scope

| Item | Fields | Sources |
|------|--------|---------|
| Current coupling | Imports, utils, shared state, extraction difficulty | `packages/agent-tools/src/` |
| Gemini CLI extension format | Manifest, commands, MCP server structure | `github.com/gemini-cli-extensions/nanobanana` |
| Upstream feature gap | Missing options, subcommands, parameters | Upstream repo vs our wrapper |
| Package structure | Location, dual-install, monorepo patterns | `packages/`, `pnpm-workspace.yaml` |
| MCP server integration | Existing MCP usage, cost/benefit, architecture fit | `.mcp.json`, `.claude/settings.json`, git history |

## Findings

### 1. Current Coupling Analysis

**Verdict: Trivially extractable.**

| Aspect | Detail |
|--------|--------|
| External deps | Zero — only Node.js builtins (`child_process`, `fs`, `path`) |
| Internal imports | One: `checkDependency('gemini')` from `../utils/dependencies.ts` |
| CLI helpers | `parseFlag()` and `getFlagValueIndices()` — defined locally in `cli.ts`, not exported (~24 lines total) |
| Shared state/config | None — no env vars, no config files, no cross-command state |
| Tests | None exist |
| Package exports | Not exported from `@baseplane/agent-tools` — internal CLI command only |

**Extraction path:** Copy `index.ts` + inline `checkDependency` (18 lines) + inline `parseFlag`/`getFlagValueIndices` (24 lines). Remove CLI registration from `cli.ts:793-830`. Zero breaking changes to agent-tools.

### 2. Gemini CLI Extension Format

Extensions follow a 3-layer architecture:

```
extension/
├── gemini-extension.json      # Manifest: name, version, MCP server config, settings
├── GEMINI.md                  # Context doc loaded by LLM
├── commands/*.toml            # Command definitions with validation rules + tool routing
└── mcp-server/                # TypeScript MCP server (stdio transport)
    ├── src/index.ts           # Server + tool definitions
    ├── src/imageGenerator.ts  # API integration (Google GenAI SDK)
    ├── src/fileHandler.ts     # File I/O
    └── src/types.ts
```

**Key manifest fields:**
- `mcpServers[].command` / `args` — how to spawn the server (`node ${extensionPath}/mcp-server/dist/index.js`)
- `settings[].environmentVariable` — API key configuration (`NANOBANANA_API_KEY`)
- `contextFileName` — points to `GEMINI.md`

**Installation:** `gemini extensions install <github-url>` → clones repo → runs `npm install` (triggers postinstall build) → scans `commands/` for `.toml` files → registers MCP server.

**40+ extensions** in the `gemini-cli-extensions` org all follow this pattern.

### 3. Upstream Feature Gap

Our wrapper exposes roughly **15% of upstream capabilities**. Full gap:

| Command | Our Wrapper | Upstream | Gap |
|---------|-------------|----------|-----|
| **generate** | `-n`, `--style` | `--count`, `--styles` (10+), `--variations` (7 types: lighting/angle/color-palette/composition/mood/season/time-of-day), `--format` (grid/separate), `--seed`, `--preview` | Medium |
| **edit** | filename + instructions | + `--preview` | Low |
| **restore** | filename only | + instructions + `--preview` | Medium |
| **icon** | generic description | `--sizes` (16-1024), `--type` (app-icon/favicon/ui-element), `--style` (flat/skeuomorphic/minimal/modern), `--format` (png/jpeg), `--background`, `--corners` | **High** |
| **pattern** | generic description | `--size` (WxH), `--type` (seamless/texture/wallpaper), `--style` (geometric/organic/abstract/floral/tech), `--density`, `--colors`, `--repeat` (tile/mirror) | **High** |
| **diagram** | generic description | `--type` (flowchart/architecture/network/database/wireframe/mindmap/sequence), `--style`, `--layout` (horizontal/vertical/hierarchical/circular), `--complexity`, `--colors`, `--annotations` | **High** |
| **story** | **MISSING** | `--steps` (2-8), `--type` (story/process/tutorial/timeline), `--style`, `--layout` (separate/grid/comic), `--transition` (smooth/dramatic/fade) | **High** |
| **nanobanana** (router) | N/A | Natural language intent classifier → routes to appropriate tool | Low |

**Priority features for our use cases (dev tooling, documentation):**
1. **Story subcommand** — tutorials, process docs, timelines (missing entirely)
2. **Diagram `--type`** — we force all to generic; upstream has 7 types including architecture, wireframe, mindmap
3. **Icon `--sizes` + `--type`** — favicon vs app-icon distinction matters for build pipelines
4. **`--preview` flag** — preview before committing output
5. **`--seed`** — reproducible generation for consistent documentation

### 4. Package Structure Options

| Criterion | A: `packages/nanobanana/` | B: Standalone repo | C: Fork upstream + extend |
|---|---|---|---|
| Gemini `extensions install` | Needs manifest + build | Native | Native if standalone |
| Direct CLI (`npm -g`) | Yes via `bin` | Yes | Yes |
| Monorepo integration | Full (shared deps, CI) | None | Partial |
| Upstream tracking | Manual sync | Independent | npm dependency |
| Open-source friendly | Requires mono clone | Fully standalone | Fully standalone |
| Build complexity | Reuses tsup | Standalone tsup | Depends on upstream |
| Best for | Internal use + integration | Public/external use | Lightweight extension |

**Existing monorepo CLI patterns for reference:**

| Package | Type | Bin | Build |
|---------|------|-----|-------|
| `@baseplane/agent-tools` | Library+CLI | `at` | tsup |
| `@baseplane/data-cli` | Pure CLI | `bpd` | None (raw JS) |
| `@baseplane/github-cli` | Pure CLI | `bgh` | Shell scripts |
| `@baseplane/deploy` | Library+CLI | `deploy` | tsup |

### 5. MCP Server Integration

**Current state:** MCP is explicitly deferred in this codebase.
- `.mcp.json` is empty (`{ "mcpServers": {} }`)
- Commit `b18d06a34`: "remove Claude Agent SDK / MCP assumptions from architecture" — "Phase 1 agents work with code only"
- No `@modelcontextprotocol/sdk` in any `package.json`

**What MCP would buy us:**
- Direct tool availability in Claude Code without shelling out to `gemini` binary
- Structured JSON I/O instead of stdout/stderr parsing
- No external dependency on `gemini` CLI being globally installed
- Upstream already has a full MCP server implementation we can reuse

**Cost:** ~200-300 lines to adapt upstream MCP server. The `@modelcontextprotocol/sdk` is well-documented and the upstream `mcp-server/src/` has ready-made tool definitions for all 7 commands.

**Architecture fit:** Even though MCP is "deferred" for agent primitives, an image generation MCP tool is low-risk and self-contained. Registering in `.mcp.json` costs nothing and makes nanobanana available natively in Claude Code sessions.

## Comparison

### Recommended Structure: Shared local package at `/data/projects/packages/nanobanana/`

Lives outside any single monorepo so all local projects can reference it.

```
/data/projects/packages/nanobanana/
├── package.json              # nanobanana (not scoped — universal)
├── tsup.config.ts
├── tsconfig.json
├── src/
│   ├── index.ts              # Library exports (all 7 tools)
│   ├── cli.ts                # Direct CLI entry point
│   ├── image-generator.ts    # @google/genai API integration
│   ├── file-handler.ts       # Output naming, directories
│   ├── types.ts
│   └── mcp-server/
│       └── index.ts          # MCP server (stdio transport)
└── bin/
    └── nanobanana            # Executable wrapper
```

**Why shared local package:**
- Multiple projects need access (baseplane monorepo, kata-wm, duraclaw, etc.)
- Not tied to any single repo's build system or workspace
- `npm link` or direct path reference from any project
- Can register in any project's `.mcp.json` via absolute path
- No Gemini CLI extension boilerplate needed (that's Gemini's concern)

**Cross-project access patterns:**
```bash
# Global CLI (available everywhere)
npm link /data/projects/packages/nanobanana
nanobanana "prompt"

# MCP server (in any project's .mcp.json)
{ "mcpServers": { "nanobanana": { "command": "node", "args": ["/data/projects/packages/nanobanana/dist/mcp-server/index.js"] } } }

# From baseplane monorepo (optional convenience alias)
# root package.json: "nb": "node /data/projects/packages/nanobanana/dist/cli.js"
```

## Recommendations

1. **Create `/data/projects/packages/nanobanana/`** — standalone package, no monorepo dependency
2. **Port all 7 upstream MCP server tools** — closes the feature gap completely
3. **Call Gemini API directly** (via `@google/genai`) — no dependency on `gemini` CLI binary
4. **Add MCP server** — register in each project's `.mcp.json` for Claude Code access
5. **`npm link` globally** — makes `nanobanana` CLI available to all local projects
6. **Remove from agent-tools** — delete `src/nanobanana/` and CLI registration from baseplane's `cli.ts`

## Open Questions

1. **API key management** — Env var `NANOBANANA_API_KEY` (simplest for cross-project use) or shared dotfile (`~/.nanobanana`)?
2. **Output directory** — `nanobanana-output/` in CWD (upstream default) or `~/test-data/nanobanana/` (consistent with baseplane test media)?
3. **Git tracking** — Should `/data/projects/packages/` be its own git repo, or individual repos per package?

## Next Steps

1. Create `/data/projects/packages/nanobanana/` scaffold (`package.json`, `tsup.config.ts`, `tsconfig.json`)
2. Port upstream MCP server tools (imageGenerator, fileHandler, types, server index)
3. Write CLI wrapper (`src/cli.ts`) covering all 7 commands with full parameter support
4. `npm link` globally for universal CLI access
5. Register MCP server in baseplane `.mcp.json` and other projects as needed
6. Remove nanobanana from baseplane `packages/agent-tools/`
