# Ship the skill set as a native plugin from this repo's own marketplace

These skills have always been installable via [skills.sh](https://skills.sh/axefield/drawfourgon) (`npx skills add axefield/drawfourgon`), which copies editable skill files into a user's project across Claude Code, Codex, and other Agent-Skills-standard harnesses. A recurring request is a **plug-and-play** distribution: subscribe to the set as a read-only, always-current bundle you do not edit, rather than a fork you own. That is exactly what native plugin systems provide.

We ship native plugins from this repo's own marketplace: `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, labelled `@truligon`. Managed installs cover Claude Code, Codex, Copilot CLI, and VS Code; skills.sh remains the universal route for everything else.

## The constraint: bucketed skills vs. single-path selection

Skills live in bucket folders under `skills/`: `engineering/` and `productivity/` are **promoted** (shipped); `misc/`, `in-progress/`, and `deprecated/` are **not**. A plugin must expose only the promoted set, which spans two of those bucket folders.

- **Claude Code**: `.claude-plugin/plugin.json` accepts `skills` as an **array of explicit skill-directory paths**. We list the promoted skills one by one, exclude everything else with zero ambiguity, and add `.claude-plugin/marketplace.json` so the repo is its own single-plugin marketplace.
- **Codex and Copilot**: both read the same manifests. Codex accepts a `skills` string array and falls back to `.claude-plugin/` when there is no `.codex-plugin/`. Copilot CLI reads the same manifests and reports the same promoted set. Neither keeps symlinks, so the explicit list is the only reliable curation.
- **Gemini CLI**: Gemini does not read `.claude-plugin`, and `--path` takes one bucket. One install per promoted bucket gives exactly the promoted set.

## Decision

- Ship the plugin from this repo's marketplace, curated to the promoted set.
- Use `@truligon` for every managed install, including Claude Code. `truligon-skills` is not listed in `claude-plugins-official`, so Claude Code adds the marketplace explicitly before installing the plugin.
- Keep **skills.sh** as the universal installer for agents without a managed route, and as the route for people who want editable files.

## Invariants this creates

- Every promoted skill has an entry in `.claude-plugin/plugin.json`'s `skills` array.
- `.claude-plugin/plugin.json`'s `version` tracks `package.json`'s version: bump both together on release. Managed routes use the plugin `version` to decide when installed users see an update.
- `marketplace.json` carries no `version` field, so it cannot drift from `plugin.json`.
- Install wording lives in [.agents/install-block.md](../install-block.md). `README.md` and changesets copy it verbatim; docs pages carry no install commands.

## Update, 2026-10-07

On Codex 0.161.0, the `@truligon` marketplace install loads the promoted model-invoked skills and nothing from `misc/` or `in-progress/`. Copilot CLI reads the same manifests and reports "Installed 27 skills".

## Update, 2026-10-08: managed installs first

`@truligon` is now the lead route on Claude Code, Codex, Copilot and VS Code, at the cost of a one-time opt-in on Copilot. The version invariant above applies to every managed route. `npm run version` keeps it by running `scripts/sync-plugin-version.mjs`.
