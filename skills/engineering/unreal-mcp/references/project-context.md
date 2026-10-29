# Project context for the agent

The upstream plugin shipped a Claude Code `SessionStart` hook that injected a short Unreal Engine context note. A hook is harness-specific. The portable equivalent is an instruction file that the harness reads at session start.

Add the block below to the instruction file your harness uses:

| Harness | File |
|---|---|
| Claude Code | `CLAUDE.md` |
| Codex | `AGENTS.md` |
| OpenCode | `AGENTS.md` |

OpenCode V2 reads `AGENTS.md` and does not use `CLAUDE.md` as a fallback. If you keep project instructions in a separate file, add that file to the `instructions` array in `opencode.json`.

```md
## Unreal Engine

This working directory is an Unreal Engine project. Prefer Unreal Engine conventions (C++/UObject patterns, Slate, UHT reflection) when suggesting code. Use the `unreal-mcp` skill for tasks that drive the Unreal Editor through MCP.
```

The upstream hook walked up from the working directory to find a `.uproject` or `GenerateProjectFiles` marker. The block above assumes the session starts inside the project. If it starts in a subdirectory, place the block at the project root so the nearest `AGENTS.md` or `CLAUDE.md` carries it.

If the server is not configured yet, the `unreal-mcp` skill walks through `references/setup.md` for Claude Code, Codex, and OpenCode.
