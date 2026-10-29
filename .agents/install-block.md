# The canonical install block

One install story, one wording. `README.md`, `.changeset/*`, and every page under `docs/` must say **this** and nothing else. Change it here first, then propagate.

## Plugin installs first

Lead with plugin installs. They update without recopying files. Say plainly when a harness still needs a command to apply an update. Fall back to skills.sh, labelled "manual updates", only for agents that have no plugin route. Put any one-time opt-in beside its install command. Never promise "instant".

Claude Code, Codex and Copilot install from this repo's own marketplace, `.claude-plugin/marketplace.json` and `plugin.json`. Claude Code adds that marketplace explicitly, because `truligon-skills` is not in `claude-plugins-official`. Those routes reinstall only when the `version` in `plugin.json` changes. The Release workflow runs `npm run version`, which copies that field from `package.json`, so users get a release when the "chore: version skills" PR merges.

OpenCode installs the repository as a Git package and reads the same `plugin.json` list when it loads. Its server part registers the promoted skills, so a commit to `main` reaches users through `opencode plugin update` without a version bump.

| Agent         | Route                            | Updates itself?                                                  |
| ------------- | -------------------------------- | ---------------------------------------------------------------- |
| Claude Code   | `@truligon` marketplace          | Yes, when the marketplace version changes                        |
| Codex         | `@truligon` marketplace          | Yes, at startup, by default                                      |
| Copilot CLI   | `@truligon` marketplace          | Yes, after a one-time `autoUpdate: true`                         |
| VS Code       | Chat: Install Plugin From Source | Yes, daily, by default                                           |
| Gemini CLI    | `gemini skills install` (copies) | No. A Gemini extension would need a flat `skills/<name>/` layout |
| OpenCode      | `opencode plugin add` (Git)      | No. Startup checks for updates; run `opencode plugin update`     |
| Everyone else | skills.sh                        | No. Run `npx skills update`, and re-run `add` for new skills     |

Sources (2026-10-29): Codex `core-plugins/src/manager.rs`; Copilot [cli-config-dir-reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-config-dir-reference); VS Code `pluginAutoUpdate.ts`; Gemini `skillLoader.ts`; OpenCode [plugin management](https://opencode.ai/v2/docs/plugins#manage).

Nobody has run Auggie, Droid, Qwen or Goose against this repo, so they stay on skills.sh until someone does.

## Claude Code

<canonical-block name="claude-code">

```bash
claude plugin marketplace add axefield/drawfourgon
claude plugin install truligon-skills@truligon
```

Updates itself when the marketplace version changes.

</canonical-block>

## Codex

<canonical-block name="codex">

```bash
codex plugin marketplace add axefield/drawfourgon
codex plugin add truligon-skills@truligon
```

Updates itself at startup.

</canonical-block>

## GitHub Copilot (CLI and VS Code)

Use the marketplace, not `copilot plugin install axefield/drawfourgon`. Copilot has deprecated direct repo installs, and they can't auto-update. The `extraKnownMarketplaces` entry follows the documented schema, but nobody has run it yet.

<canonical-block name="copilot">

```bash
copilot plugin marketplace add axefield/drawfourgon
copilot plugin install truligon-skills@truligon
```

Then, once, add to `~/.copilot/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "truligon": { "source": { "source": "github", "repo": "axefield/drawfourgon" }, "autoUpdate": true }
  }
}
```

In VS Code, run **Chat: Install Plugin From Source** and enter `https://github.com/axefield/drawfourgon`. It updates daily.

</canonical-block>

## Gemini CLI

Gemini doesn't read `.claude-plugin`, and `--path` takes one bucket. One install per promoted bucket gives exactly the promoted set.

<canonical-block name="gemini">

```bash
gemini skills install https://github.com/axefield/drawfourgon.git --path skills/engineering
gemini skills install https://github.com/axefield/drawfourgon.git --path skills/productivity
```

Re-run both commands to update.

</canonical-block>

## OpenCode

OpenCode v2 loads plugins, and its server part can register skills. This repo's plugin reads the skill list from `.claude-plugin/plugin.json` and adds each one, so the plugin and a copied install always agree.

<canonical-block name="opencode">

```bash
opencode plugin add github:axefield/drawfourgon
```

Startup checks for updates; run `opencode plugin update` to apply them. `opencode plugin list` shows the installed plugin.

</canonical-block>

For editable skill files, use skills.sh instead:

```bash
npx skills@latest add axefield/drawfourgon -a opencode
```

The two routes are exclusive.

## Every other agent, or editable files (skills.sh)

`-a` preselects the agent. Each agent in the comment was run on 2026-10-07. Prefer skills.sh to an agent's own repo installer, such as `amp skill add` or `pi install git:…`, because those also pull in `misc/` and `in-progress/`. `npx skills update` skips skills added upstream since `add`, so the block tells users to re-run `add`.

<canonical-block name="other-agents">

```bash
npx skills@latest add axefield/drawfourgon -a <agent>  # opencode, cursor, devin, windsurf, amp, pi; omit -a to choose
```

When the installer asks which skills to take, include `setup-truligon-skills`. To update, run `npx skills@latest update`, and re-run `add` to pick up new skills.

</canonical-block>

Use the single-skill form wherever one skill is named on its own. `docs/` pages carry no install commands; the canonical block lives here and the README surfaces it. See [writing-docs.md](./writing-docs.md).

<canonical-block name="skills-sh-one-skill">

```bash
npx skills@latest add axefield/drawfourgon --skill=<name>
```

```bash
npx skills@latest update <name>
```

</canonical-block>

`skills@latest` is the pinned spelling everywhere.

## The two routes are exclusive

The plugin is a managed, read-only bundle you subscribe to. skills.sh writes files you own and edit. Installing both leaves the user with every skill twice: always say "pick one".
