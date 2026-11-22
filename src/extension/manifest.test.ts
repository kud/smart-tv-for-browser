import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const root = path.resolve(import.meta.dirname, "../..")
const readJson = (file: string) =>
  JSON.parse(readFileSync(path.join(root, file), "utf8"))

describe("extension manifest", () => {
  it("ships the version from the root package.json", () => {
    expect(readJson("extension/manifest.json").version).toBe(
      readJson("package.json").version,
    )
  })
})
