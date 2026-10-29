import { readFileSync } from "node:fs"
import { basename, dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { Plugin, Skill } from "@opencode/plugin"

// OpenCode parts of this repo: the server part registers exactly the skills
// listed in the Claude Code manifest, so there is one authority for the
// promoted set and no second list to drift.

const root = dirname(fileURLToPath(import.meta.url))

interface Manifest {
  skills: string[]
}

interface SkillFile {
  id: string
  name: string
  description?: string
  autoinvoke: boolean
  path: string
  content: string
}

function parseSkill(directory: string): SkillFile {
  const absolute = resolve(root, directory.replace(/^\.\//, ""))
  const path = join(absolute, "SKILL.md")
  const source = readFileSync(path, "utf8")
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source)
  const frontmatter = match?.[1] ?? ""
  const body = match ? source.slice(match[0].length) : source

  const field = (key: string): string | undefined => {
    const prefix = `${key}:`
    const line = frontmatter.split(/\r?\n/).find((entry) => entry.startsWith(prefix))
    if (!line) return undefined
    return line.slice(prefix.length).trim().replace(/^["']|["']$/g, "")
  }

  const id = basename(absolute)
  return {
    id,
    name: field("name") ?? id,
    description: field("description"),
    // Skills marked disable-model-invocation are user-invoked in every
    // harness, so OpenCode must not let the model choose them.
    autoinvoke: field("disable-model-invocation") !== "true",
    path,
    content: body.trim(),
  }
}

const manifest = JSON.parse(readFileSync(join(root, ".claude-plugin", "plugin.json"), "utf8")) as Manifest
const skills = manifest.skills.map(parseSkill)

export default Plugin.define({
  id: "truligon.skills",
  async setup(ctx) {
    await ctx.skill.transform((editor) => {
      for (const skill of skills) {
        // A copy installed through skills.sh wins, so the two routes can
        // coexist without overriding an edited file.
        if (editor.get(skill.id)) continue
        editor.add({
          id: Skill.ID.make(skill.id),
          name: Skill.Name.make(skill.name),
          description: skill.description,
          autoinvoke: skill.autoinvoke,
          path: Skill.Info.fields.path.make(skill.path),
          content: skill.content,
        })
      }
    })
  },
})
