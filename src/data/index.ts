import raw from './drills.json'
import { DataSchema } from './schema'

// Validated again at build time by scripts/validate-data.ts, which fails the build on bad data.
export const DATA = DataSchema.parse(raw)
export const DRILLS = DATA.drills
export const CATS = DATA.categories
export const MODES = DATA.modes
export const byId = Object.fromEntries(DRILLS.map((d) => [d.id, d]))
export const NAMES: Record<string, string> = { K: 'Karl', R: 'Roger' }
