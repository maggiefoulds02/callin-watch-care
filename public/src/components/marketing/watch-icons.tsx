// A small family of hand-drawn line-art watch illustrations, all in the same
// stroke style as the existing brand mark (public/brand/watch-illustration.png)
// — self-authored vector art rather than photography, so there's no licensing
// question and they scale crisply at any size. Used across the marketing
// pages in place of stock photography until real product photos exist.

type IconProps = { className?: string };

const STROKE = 1.5;

export function DressWatchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 160" fill="none" className={className} aria-hidden>
      <path d="M60 8 L46 26 H74 L60 8Z" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      <path d="M60 152 L46 134 H74 L60 152Z" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      <circle cx="60" cy="80" r="38" stroke="currentColor" strokeWidth={STROKE} />
      <circle cx="60" cy="80" r="30" stroke="currentColor" strokeWidth={STROKE * 0.6} opacity={0.6} />
      <line x1="60" y1="80" x2="60" y2="58" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <line x1="60" y1="80" x2="76" y2="88" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <circle cx="60" cy="80" r="2.5" fill="currentColor" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
        <line
          key={deg}
          x1={60 + 33 * Math.sin((deg * Math.PI) / 180)}
          y1={80 - 33 * Math.cos((deg * Math.PI) / 180)}
          x2={60 + 29 * Math.sin((deg * Math.PI) / 180)}
          y2={80 - 29 * Math.cos((deg * Math.PI) / 180)}
          stroke="currentColor"
          strokeWidth={deg % 90 === 0 ? STROKE : STROKE * 0.5}
          opacity={deg % 90 === 0 ? 1 : 0.5}
        />
      ))}
      <circle cx="60" cy="42" r="2" fill="currentColor" opacity={0.7} />
    </svg>
  );
}

export function DiveWatchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 140" fill="none" className={className} aria-hidden>
      {/* bracelet links */}
      {[16, 30].map((y) => (
        <g key={y} opacity={0.8}>
          <rect x="46" y={y} width="28" height="10" rx="2" stroke="currentColor" strokeWidth={STROKE * 0.7} />
        </g>
      ))}
      {[100, 114].map((y) => (
        <g key={y} opacity={0.8}>
          <rect x="46" y={y} width="28" height="10" rx="2" stroke="currentColor" strokeWidth={STROKE * 0.7} />
        </g>
      ))}
      {/* rotating bezel */}
      <circle cx="60" cy="70" r="42" stroke="currentColor" strokeWidth={STROKE} />
      {Array.from({ length: 20 }).map((_, i) => {
        const deg = i * 18;
        return (
          <line
            key={i}
            x1={60 + 42 * Math.sin((deg * Math.PI) / 180)}
            y1={70 - 42 * Math.cos((deg * Math.PI) / 180)}
            x2={60 + 37 * Math.sin((deg * Math.PI) / 180)}
            y2={70 - 37 * Math.cos((deg * Math.PI) / 180)}
            stroke="currentColor"
            strokeWidth={STROKE * 0.6}
            opacity={0.6}
          />
        );
      })}
      <circle cx="60" cy="70" r="30" stroke="currentColor" strokeWidth={STROKE} />
      {/* lume markers */}
      {[0, 90, 180, 270].map((deg) => (
        <circle
          key={deg}
          cx={60 + 24 * Math.sin((deg * Math.PI) / 180)}
          cy={70 - 24 * Math.cos((deg * Math.PI) / 180)}
          r={2.2}
          fill="currentColor"
        />
      ))}
      <line x1="60" y1="70" x2="60" y2="50" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <line x1="60" y1="70" x2="72" y2="70" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <circle cx="60" cy="70" r="2.5" fill="currentColor" />
      {/* crown */}
      <rect x="100" y="65" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth={STROKE * 0.8} />
    </svg>
  );
}

export function ChronographIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 140" fill="none" className={className} aria-hidden>
      <circle cx="60" cy="70" r="40" stroke="currentColor" strokeWidth={STROKE} />
      <circle cx="60" cy="70" r="33" stroke="currentColor" strokeWidth={STROKE * 0.5} opacity={0.5} />
      {/* sub-dials */}
      <circle cx="60" cy="52" r="9" stroke="currentColor" strokeWidth={STROKE * 0.7} opacity={0.8} />
      <circle cx="46" cy="82" r="9" stroke="currentColor" strokeWidth={STROKE * 0.7} opacity={0.8} />
      <circle cx="74" cy="82" r="9" stroke="currentColor" strokeWidth={STROKE * 0.7} opacity={0.8} />
      <line x1="60" y1="70" x2="60" y2="46" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <line x1="60" y1="70" x2="82" y2="60" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <circle cx="60" cy="70" r="2.5" fill="currentColor" />
      {/* pushers */}
      <rect x="98" y="52" width="7" height="10" rx="1.5" stroke="currentColor" strokeWidth={STROKE * 0.8} />
      <rect x="98" y="78" width="7" height="10" rx="1.5" stroke="currentColor" strokeWidth={STROKE * 0.8} />
      <rect x="100" y="65" width="7" height="10" rx="1.5" stroke="currentColor" strokeWidth={STROKE * 0.8} />
    </svg>
  );
}

export function PocketWatchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 150" fill="none" className={className} aria-hidden>
      <path
        d="M60 10 C60 10 50 16 50 26"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        opacity={0.85}
      />
      <rect x="55" y="24" width="10" height="10" rx="2" stroke="currentColor" strokeWidth={STROKE} />
      <circle cx="60" cy="46" r="4" fill="currentColor" opacity={0.9} />
      <circle cx="60" cy="88" r="40" stroke="currentColor" strokeWidth={STROKE} />
      <circle cx="60" cy="88" r="32" stroke="currentColor" strokeWidth={STROKE * 0.5} opacity={0.5} />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
        <line
          key={deg}
          x1={60 + 32 * Math.sin((deg * Math.PI) / 180)}
          y1={88 - 32 * Math.cos((deg * Math.PI) / 180)}
          x2={60 + 27 * Math.sin((deg * Math.PI) / 180)}
          y2={88 - 27 * Math.cos((deg * Math.PI) / 180)}
          stroke="currentColor"
          strokeWidth={deg % 90 === 0 ? STROKE : STROKE * 0.5}
          opacity={deg % 90 === 0 ? 1 : 0.45}
        />
      ))}
      <line x1="60" y1="88" x2="60" y2="66" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <line x1="60" y1="88" x2="74" y2="96" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <circle cx="60" cy="88" r="2.5" fill="currentColor" />
    </svg>
  );
}

/** Small gear glyph — used as a recurring motif rather than a literal icon. */
export function GearGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden>
      <circle cx="50" cy="50" r="22" stroke="currentColor" strokeWidth={STROKE} />
      <circle cx="50" cy="50" r="7" stroke="currentColor" strokeWidth={STROKE} />
      {Array.from({ length: 12 }).map((_, i) => {
        const deg = i * 30;
        const rad = (deg * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={50 + 24 * Math.sin(rad)}
            y1={50 - 24 * Math.cos(rad)}
            x2={50 + 31 * Math.sin(rad)}
            y2={50 - 31 * Math.cos(rad)}
            stroke="currentColor"
            strokeWidth={STROKE * 1.2}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
