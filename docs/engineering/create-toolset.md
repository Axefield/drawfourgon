## What it does

`create-toolset` authors or extends an Unreal Engine toolset: a class of static, AI-callable functions registered with `ToolsetRegistry` and exposed through the Unreal MCP (Model Context Protocol) server. It covers the design pass, C++ and Python conventions, registration, error handling, documentation, and the tests that make a tool safe to call.

The API is designed for an [agent](https://www.aihero.dev/ai-coding-dictionary/agent), not mirrored from Unreal's existing API. The toolset has to be self-describing, because the agent discovers it at runtime through `list_toolsets` and `describe_toolset`. A clean, composable surface with real types beats a thin wrapper around a complex engine interface.

## When to reach for it

Type `/create-toolset`, or the agent reaches for it automatically when a task fits.

Reach for it when you want to add or expose a tool, create a new toolset, extend an existing one, or edit files under a `Toolsets/` folder. For invoking existing tools at runtime, use [unreal-mcp](https://github.com/axefield/drawfourgon/blob/main/docs/engineering/unreal-mcp.md). For an in-editor Agent Skill, use [unreal-skill](https://github.com/axefield/drawfourgon/blob/main/docs/engineering/unreal-skill.md). A refactor that happens to touch a toolset file but does not add or redesign a tool is ordinary code work.

## Prerequisites

You need access to the Unreal engine or plugin source and a way to compile it. Python work also needs the Python stubs, which come from Developer Mode in the Python project settings. Testing needs either a live editor with the Unreal MCP connection or `UnrealEditor-Cmd` for a headless run. A source-controlled save point is worth having before a new toolset changes a running project.

## Design for the caller

The leading idea is that a toolset is an interface for an agent, so the same rules that make a good module apply. Keep it clean, complete, composable, and DRY. If an operation can set a value, it should be able to read it. If it can create, it should usually be able to delete. If a tool already exists in another toolset, call it or point to it instead of reimplementing it.

Types carry meaning. Use the actual type, not a JSON string in disguise. Errors are raised, not returned as a boolean or a result wrapper. Every tool is documented at the level the agent sees, and every parameter and return value earns its description by stating what the signature cannot.

## C++ and Python

| Language | Reach for it when | What to expect |
|---|---|---|
| Python | The stubs cover the APIs you need | Faster iteration, with registration through the plugin's Python package |
| C++ | Python coverage is thin or missing | Full engine access, with `UFUNCTION(meta = (AICallable))` methods and a compile step |

Both paths need tests for the success path and every raise path. Run them through the live editor when one is available, and through the command line when it is not.

## Common questions

**C++ or Python?** Prefer Python when the stubs cover the work. Choose C++ when the APIs are missing or the tool needs engine-level access. Do not build a fragile workaround in either language; stop and extend the engine instead.

**Does a new toolset need its own plugin?** Not by default. Add it to the plugin that already owns the domain. A separate plugin is for a genuinely distinct domain, and the user should make that call when it is not obvious.

## It's working if

- `list_toolsets` shows the toolset after registration.
- `describe_toolset` gives the agent enough to choose the right tool without reading the source.
- Every tool has a success test and a test for each raise path.
- The toolset does not duplicate a tool that already exists elsewhere.
- A failure raises, and a success returns data rather than a status wrapper.

## Where it fits

`create-toolset` is an extension-authoring skill, used before or alongside [unreal-mcp](https://github.com/axefield/drawfourgon/blob/main/docs/engineering/unreal-mcp.md) when the editor needs a capability it does not already expose. [unreal-skill](https://github.com/axefield/drawfourgon/blob/main/docs/engineering/unreal-skill.md) is the neighbour for packaging the workflow guidance around those tools. For the whole set, see [ask-truligon](https://github.com/axefield/drawfourgon/blob/main/docs/engineering/ask-truligon.md).
