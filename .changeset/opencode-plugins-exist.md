---
"truligon-skills": patch
---

Correct the claim that OpenCode has no plugin support. OpenCode plugins exist: they load from `.opencode/plugins/` or `~/.config/opencode/plugins/`, or from npm packages named in the `plugin` array, and they register hooks, event handlers and custom tools. What OpenCode lacks is a plugin marketplace and a plugin path for delivering skills, which is why `skills.sh` remains the install route. The `unreal-mcp` setup reference now names the hooks an OpenCode plugin could use to inject project context, and says why the portable instruction file is still the default.
