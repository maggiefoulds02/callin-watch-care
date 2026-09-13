import type { Metadata } from "next";
import { GlowField } from "@/components/marketing/texture";
import { WatchAnatomy } from "@/components/marketing/watch-anatomy";
import { Reveal } from "@/components/marketing/reveal";
import { DressWatchIcon } from "@/components/marketing/watch-icons";

export const metadata: Metadata = { title: "About — Callin Watch Care" };

const VALUES = [
  {
    n: "01",
    title: "Precision",
    copy: "Every movement is timed and tested to factory tolerance — nothing leaves the workshop on guesswork.",
  },
  {
    n: "02",
    title: "Patience",
    copy: "A restoration takes as long as it needs to take. We'd rather do it right once than fast twice.",
  },
  {
    n: "03",
    title: "Discretion",
    copy: "Your watch, your details and your history with it are handled privately, start to finish.",
  },
  {
    n: "04",
    title: "Partnership",
    copy: "We work alongside Sweeping Hands, an experienced trade partner, bringing skilled hands and workshop capacity to every job.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero — asymmetric, mirrors the home hero's shape without repeating it */}
      <section className="relative overflow-hidden bg-navy-950 px-6 py-24">
        <GlowField className="-top-24 -left-24 h-96 w-96" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-[1.1fr_0.7fr]">
          <div>
            <p className="font-serif text-sm tracking-[0.25em] text-silver-600 uppercase">
              About Us
            </p>
            <h1 className="mt-3 font-serif text-4xl leading-tight text-silver-100 md:text-6xl">
              Trusted care, <span className="italic text-silver-300">uncompromising</span>{" "}
              standards
            </h1>
            <p className="mt-8 max-w-lg text-lg text-silver-300">
              Callin Watch Care is a Bournemouth-based workshop dedicated to the servicing,
              restoration and refurbishment of fine watches — whether a routine service or a
              complete mechanical and cosmetic restoration.
            </p>
          </div>
          <div className="hidden justify-center md:flex">
            <DressWatchIcon className="h-72 w-72 text-silver-500/60" />
          </div>
        </div>
      </section>

      <section className="bg-navy-900 px-6 py-16">
        <Reveal className="mx-auto max-w-3xl">
          <p className="font-serif text-2xl leading-relaxed text-silver-200 italic md:text-3xl">
            &ldquo;A watch is never just a mechanism — it&apos;s a small, wearable piece of
            history. Our job is to keep it running the way it was meant to.&rdquo;
          </p>
        </Reveal>
      </section>

      {/* Values — the light break */}
      <section className="bg-silver-100 px-6 py-24 text-navy-950">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="font-serif text-sm tracking-[0.25em] text-navy-700/70 uppercase">
              What We Stand For
            </p>
            <h2 className="mt-3 max-w-md font-serif text-3xl text-navy-950">Our values</h2>
          </Reveal>
          <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value, i) => (
              <Reveal key={value.title} delay={i * 90} className="border-t border-navy-950/15 pt-5">
                <span className="font-mono text-xs text-navy-700/60">{value.n}</span>
                <h3 className="mt-2 font-serif text-xl text-navy-950">{value.title}</h3>
                <p className="mt-2 text-sm text-navy-800/70">{value.copy}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-navy-950 px-6 py-24">
        <GlowField className="top-0 right-0 h-96 w-96" />
        <div className="relative mx-auto max-w-5xl">
          <Reveal>
            <p className="font-serif text-sm tracking-[0.25em] text-silver-600 uppercase">
              Our Workshop
            </p>
            <h2 className="mt-3 max-w-lg font-serif text-3xl text-silver-100">How we work</h2>
            <p className="mt-4 max-w-xl text-silver-400">
              The same disciplined process, followed for every watch, whether it&apos;s in for a
              service or a full restoration.
            </p>
          </Reveal>
          <Reveal delay={100} className="mt-14">
            <WatchAnatomy />
          </Reveal>
        </div>
      </section>
    </>
  );
}
