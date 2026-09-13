// Subtle film-grain texture, layered over the dark navy sections so they
// read as something with depth and material rather than flat colour fills.
// Fixed + pointer-events-none so it never interferes with the page.
export function GrainOverlay() {
  return (
    <svg
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-[0.05] mix-blend-overlay"
      aria-hidden
    >
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
}

/** A soft, off-centre light bloom — used to break up flat navy panels. */
export function GlowField({
  className,
  color = "rgba(199,211,222,0.16)",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-3xl ${className ?? ""}`}
      style={{ backgroundImage: `radial-gradient(circle, ${color} 0%, transparent 70%)` }}
      aria-hidden
    />
  );
}
