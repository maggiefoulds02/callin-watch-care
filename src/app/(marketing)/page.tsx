import Link from "next/link";
import { ActiveJobBanner } from "@/components/active-job-banner";
import { getActiveJobForCurrentCustomer } from "@/data/jobs";
import { GlowField } from "@/components/marketing/texture";
import { ExplodedWatchSection } from "@/components/marketing/exploded-watch-section";
import { HeroWatchScene } from "@/components/marketing/watch-3d/hero-watch-scene";
import { Reveal } from "@/components/marketing/reveal";
import { Marquee } from "@/components/marketing/marquee";
import {
  DressWatchIcon,
  DiveWatchIcon,
  ChronographIcon,
  PocketWatchIcon,
  GearGlyph,
} from "@/components/marketing/watch-icons";

const BRANDS = [
  "Rolex",
  "Omega",
  "Tudor",
  "Breitling",
  "TAG Heuer",
  "IWC",
  "Cartier",
  "Longines",
  "Seiko",
  "Panerai",
];

const VALUES = [
  { n: "01", label: "Precision", copy: "Timed and tested to factory tolerance." },
  { n: "02", label: "Patience", copy: "Done right once, not fast twice." },
  { n: "03", label: "Discretion", copy: "Your watch, handled privately." },
];

const STYLES = [
  { Icon: DressWatchIcon, label: "Dress" },
  { Icon: DiveWatchIcon, label: "Dive" },
  { Icon: ChronographIcon, label: "Chronograph" },
  { Icon: PocketWatchIcon, label: "Vintage" },
];

const PROCESS = [
  {
    step: "01",
    title: "Book & Assess",
    description: "Send us your watch or book an in-person assessment with our team.",
  },
  {
    step: "02",
    title: "Transparent Quote",
    description:
      "We inspect your watch and provide a clear, no-obligation quote before any work begins.",
  },
  {
    step: "03",
    title: "Expert Service",
    description: "Your watch is serviced, restored or refurbished by hand in our workshop.",
  },
  {
    step: "04",
    title: "Careful Return",
    description: "Your timepiece is cleaned, tested and returned to you, ready to wear.",
  },
];

export default async function HomePage() {
  const activeJob = await getActiveJobForCurrentCustomer();

  return (
    <>
      {activeJob && <ActiveJobBanner job={activeJob} />}

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-950 px-6 pt-20 pb-28">
        <GlowField className="-top-32 -right-40 h-[32rem] w-[32rem]" />
        <GlowField
          className="-bottom-48 -left-32 h-[28rem] w-[28rem]"
          color="rgba(154,167,184,0.10)"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="font-serif text-sm tracking-[0.3em] text-silver-400 uppercase">
              Callin Watch Care — Bournemouth
            </p>
            <h1 className="mt-5 font-serif text-5xl leading-[1.05] text-silver-100 md:text-7xl">
              Expert Care for
              <br />
              <span className="italic text-silver-300">Exceptional</span> Timepieces
            </h1>
            <div
              className="my-6 h-[3px] w-20 rounded-full"
              style={{
                backgroundImage: "linear-gradient(90deg,#7c8aa0 0%,#f2f4f7 50%,#7c8aa0 100%)",
              }}
              aria-hidden
            />
            <p className="max-w-md text-lg text-silver-300">
              From routine servicing to complete restoration, every watch that comes through our
              workshop is treated with the precision, patience and discretion it deserves.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="rounded-sm px-7 py-3.5 text-sm font-medium text-navy-950 transition-transform hover:scale-[1.02]"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg,#f5f7fa 0%,#c9d3de 30%,#eef2f6 50%,#b8c2ce 75%,#e7ecf2 100%)",
                  border: "1px solid #ffffff55",
                }}
              >
                Book a Service
              </Link>
              <Link
                href="/services"
                className="rounded-sm border border-silver-300 px-7 py-3.5 text-sm text-silver-200 transition-colors hover:border-silver-100 hover:text-silver-100"
              >
                View Our Services
              </Link>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div
              className="absolute h-80 w-80 rounded-full md:h-[26rem] md:w-[26rem]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 50% 50%, rgba(199,211,222,0.30) 0%, rgba(199,211,222,0.12) 40%, rgba(199,211,222,0) 70%)",
              }}
              aria-hidden
            />
            <div
              className="animate-spin-slow absolute h-64 w-64 rounded-full border border-dashed border-white/15 md:h-[22rem] md:w-[22rem]"
              aria-hidden
            />
            {/* The real 3D model, held still — only the hands move — with
                two procedural straps standing in for the source CAD file's
                missing strap geometry. */}
            <div className="relative h-80 w-80 drop-shadow-[0_0_40px_rgba(199,211,222,0.25)] md:h-[26rem] md:w-[26rem]">
              <HeroWatchScene />
            </div>
          </div>
        </div>
      </section>

      {/* Brands marquee */}
      <section className="border-y border-white/10 bg-navy-900 py-7">
        <Marquee
          items={BRANDS.map((brand) => (
            <span
              key={brand}
              className="px-6 font-serif text-sm tracking-[0.2em] text-silver-500 uppercase"
            >
              {brand}
            </span>
          ))}
        />
      </section>

      {/* Story + values — the one light break in an otherwise dark page */}
      <section className="bg-silver-100 px-6 py-24 text-navy-950">
        <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[1fr_0.8fr]">
          <Reveal>
            <p className="font-serif text-sm tracking-[0.25em] text-navy-700/70 uppercase">
              About Us
            </p>
            <h2 className="mt-3 font-serif text-4xl leading-tight text-navy-950">
              Trusted care, uncompromising standards
            </h2>
            <p className="mt-6 max-w-lg text-navy-800/80">
              Callin Watch Care is dedicated to the servicing, restoration and refurbishment of
              fine watches. Every timepiece that passes through our workshop is handled with the
              same care and attention to detail as the craftsmen who first built it.
            </p>
            <Link
              href="/about"
              className="mt-6 inline-block border-b border-navy-950 pb-0.5 text-sm text-navy-950 hover:opacity-70"
            >
              Read our story &rarr;
            </Link>

            <div className="mt-12 flex flex-wrap gap-x-10 gap-y-6">
              {STYLES.map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-navy-700">
                  <Icon className="h-9 w-9" />
                  <span className="text-xs tracking-wide uppercase">{label}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <ol className="space-y-8 border-l border-navy-950/15 pl-8">
              {VALUES.map((v) => (
                <li key={v.n}>
                  <span className="font-mono text-xs text-navy-700/60">{v.n}</span>
                  <h3 className="mt-1 font-serif text-xl text-navy-950">{v.label}</h3>
                  <p className="mt-1 text-sm text-navy-800/70">{v.copy}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* Services — a featured piece plus supporting tiles, not a uniform grid */}
      <section className="bg-navy-950 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="font-serif text-sm tracking-[0.25em] text-silver-600 uppercase">
              What We Offer
            </p>
            <h2 className="mt-3 font-serif text-3xl text-silver-100">Our Services</h2>
          </Reveal>

          <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:grid-rows-2">
            <Reveal className="lg:col-span-2 lg:row-span-2">
              <div className="flex h-full flex-col justify-between rounded border border-navy-700 bg-navy-800 p-10">
                <div>
                  <PocketWatchIcon className="h-20 w-20 text-silver-400" />
                  <h3 className="mt-6 font-serif text-3xl text-silver-100">Restoration</h3>
                  <p className="mt-4 max-w-md text-silver-300">
                    Careful restoration of vintage and antique movements, dials and cases —
                    returning heirloom timepieces to their original glory. Period-correct parts,
                    dial and hand refinishing, and a full movement rebuild.
                  </p>
                </div>
                <Link
                  href="/services"
                  className="mt-8 inline-block w-fit border-b border-silver-400 pb-0.5 text-sm text-silver-200 hover:border-silver-100 hover:text-silver-100"
                >
                  Learn more &rarr;
                </Link>
              </div>
            </Reveal>

            {[
              { title: "Watch Servicing", Icon: GearGlyph, desc: "Cleaning, lubrication, regulation." },
              { title: "Maintenance", Icon: DressWatchIcon, desc: "Routine checks, before small issues grow." },
              { title: "Refurbishment", Icon: DiveWatchIcon, desc: "Case, bracelet and dial renewal." },
              { title: "Strap Replacement", Icon: ChronographIcon, desc: "Leather, metal and NATO, expertly fitted." },
            ].map((service, i) => (
              <Reveal key={service.title} delay={i * 80}>
                <div className="group flex h-full flex-col justify-between rounded border border-navy-700 bg-navy-800 p-6 transition-colors hover:border-silver-500/50">
                  <div>
                    <service.Icon className="h-10 w-10 text-silver-400 transition-colors group-hover:text-silver-200" />
                    <h3 className="mt-4 font-serif text-lg text-silver-100">{service.title}</h3>
                    <p className="mt-2 text-sm text-silver-300">{service.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Anatomy of care */}
      <section className="relative overflow-hidden bg-navy-900 px-6 pt-24 pb-16">
        <GlowField className="top-0 -left-40 h-96 w-96" />
        <div className="relative mx-auto max-w-5xl">
          <Reveal>
            <p className="font-serif text-sm tracking-[0.25em] text-silver-600 uppercase">
              Inside The Workshop
            </p>
            <h2 className="mt-3 max-w-lg font-serif text-3xl text-silver-100">
              The anatomy of a careful restoration
            </h2>
            <p className="mt-4 max-w-xl text-silver-400">
              Every job that comes through our workshop follows the same disciplined process,
              piece by piece. Scroll to see it come apart.
            </p>
          </Reveal>
        </div>
      </section>
      <section className="relative bg-navy-900">
        <ExplodedWatchSection />
      </section>

      {/* Process */}
      <section className="bg-navy-950 px-6 py-24 text-center">
        <Reveal>
          <p className="font-serif text-sm tracking-[0.25em] text-silver-600 uppercase">
            How It Works
          </p>
          <h2 className="mt-3 font-serif text-3xl text-silver-100">
            A Simple, Transparent Process
          </h2>
        </Reveal>
        <div className="relative mx-auto mt-16 grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div
            className="absolute top-6 right-[12%] left-[12%] hidden h-px lg:block"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(154,167,184,0) 0%, rgba(200,209,222,0.5) 50%, rgba(154,167,184,0) 100%)",
            }}
            aria-hidden
          />
          {PROCESS.map((item, i) => (
            <Reveal key={item.step} delay={i * 100} className="relative">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-silver-400 bg-navy-950 font-serif text-lg text-silver-200">
                {item.step}
              </div>
              <h3 className="mt-4 font-serif text-lg text-silver-100">{item.title}</h3>
              <p className="mt-1 text-sm text-silver-300">{item.description}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA — full-bleed, oversized */}
      <section className="relative overflow-hidden bg-navy-950 px-6 py-32 text-center">
        <ChronographIcon className="absolute top-1/2 left-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 text-white/[0.03]" />
        <GlowField className="top-1/2 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2" />
        <Reveal className="relative">
          <h2 className="font-serif text-4xl text-silver-100 md:text-6xl">
            Ready to Restore
            <br />
            <span className="italic text-silver-400">Your Watch?</span>
          </h2>
          <p className="mx-auto mt-6 max-w-md text-silver-300">
            Get in touch to book a service or request a free assessment.
          </p>
          <Link
            href="/contact"
            className="mt-10 inline-block rounded-sm px-8 py-4 text-sm font-medium text-navy-950 transition-transform hover:scale-[1.02]"
            style={{
              backgroundImage:
                "linear-gradient(135deg,#f5f7fa 0%,#c9d3de 30%,#eef2f6 50%,#b8c2ce 75%,#e7ecf2 100%)",
              border: "1px solid #ffffff55",
            }}
          >
            Book Now
          </Link>
        </Reveal>
      </section>
    </>
  );
}
