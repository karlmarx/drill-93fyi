# Adding drills

Adding a drill only needs a new entry in `src/data/drills.json`. No code changes.
`npm run build` validates the file against `src/data/schema.ts` and fails on bad data,
so a typo can't reach production. Run `npm run validate` to check it on its own.

## Court coordinates

All positions are in feet on a 20 x 44 court:

```
 x=0                x=20
  +--------+--------+  y=0   far baseline
  |        |        |
  +--------+--------+  y=15  far kitchen line
  |     kitchen     |
  ===================  y=22  net
  |     kitchen     |
  +--------+--------+  y=29  near kitchen line
  |        |        |
  +--------+--------+  y=44  near baseline
```

- `x=0` is the left sideline, `x=10` the centre line, `x=20` the right sideline.
- Values from -2 to 22 (x) and -2 to 46 (y) are allowed, so a player can stand behind the baseline.
- Common spots: near kitchen line `y=30.5`, far kitchen line `y=13.5`, near baseline `y=43`, mid court `y=36`.

## Drill fields

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | Unique; lowercase letters, digits, dashes. Used in share links, so don't rename old ones. |
| `cat` | yes | One of the `categories[].id` values (`warm`, `reset`, `lob`, `game`, `cool`, `extra`). |
| `title` | yes | Card title. |
| `mins` | yes | Whole minutes. Used for the timer and the "minutes left" total. |
| `forWho` | yes | `Karl`, `Roger` or `Both`. |
| `scoring` | no | A key from `modes` (`seven11`, `zero9`, `lob7`, `dink5`, `call7`, `to11`). Adds a "Keep score" button. |
| `summary` | yes | One line under the title. |
| `who` | yes | Role per player letter, e.g. `{"K": "feeder", "R": "hitter"}`. |
| `rules` | yes | "How it works" bullets (at least one). |
| `cues` | yes | Coaching cues. Can be `[]`. |
| `videos` | yes | `[{"label": "...", "url": "https://..."}]`. Can be `[]`. |
| `diagram` | yes | See below. |

## Diagram fields

- `players`: `[{"l": "K", "x": 15, "y": 30.5, "c": 0}]`. `l` is the letter shown, `c` is the colour (0 = Karl white, 1 = Roger pink).
- `paths`: shots in play order: `{"t": "shot" | "feed" | "lob", "a": [x, y], "b": [x, y]}`.
  `shot` is a solid line, `feed` dashed, `lob` a yellow arc. Play animates the ball along them in order.
- `moves` (optional): `[{"who": "K", "pts": [[15, 43], [15, 43], [15, 36]]}]`. Points are evenly
  spaced keyframes across the whole animation. Repeating a point means "hold there".
- `zones` (optional): `[[x, y, width, height]]` yellow target areas.

## Scoring modes

Each mode in `modes` has two `sides` (`role`, `target`, `start`), `defaultNames`, a `rule` line and
optional flags: `lobsToggle` (shows the lobs switch), `netReset` (a "Net: back to 0" button),
`minus` (a "-1" button; scores may go below zero), `winBy` (e.g. 2). Scoring logic lives in
`src/lib/score.ts`, with tests in `src/lib/score.test.ts`.

## Copy style

No en or em dashes anywhere (the validator rejects them). Use commas, colons or full stops.
