"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { WatchScene } from "./watch-3d/watch-scene";
import { WatchAnatomy } from "./watch-anatomy";
import { WATCH_PARTS } from "./watch-parts-data";

// Client-only checks (is this hydrated yet, does the visitor prefer reduced
// motion) via useSyncExternalStore rather than an effect + setState — avoids
// the extra render pass and matches server/client output exactly on first
// paint, so there's no hydration mismatch to reconcile.
function subscribeNever() {
  return () => {};
}
function useHasMounted() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/** The legend line for a given progress is the last part whose range midpoint
 * scroll has already passed — i.e. "what's currently mid-separation". */
function activePartIndex(progress: number) {
  let active = -1;
  WATCH_PARTS.forEach((part, i) => {
    const mid = (part.range[0] + part.range[1]) / 2;
    if (progress >= mid) active = i;
  });
  return active;
}

/**
 * Oliver's requested feature: a watch that rotates and splits into its
 * components as the visitor scrolls. Pins a tall section in place, drives a
 * Three.js scene from raw scroll progress, and highlights the matching part
 * in a legend alongside it.
 *
 * Falls back to the static 2D anatomy diagram (WatchAnatomy) — same six
 * parts, same copy, just no motion — both before this has mounted client-side
 * and whenever the visitor has requested reduced motion, so nobody gets a
 * frozen/broken canvas or unwanted parallax.
 */
export function ExplodedWatchSection() {
  const mounted = useHasMounted();
  const reducedMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState(-1);
  const sectionRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mounted || reducedMotion) return;

    const update = () => {
      rafRef.current = null;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const raw = total > 0 ? -rect.top / total : 0;
      const progress = Math.min(1, Math.max(0, raw));
      // Imperative — read every frame inside the Canvas, no React re-render.
      progressRef.current = progress;
      // Derived, throttled to actual changes — only re-renders the legend
      // when the active part actually changes, not on every scroll tick.
      setActiveIndex((prev) => {
        const next = activePartIndex(progress);
        return next === prev ? prev : next;
      });
    };

    const onScroll = () => {
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [mounted, reducedMotion]);

  if (!mounted || reducedMotion) {
    return <WatchAnatomy />;
  }

  return (
    <div ref={sectionRef} style={{ height: "400vh" }} className="relative">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="relative h-[45vh] lg:h-[65vh]">
            <WatchScene progressRef={progressRef} />
          </div>
          <dl className="space-y-5">
            {WATCH_PARTS.map((part, i) => (
              <div
                key={part.n}
                className={`rounded-r-sm border-l-2 py-2 pl-5 pr-4 transition-all duration-300 ${
                  i === activeIndex
                    ? "border-silver-100 bg-white/[0.07] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                    : "border-navy-700 opacity-50"
                }`}
              >
                <dt
                  className={`font-serif text-lg transition-colors duration-300 ${
                    i === activeIndex ? "font-semibold text-silver-100" : "text-silver-500"
                  }`}
                >
                  <span className="mr-2 font-mono text-xs text-silver-600">
                    {String(part.n).padStart(2, "0")}
                  </span>
                  {part.label}
                </dt>
                <dd
                  className={`mt-1 text-sm transition-colors duration-300 ${
                    i === activeIndex ? "text-silver-300" : "text-silver-600"
                  }`}
                >
                  {part.copy}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-xs tracking-[0.2em] text-silver-600 uppercase">
          Scroll to explore
        </p>
      </div>
    </div>
  );
}
