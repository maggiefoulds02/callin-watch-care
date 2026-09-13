import { WATCH_PARTS } from "./watch-parts-data";

const DIAGRAM_POSITIONS = [
  { cx: 150, cy: 30 },
  { cx: 258, cy: 150 },
  { cx: 150, cy: 150 },
  { cx: 150, cy: 95 },
  { cx: 195, cy: 232 },
  { cx: 105, cy: 232 },
] as const;

const POINTS = WATCH_PARTS.map((part, i) => ({ ...part, ...DIAGRAM_POSITIONS[i] }));

/**
 * A labelled cross-section of a watch — built as original line art rather
 * than photography, and doubling as real information: each numbered point
 * mirrors a step in the checklist every job actually runs through
 * (src/lib/types.ts checklist defaults / the PRD's per-job checklist).
 */
export function WatchAnatomy() {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-center">
      <svg viewBox="0 0 300 300" className="mx-auto w-full max-w-[320px] text-silver-300">
        <circle cx="150" cy="150" r="128" stroke="currentColor" strokeWidth={1} opacity={0.35} />
        <circle cx="150" cy="150" r="118" stroke="currentColor" strokeWidth={1.5} />
        <circle cx="150" cy="150" r="100" stroke="currentColor" strokeWidth={1} opacity={0.6} />
        <circle cx="150" cy="150" r="92" fill="rgba(241,243,247,0.04)" stroke="currentColor" strokeWidth={0.75} opacity={0.5} />

        {Array.from({ length: 12 }).map((_, i) => {
          const deg = i * 30;
          const rad = (deg * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={150 + 92 * Math.sin(rad)}
              y1={150 - 92 * Math.cos(rad)}
              x2={150 + 82 * Math.sin(rad)}
              y2={150 - 82 * Math.cos(rad)}
              stroke="currentColor"
              strokeWidth={deg % 90 === 0 ? 1.5 : 0.75}
              opacity={deg % 90 === 0 ? 0.9 : 0.4}
            />
          );
        })}

        <line x1="150" y1="150" x2="150" y2="100" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
        <line x1="150" y1="150" x2="185" y2="165" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
        <circle cx="150" cy="150" r="3" fill="currentColor" />

        {/* crown */}
        <rect x="272" y="140" width="16" height="20" rx="2" stroke="currentColor" strokeWidth={1.25} />

        {/* exhibition case-back hint: a small visible gear train */}
        <g opacity={0.75} transform="translate(150 216)">
          <circle r="16" stroke="currentColor" strokeWidth={1} />
          <circle r="5" stroke="currentColor" strokeWidth={1} />
          {Array.from({ length: 8 }).map((_, i) => {
            const rad = (i * 45 * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={17 * Math.sin(rad)}
                y1={-17 * Math.cos(rad)}
                x2={21 * Math.sin(rad)}
                y2={-21 * Math.cos(rad)}
                stroke="currentColor"
                strokeWidth={1.25}
                strokeLinecap="round"
              />
            );
          })}
        </g>

        {POINTS.map((p) => (
          <g key={p.n}>
            <circle cx={p.cx} cy={p.cy} r="9" fill="#0a1830" stroke="currentColor" strokeWidth={1.25} />
            <text
              x={p.cx}
              y={p.cy + 3.5}
              textAnchor="middle"
              fontSize="10"
              fill="currentColor"
              fontFamily="var(--font-sans)"
            >
              {p.n}
            </text>
          </g>
        ))}
      </svg>

      <dl className="grid gap-5 sm:grid-cols-2">
        {POINTS.map((p) => (
          <div key={p.n} className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-silver-500 font-mono text-xs text-silver-300">
              {p.n}
            </span>
            <div>
              <dt className="font-serif text-base text-silver-100">{p.label}</dt>
              <dd className="mt-1 text-sm text-silver-400">{p.copy}</dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
