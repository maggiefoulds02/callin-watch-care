// Shared between the 2D anatomy diagram (watch-anatomy.tsx, also the
// no-WebGL/reduced-motion fallback) and the 3D exploded-view section, so the
// six labels, descriptions, and reveal timing never drift apart between them.
//
// `range` is [start, end] as a fraction (0–1) of the pinned scroll section:
// the part is fully assembled before `start`, fully separated by `end`, and
// the matching legend line lights up once scroll passes the midpoint. The
// ranges stagger front-to-back (crystal/bezel/crown lift first, movement and
// case back drop last) so parts peel away in a deliberate sequence rather
// than exploding all at once.
export const WATCH_PARTS = [
  {
    n: 1,
    label: "Crown",
    copy: "Wound and set by hand — the first thing we check for play or wear.",
    range: [0.05, 0.35] as [number, number],
  },
  {
    n: 2,
    label: "Bezel",
    copy: "Polished or refinished carefully, without ever softening its original lines.",
    range: [0.1, 0.4] as [number, number],
  },
  {
    n: 3,
    label: "Crystal",
    copy: "Polished back to true clarity, or replaced where scratches run too deep.",
    range: [0.15, 0.45] as [number, number],
  },
  {
    n: 4,
    label: "Dial & hands",
    copy: "Refreshed with period-correct finishes — never over-restored.",
    range: [0.35, 0.65] as [number, number],
  },
  {
    n: 5,
    label: "Movement",
    copy: "Fully stripped, cleaned, lubricated and timed to factory tolerance.",
    range: [0.55, 0.85] as [number, number],
  },
  {
    n: 6,
    label: "Case back",
    copy: "Reassembled and pressure-tested to restore genuine water resistance.",
    range: [0.65, 0.95] as [number, number],
  },
] as const;
