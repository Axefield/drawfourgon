# First-Time MCP Server Setup

Read this for first-time MCP configuration or optional proxy installation. Steps 1-3 configure direct HTTP access. Step 4 adds a proxy that keeps the client session open while Unreal is unavailable. Step 5 covers several editors, and step 6 gives the agent project context.

The goal is four things:
1. Enable the `ModelContextProtocol` and `AllToolsets` plugins in the project.
2. Make the editor auto-start the MCP server on launch.
3. Connect your agent harness to the server: `.mcp.json` for Claude Code, `.codex/config.toml` for Codex, or `opencode.json` for OpenCode.
4. Optionally, give the agent a short project context note.

Walk the user through them in order. Do not skip the user's `.uproject` edit silently. Confirm the file path first.

## 1. Enable the plugins in the `.uproject`

Two plugins are required. `ModelContextProtocol` is the server and transport; `AllToolsets` provides the tools. With only `ModelContextProtocol` enabled the server starts but exposes no tools.

Open the project's `.uproject` file. In the `Plugins` array, ensure both entries:

```json
{
  "Name": "ModelContextProtocol",
  "Enabled": true
},
{
  "Name": "AllToolsets",
  "Enabled": true
}
```

If the array doesn't exist, create it. If either entry exists with `"Enabled": false`, flip it to `true`.

`AllToolsets` is an editor-only aggregator with `EnabledByDefault` off, so it must be enabled explicitly. To expose only a subset of tools, enable the specific toolset plugins you want instead of `AllToolsets`.

## 2. Enable auto-start

The default is for the MCP server to stay stopped. To start it manually in a session, run `ModelContextProtocol.StartServer` from the editor console.

To start it automatically on every editor launch, add the snippet below to the per-user editor config file:

`<Project>/Saved/Config/<Platform>Editor/EditorPerProjectUserSettings.ini`

This is the file the editor writes when you toggle the setting in Editor Preferences. It is per-user and not source-controlled.

```ini
[/Script/ModelContextProtocolEngine.ModelContextProtocolSettings]
bAutoStartServer=True
```

Optional overrides if the defaults conflict with another local service:

```ini
ServerPortNumber=8000
ServerUrlPath=/mcp
```

A command-line alternative also works: pass `-ModelContextProtocolStartServer` (and optionally `-ModelContextProtocolPort=<port>`) to the editor. Prefer the `.ini` because it's persistent.

## 3. Configure the client

The server is the same for every harness. Only the client config file and the command that generates it differ. Generate the config from the editor when the generator supports your harness, or hand-write the file.

The generator targets are `ClaudeCode`, `Cursor`, `VSCode`, `Gemini`, `Codex`, and `All`. OpenCode is not a generator target, so its config is always hand-written.

### Claude Code

Run `ModelContextProtocol.GenerateClientConfig ClaudeCode` in the editor console. Re-running merges into the existing JSON, so it is safe after changing the port or URL. This writes `.mcp.json`:

```json
{
  "mcpServers": {
    "unreal-mcp": {
      "type": "http",
      "url": "http://127.0.0.1:8000/mcp"
    }
  }
}
```

### Codex

Run `ModelContextProtocol.GenerateClientConfig Codex` in the editor console. This writes `.codex/config.toml`. The writer refuses to overwrite an existing file, so if one is already there, add the table by hand:

```toml
[mcp_servers.unreal-mcp]
url = "http://127.0.0.1:8000/mcp"
```

Codex reads `.codex/config.toml` in a trusted project, or `~/.codex/config.toml` for every project. Prefer the project file so the Unreal server is scoped to the project. Restart Codex after editing.

### OpenCode

OpenCode has no `GenerateClientConfig` target. Add the server under `mcp.servers` in `opencode.json` or `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "unreal-mcp": {
        "type": "remote",
        "url": "http://127.0.0.1:8000/mcp"
      }
    }
  }
}
```

Use a project `opencode.json` for one project, or the global `~/.config/opencode/opencode.json` for every project. OpenCode's Code Mode exposes the three meta-tools under the `unreal-mcp` server namespace, with the same names and arguments.

### Config file location

The destination for generated configs depends on the build kind:

- **Source build** (your repo contains `Engine/`): the file is written to the workspace root, alongside `Engine/`. Not next to the `.uproject`.
- **Installed/launcher build**: the file is written next to the `.uproject`.

For hand-written configs, follow the harness's own discovery rules. A project `opencode.json` sits at the project root. A project `.codex/config.toml` sits in the project root under `.codex/`.

Adjust the URL if the port or path was overridden in step 2. Copyable examples are in `references/claude-code-mcp.json`, `references/codex-config.toml`, and `references/opencode.jsonc`.

**Without launching the editor first** (for example, scripting a fresh-project bootstrap), hand-write the file at the location matching your harness and build kind.

## 4. Optional: install the proxy

Use this option if you want the client session to survive editor shutdown and startup. The editor must still run for live tool calls.

Check whether your engine includes `Engine/Plugins/Experimental/ModelContextProtocol/Extras/Proxy`. If it is absent, keep the direct HTTP setup.

Choose the binary for the operating system where the MCP client runs:

| Platform | Binary under `Extras/Proxy` |
|---|---|
| Windows x64 | `Bin/Win64/unreal_mcp_proxy.exe` |
| macOS arm64 | `Bin/Mac/unreal_mcp_proxy` |
| Linux x64 | `Bin/Linux/unreal_mcp_proxy` |
| Linux arm64 | `Bin/LinuxArm64/unreal_mcp_proxy` |

First generate `.mcp.json` through step 3. Then run the matching command from `Extras/Proxy`, using the actual configuration path. The installer edits `.mcp.json`, so this route is for Claude Code. Codex and OpenCode users can keep the direct HTTP setup, or configure the proxy by hand as a local STDIO server following the engine's `Extras/Proxy/README.md`.

Windows PowerShell:

```powershell
.\Bin\Win64\unreal_mcp_proxy.exe --mcp-json "C:\path\to\.mcp.json" install
```

macOS:

```bash
./Bin/Mac/unreal_mcp_proxy --mcp-json "/path/to/.mcp.json" install
```

For Linux, use `Bin/Linux` or `Bin/LinuxArm64` instead of `Bin/Mac`.
An explicit `--mcp-json` path also supports projects outside the engine directory tree.

The installer replaces the HTTP entry with a STDIO `unreal-mcp-proxy` entry. It keeps the original entry under `_upstreamEntry`. Configure one Unreal connection, not both the proxy and a duplicate direct HTTP connection.

Restart the MCP client once after installation so it loads the changed configuration. Later editor shutdowns do not require stopping the proxy. If an editor integration automatically replaces `.mcp.json`, disable that integration's automatic client-configuration writes.

To restore the direct HTTP entry, run the same command with `uninstall` instead of `install`. Reload the client configuration afterward.

The proxy stores catalogues in the operating system's user cache directory. Scope includes configuration path, proxy path, engine build identity, and client protocol version. It does not supply a fixed Unreal tool catalogue. See the engine's `Extras/Proxy/README.md` for cache behaviour and transport limits in your build.

## 5. Several editors at once

Every editor serves MCP on `ServerPortNumber`, 8000 by default. A second editor on the same machine can't bind that port, and a client pointed at it reaches the first editor instead. Give each project or engine workspace its own fixed port:

1. Pick one port per workspace (for example 8100, 8101, ...) and keep it. Don't rely on the editor moving to the next free port: a client keeps talking to whatever answers on its configured port.
2. Set `ServerPortNumber` in that project's `EditorPerProjectUserSettings.ini` (step 2), or pass `-ModelContextProtocolPort=<port>` at launch.
3. Point that workspace's client config at the same port (step 3) and, for Claude Code, install the proxy into it (step 4), so each client session follows its own editor across restarts.
4. Start each client session from its own workspace, so it loads that workspace's client config.

To check which editor answered, see **Identify the editor** in `operations.md`.

## 6. Give the agent project context

The upstream plugin injected a short note with a Claude Code `SessionStart` hook. That hook is harness-specific. The portable equivalent is an instruction file that the harness reads at session start. Add the block in `references/project-context.md` to `CLAUDE.md` for Claude Code, or to `AGENTS.md` for Codex and OpenCode. This is optional, but it helps the agent prefer Unreal conventions before it reaches for the `unreal-mcp` skill.

## Verifying

After the editor is running with the plugin enabled and auto-start on:

- The Output Log shows MCP server startup messages.
- `list_toolsets` (one of the three tool-search meta-tools) returns successfully.
- Claude Code: `/mcp` lists `unreal-mcp`, or `unreal-mcp-proxy` when installed, as connected.
- Codex: `/mcp` lists `unreal-mcp` as connected.
- OpenCode: `opencode mcp list` shows `unreal-mcp` as connected, and `/mcps` shows the same state in the app.

A connected proxy or visible cached tools do not prove that Unreal is reachable. Confirm with a successful read-only Unreal tool call.

If any of these fail, see `operations.md` for recovery commands.
