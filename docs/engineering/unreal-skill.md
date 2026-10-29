## What it does

`unreal-skill` authors and reviews Unreal Engine Agent Skills: named bundles of instructions registered with the Unreal MCP (Model Context Protocol) server for the in-editor agent to load. It covers both implementation paths, a Python class inside a plugin and a UAsset in the Content Browser, plus the review pass that checks whether the description and instructions will actually fire.

These are not [harness](https://www.aihero.dev/ai-coding-dictionary/harness) skills. A harness skill lives in a directory such as `.claude/skills/`, `.opencode/skills/`, or `.agents/skills/` and is loaded by the coding agent. An Unreal Agent Skill lives in the project or a plugin and is loaded through `AgentSkillToolset` inside the editor. The two share a format, not a runtime.

## When to reach for it

Type `/unreal-skill`, or the [agent](https://www.aihero.dev/ai-coding-dictionary/agent) reaches for it automatically when a task fits.

Reach for it when you want to create, edit, or review an in-editor Agent Skill: a workflow that the editor agent should follow, a project convention it should know, or a skill UAsset that packages that guidance. For work that drives the editor, use [unreal-mcp](https://github.com/axefield/drawfourgon/blob/main/docs/engineering/unreal-mcp.md). For a new AI-callable tool, use [create-toolset](https://github.com/axefield/drawfourgon/blob/main/docs/engineering/create-toolset.md). Generic uses of the word "skill" do not belong here.

## Prerequisites

The editor should be running. Discovery normally uses `ListSkills` and `GetSkills` through MCP; when it is unavailable, inspect the project's skill folders and Content Browser directly. A Python skill needs a plugin that already ships Python toolsets and can be reloaded. A UAsset skill needs a Content Browser folder, and no code. Creating a UAsset skill uses `CreateSkill` through MCP when it is available; updating one uses `UpdateSkill`.

## A briefing, not documentation

The leading idea is that a good skill reads like a briefing for a knowledgeable colleague. Assume the reader understands Unreal. Give them what they need to act, and cut the explanation of how everything works. A skill that restates what the tools already teach spends [context window](https://www.aihero.dev/ai-coding-dictionary/context-window) without changing behaviour.

The same test applies to the description. It is loaded at discovery time, before the full instructions, so it has to say when the skill applies in one or two sentences. If an agent reading only the description cannot tell whether to activate it, the description needs work.

## Two paths

| Path | Use it when | What you get |
|---|---|---|
| Python class | The skill belongs to a code plugin and should be version-controlled with it | A `UAgentSkill` subclass registered on import |
| UAsset | The skill is project-specific and does not belong in a plugin | A Content Browser asset created and updated through MCP |

Both paths end with the same review: call `GetSkills` on the result and read the description and instructions as the agent will see them.

## Common questions

**Is this the same as a Claude Code skill?** No. It is an in-editor Unreal Agent Skill, registered with the Unreal MCP server. The harness skills in this repo are a different mechanism.

**Where should the skill live?** A plugin that already ships Python toolsets is the natural home for a Python skill. A project-specific workflow with no code belongs in a UAsset under a Content Browser folder.

## It's working if

- The description says when the skill applies without needing the instructions.
- The instructions teach something the agent could not learn by calling a tool.
- The skill avoids property and tool names that will change under it.
- `GetSkills` returns the skill, and its description and instructions read well together.
- The review ends with a concrete edit or a clear decision to ship, not a summary of the skill.

## Where it fits

`unreal-skill` is an authoring companion to [unreal-mcp](https://github.com/axefield/drawfourgon/blob/main/docs/engineering/unreal-mcp.md), used when the editor should carry reusable workflow knowledge rather than a one-off instruction. [create-toolset](https://github.com/axefield/drawfourgon/blob/main/docs/engineering/create-toolset.md) is the neighbouring authoring skill for the tools a skill might tell the agent to use. For the whole set, see [ask-truligon](https://github.com/axefield/drawfourgon/blob/main/docs/engineering/ask-truligon.md).
