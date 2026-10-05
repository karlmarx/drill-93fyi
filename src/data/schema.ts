import { z } from 'zod'

/** [x, y] in feet. x=0 left sideline, y=0 far baseline, y=44 near baseline. */
const Pt = z.tuple([z.number().min(-2).max(22), z.number().min(-2).max(46)])

export const PathSchema = z.object({
  t: z.enum(['shot', 'feed', 'lob']),
  a: Pt,
  b: Pt,
})

export const DiagramSchema = z.object({
  players: z.array(
    z.object({
      l: z.string().min(1).max(2),
      x: z.number().min(-2).max(22),
      y: z.number().min(-2).max(46),
      c: z.union([z.literal(0), z.literal(1)]),
    }),
  ),
  paths: z.array(PathSchema).default([]),
  moves: z.array(z.object({ who: z.string(), pts: z.array(Pt).min(1) })).optional(),
  /** [x, y, width, height] highlighted target zones */
  zones: z.array(z.tuple([z.number(), z.number(), z.number().positive(), z.number().positive()])).optional(),
})

export const SideSchema = z.object({
  role: z.string().min(1),
  target: z.number().int().positive(),
  start: z.number().int().default(0),
})

export const ModeSchema = z.object({
  name: z.string().min(1),
  sides: z.tuple([SideSchema, SideSchema]),
  defaultNames: z.tuple([z.string(), z.string()]),
  rule: z.string().min(1),
  lobsToggle: z.boolean().optional(),
  netReset: z.boolean().optional(),
  minus: z.boolean().optional(),
  winBy: z.number().int().positive().optional(),
})

export const DrillSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'ids are lowercase letters, digits and dashes (they go in share links)'),
  cat: z.string(),
  title: z.string().min(1),
  mins: z.number().int().positive(),
  forWho: z.enum(['Karl', 'Roger', 'Both']),
  scoring: z.string().optional(),
  summary: z.string().min(1),
  who: z.record(z.string(), z.string()),
  rules: z.array(z.string()).min(1),
  cues: z.array(z.string()),
  videos: z.array(z.object({ label: z.string().min(1), url: z.url() })),
  diagram: DiagramSchema,
})

export const DataSchema = z
  .object({
    version: z.number().int(),
    court: z.object({
      widthFt: z.literal(20),
      lengthFt: z.literal(44),
      netY: z.literal(22),
      kitchenLines: z.tuple([z.literal(15), z.literal(29)]),
      note: z.string().optional(),
    }),
    players: z.array(z.object({ id: z.string(), name: z.string(), color: z.string() })),
    categories: z.array(z.object({ id: z.string(), name: z.string() })).min(1),
    modes: z.record(z.string(), ModeSchema),
    drills: z.array(DrillSchema),
  })
  .superRefine((d, ctx) => {
    const ids = new Set<string>()
    const cats = new Set(d.categories.map((c) => c.id))
    d.drills.forEach((dr, i) => {
      if (ids.has(dr.id)) ctx.addIssue({ code: 'custom', path: ['drills', i, 'id'], message: `duplicate drill id "${dr.id}"` })
      ids.add(dr.id)
      if (!cats.has(dr.cat)) ctx.addIssue({ code: 'custom', path: ['drills', i, 'cat'], message: `unknown category "${dr.cat}"` })
      if (dr.scoring && !d.modes[dr.scoring])
        ctx.addIssue({ code: 'custom', path: ['drills', i, 'scoring'], message: `unknown scoring mode "${dr.scoring}"` })
    })
    if (/[\u2013\u2014]/.test(JSON.stringify(d)))
      ctx.addIssue({ code: 'custom', path: [], message: 'no en or em dashes in drill copy' })
  })

export type Drill = z.infer<typeof DrillSchema>
export type Diagram = z.infer<typeof DiagramSchema>
export type DiagramPath = z.infer<typeof PathSchema>
export type Mode = z.infer<typeof ModeSchema>
export type DrillData = z.infer<typeof DataSchema>
