## What it does

`unreal-mcp` drives a live Unreal Editor through the Unreal MCP (Model Context Protocol) server. It covers level actors, Blueprints, materials, Niagara, Sequencer, Control Rigs, GAS, automation tests, Live Coding, and the other toolsets the editor registers. The [agent](https://www.aihero.dev/ai-coding-dictionary/agent) inspects and changes editor state directly instead of writing instructions for you to follow by hand.

The skill treats the live inventory as the authority and discovers toolsets at runtime. It never relies on a remembered list of tools, because toolsets change with engine versions and enabled plugins. MCP is optional as well: when the server is unavailable, the same work can be done from engine console commands and the editor UI.

## When to reach for it

Type `/unreal-mcp`, or the agent reaches for it automatically when a task fits.

Reach for it when the work is inside an Unreal Engine project and needs the editor: spawning or moving actors, editing a Blueprint or material, reading a property, running an automation test, or recompiling C++ with Live Coding. For an in-editor Agent Skill, use [unreal-skill](https://github.com/axefield/drawfourgon/blob/main/docs/engineering/unreal-skill.md). For a new AI-callable tool, use [create-toolset](https://github.com/axefield/drawfourgon/blob/main/docs/engineering/create-toolset.md). Pure conceptual questions about Unreal do not need the editor connection.

## Prerequisites

The project needs the `ModelContextProtocol` and `AllToolsets` plugins enabled, the MCP server running, and a client entry for your [harness](https://www.aihero.dev/ai-coding-dictionary/harness). The skill walks through the client setup for Claude Code, Codex, and OpenCode in its `references/setup.md`. A project that is already open in the editor is the normal starting point, and saving before bulk changes is part of the work rather than an optional extra.

## The live inventory is the truth

Tool discovery is the leading idea. Start with `list_toolsets`, then `describe_toolset` on the candidate, then dispatch the call through `call_tool`. The tool names do not live in the [context window](https://www.aihero.dev/ai-coding-dictionary/context-window), which keeps the prompt small and the cache warm. A recorded inventory in a setup note is useful context, not a substitute for the call.

The same discovery applies to project Agent Skills. `AgentSkillToolset.ListSkills` shows what the project registers, and `AgentSkillToolset.GetSkills` loads the full instructions. A relevant project skill outranks the agent's generic defaults, because it exists to capture the project's way of doing something.

## Evidence, not editor theatre

A Blueprint change is a binary asset diff, so a review needs graph evidence, the asset path, and the build that ran it. A successful graph compile is not a build. An editor inspection or a Play-in-Editor session is not a playtest either; a playtest state such as `accepted` still needs a human in a build.

MCP calls can return a failure status without raising, and some edits are not undoable across compilation boundaries. The skill treats an ambiguous result as a stop, asks for a save point before bulk changes, and serialises dependent mutations.

## Common questions

**Is MCP required?** No. The skill works from engine console commands and the editor UI when the server is unavailable. MCP is the faster path, not the only one.

**Does it work in Codex and OpenCode?** Yes. The server is the same; only the client configuration differs. Claude Code uses `.mcp.json`, Codex uses `.codex/config.toml`, and OpenCode uses `opencode.json`.

**Is a PIE session a playtest?** No. It is useful evidence for the editor session, but a playtest still needs a human in a build.

## It's working if

- The agent calls `list_toolsets` before naming a tool, and does not quote a stale inventory.
- A change comes back with the asset path and the tool result that proves it.
- A failed or ambiguous tool result stops the work instead of becoming a success claim.
- The agent asks for a save point before a bulk edit.
- Nobody calls a PIE session a playtest.

## Where it fits

`unreal-mcp` is a reach-for-it-anytime standalone for Unreal Engine work, not a step in the main engineering flow. It sits beside [unreal-skill](https://github.com/axefield/drawfourgon/blob/main/docs/engineering/unreal-skill.md) for authoring in-editor skills and [create-toolset](https://github.com/axefield/drawfourgon/blob/main/docs/engineering/create-toolset.md) for adding tools, because both extend the same editor surface the skill drives. For the whole set, see [ask-truligon](https://github.com/axefield/drawfourgon/blob/main/docs/engineering/ask-truligon.md).
