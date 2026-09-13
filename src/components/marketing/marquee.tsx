/** Continuous horizontal scroll — content is duplicated so the loop is seamless. */
export function Marquee({ items }: { items: React.ReactNode[] }) {
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
      <div className="flex w-max animate-marquee gap-x-12">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="flex shrink-0 items-center">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
