import { readFileSync } from "node:fs"
import { basename } from "node:path"
import plugin from "../opencode-plugin.ts"

// Guards the one invariant the OpenCode part has: it registers exactly the
// skills the Claude Code manifest promotes, with no second list to drift.

const manifest = JSON.parse(
  readFileSync(new URL("../.claude-plugin/plugin.json", import.meta.url), "utf8"),
)
const expected = manifest.skills.map((directory) => basename(directory))

const registered = []
const editor = {
  get: (id) => registered.find((skill) => skill.id === id),
  add: (skill) => registered.push(skill),
  list: () => registered,
  update: () => {},
  remove: () => {},
}

await plugin.setup({ skill: { transform: (callback) => callback(editor) } })

const problems = []
if (registered.length !== expected.length) {
  problems.push(`registered ${registered.length} skills, manifest lists ${expected.length}`)
}
for (const id of expected) {
  if (!registered.some((skill) => skill.id === id)) problems.push(`missing skill ${id}`)
}
for (const skill of registered) {
  if (!skill.description) problems.push(`${skill.id} has no description`)
  if (!skill.content) problems.push(`${skill.id} has no content`)
}

if (problems.length > 0) {
  console.error(problems.join("\n"))
  process.exit(1)
}

console.log(`${registered.length} skills registered from the manifest`)
