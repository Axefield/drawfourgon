---
name: unreal-mcp
description: "Use this skill to perform actions inside an Unreal Engine project via a live-editor MCP connection. Trigger when the user wants to change, query, or run something in their Unreal Engine project, not for conceptual or docs questions. Concrete triggers: spawn/move/duplicate/transform actors in a level, open a `.uproject`, add things around a PlayerStart, create or edit a Blueprint/Widget/Material/Niagara/Control Rig/Sequencer/Behavior Tree/GAS ability, read or write properties on actors (e.g. `bIsLocked` on `BP_DoorActor`), Live Coding recompile after editing C++ (`AActor`, `UMyComponent::Method`, `UPROPERTY`), or modify Static/Skeletal Mesh assets. Treat as Unreal context even without the word \"Unreal\": asset prefixes `BP_`, `WBP_`, `M_`, `MI_`, `NS_`, `CR_`, `SK_`, `SM_`, `ABP_`; UE C++ types/macros; `.uproject`; Content Browser; Outliner; PlayerStart; \"in my game\" plus UE signals. Skip for: pure conceptual/docs questions, Unity, Godot, or unrelated uses of \"blueprint\"/\"sequencer\"/\"widget\"."
---

# Unreal MCP

You are wired into a live Unreal Editor through the `unreal-mcp` MCP server. If the connection is not configured yet, start with `references/setup.md`; the work is still possible from engine console commands and the editor UI. The server exposes hundreds of tools across 30+ toolsets (actors, blueprints, materials, Niagara, Sequencer, Control Rigs, GAS, automation tests, Live Coding, and more) registered through Unreal's `ToolsetRegistry`. Use it to inspect and mutate live editor state instead of telling the user to do it manually.

You don't need to memorise tool names. The flow below has you discover them on demand.

The connection can appear as `unreal-mcp-proxy` when the engine's optional proxy is installed. Use that connection for Unreal tools. The proxy keeps Unreal's native tool definitions; it does not introduce replacement discovery or dispatch tools. See `references/setup.md` for installation.

## First step every time: discover the tool you need, then dispatch it via `call_tool`

Tool search is on by default, so the MCP server advertises only three meta-tools for the whole session: `list_toolsets`, `describe_toolset`, and `call_tool`. Tool names like `BlueprintTools.create` or `SequencerTools.create_level_sequence` are **not in `tools/list`**. They are dispatched server-side through `call_tool` and never registered as native MCP tools. This is deliberate. It keeps your context window small and the prompt cache warm.

When you start work:

1. Call `list_toolsets` to see what's registered, then `describe_toolset` on the candidate(s) to read their tool schemas. If you already know which toolset you need (the user said "make a Blueprint" → the Blueprint toolset), skip the listing and go straight to `describe_toolset` to confirm the available tools and their signatures.
2. Invoke the tool with `call_tool`: pass `toolset_name`, `tool_name`, and an `arguments` object matching the schema you just read. The result comes back on the same turn. No extra round-trip needed.
3. Top-level dispatch (omitting `toolset_name`) is reserved for tools registered directly on the MCP server and is rejected for `call_tool` itself.

Missing tools do not prove that the editor is stopped. Check the configured `unreal-mcp` or `unreal-mcp-proxy` connection and follow `references/operations.md`. A proxy can stay connected while Unreal is unavailable, and a client can keep a stale catalogue after recovery. `unreal_mcp_status` reports the proxy's session state, not current reachability. Verify recovery with a read-only Unreal tool call. For first-time configuration, follow `references/setup.md`.

## Safety rules

Follow these rules to protect live editor state.

- **Save first, then save again.** Tell the user to save the project (or call `AssetTools` save APIs) before any bulk change, and again after. MCP edits are not always undoable, especially across compilation boundaries. Treat anything that touches multiple assets as a destructive operation that needs a recovery point.
- **Wait for compilation.** If C++ or shader compilation is in flight, your tool calls will hang or fail in confusing ways. To rebuild C++ from the running editor, drive `LiveCodingToolset.CompileLiveCoding` and wait on its result instead of asking the user to switch to the IDE. That tool blocks until the compile actually finishes and surfaces MSVC diagnostics.
- **Control concurrent calls.** MCP accepts concurrent requests and handles dispatch synchronisation. Asynchronous tools can overlap, and request order does not guarantee execution or completion order. Serialise dependent calls and mutations that can affect the same asset or editor state. Use parallel calls only for independent work when the tools support safe overlap. Multiple agents can use one editor, but their conflicting changes can cause adverse effects.
- **Always check the result.** Blueprint compilation, widget creation, material edits: many tools return a status that flips between success and failure with no exception thrown on the wire. Read the response before moving on. Treat anything that isn't an explicit success as a stop.
- **Mind PIE.** Editor-only tools (asset creation in particular) behave differently while Play-in-Editor is active. If a result looks wrong, check whether PIE is running and stop it if so.

## Evidence and verification

- **The live inventory is the truth.** `list_toolsets` is authoritative even when a setup note records a verified list. Toolsets change with engine versions and enabled plugins, so record what the call returns rather than trusting a remembered inventory.
- **MCP is optional.** The work can be done from engine console commands and the editor UI when the server is unavailable. Treat MCP as an accelerator, never as a requirement for the task to be possible.
- **Editor evidence is not a playtest.** An editor inspection, `StartPIE`, or a PIE session is not a human playtest. A playtest state such as `accepted` still needs a human in a build.
- **Blueprint changes need evidence.** A Blueprint change is a binary asset diff. Review it with graph evidence (`BlueprintTools.read_graph_dsl` or a screenshot), the asset path, and the build that ran it. A successful graph compile is not a build.

## Project skills

A project or plugin can register **Agent Skills**: named bundles of instructions that capture workflow knowledge the agent wouldn't otherwise have (a project's naming conventions, folder layout, required setup steps, or the canonical sequence for a multi-step task). These are separate from the toolsets themselves and are reached through the agent skill toolset (`AgentSkillToolset`), not through `list_toolsets`.

Check for them the same way you discover tools, and do it whenever you start unfamiliar work in a project rather than just once:

1. Call `AgentSkillToolset.ListSkills` (through `call_tool`) to see what skills the project registers. Each entry carries a short description of what it covers and when it applies.
2. If a skill's description looks relevant to what the user asked, call `AgentSkillToolset.GetSkills` on it to load the full instructions, then follow them.
3. If nothing matches, fall back to the tool-discovery flow above.

A relevant project skill's instructions take precedence over your generic defaults: it exists precisely because the project's way of doing something differs from the obvious one. (Authoring or editing these skills is a separate task: call the Skill tool with `unreal-skill`, covered below.)

## Reference files

- `references/setup.md`: first-time MCP server setup and client configuration for Claude Code, Codex, and OpenCode, plus optional proxy installation.
- `references/operations.md`: console commands, settings, proxy recovery, and troubleshooting for missing tools or failed calls.
- `references/project-context.md`: the portable project context block that replaces the upstream Claude-only SessionStart hook.
- `references/claude-code-mcp.json`, `references/codex-config.toml`, and `references/opencode.jsonc`: copyable client configuration examples.

## Companion skills

- **`create-toolset`**: call the Skill tool with `create-toolset` when authoring a new toolset or adding tools to an existing one. Covers design principles, C++ and Python conventions, registration, error handling, and testing.
- **`unreal-skill`**: call the Skill tool with `unreal-skill` when creating, updating, or reviewing an Agent Skill. Covers what makes a good skill and how to structure one.

## Source

Adapted from [Epic Games' Unreal Engine Skills for Claude Code](https://github.com/EpicGames/unreal-engine-skills-for-claude-code-plugin), copyright (c) 2026 Epic Games, Inc., MIT licensed. Modifications copyright (c) 2026 Truligon. See [THIRD_PARTY_NOTICES.md](../../../THIRD_PARTY_NOTICES.md).
