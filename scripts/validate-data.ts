import { readFileSync } from 'node:fs'
import { DataSchema } from '../src/data/schema'

const file = new URL('../src/data/drills.json', import.meta.url)
const result = DataSchema.safeParse(JSON.parse(readFileSync(file, 'utf8')))
if (!result.success) {
  console.error('drills.json is invalid:')
  for (const issue of result.error.issues) console.error(`  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
  process.exit(1)
}
console.log(`drills.json OK: ${result.data.drills.length} drills, ${Object.keys(result.data.modes).length} modes`)
