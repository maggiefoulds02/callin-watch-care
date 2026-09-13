import type { Metadata } from "next";
import Link from "next/link";
import { GlowField } from "@/components/marketing/texture";
import { Reveal } from "@/components/marketing/reveal";
import {
  DressWatchIcon,
  DiveWatchIcon,
  ChronographIcon,
  PocketWatchIcon,
  GearGlyph,
} from "@/components/marketing/watch-icons";

export const metadata: Metadata = { title: "Services — Callin Watch Care" };

const FEATURED = [
  {
    title: "Watch Servicing",
    description:
      "Complete movement servicing — cleaning, lubrication, regulation and water-resistance testing to keep your watch running at its best.",
    includes: ["Full strip-down clean", "Lubrication & regulation", "Water-resistance test"],
    Icon: GearGlyph,
  },
  {
    title: "Restoration",
    description:
      "Careful restoration of vintage and antique movements, dials and cases — returning heirloom timepieces to their original glory.",
    includes: ["Period-correct parts sourcing", "Dial & hand refinishing", "Full movement rebuild"],
    Icon: PocketWatchIcon,
  },
];

const MORE = [
  {
    title: "Maintenance",
    description: "Routine care and inspection to catch small issues before they grow.",
    Icon: DressWatchIcon,
  },
  {
    title: "Refurbishment",
    description: "Case and bracelet refinishing, dial refreshing and cosmetic renewal.",
    Icon: DiveWatchIcon,
  },
  {
    title: "Strap Replacement",
    description: "Leather, metal and NATO straps, sized and fitted expertly.",
    Icon: ChronographIcon,
  },
];

const CHECKLIST = [
  "Photos taken",
  "Disassembly",
  "Ultrasonic clean",
  "Inspection",
  "Lubrication",
  "Timing test",
  "Pressure test",
  "Case restoration",
  "Final photography",
  "Client sign-off",
];

export default function ServicesPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 px-6 py-20">
        <GlowField className="-top-24 -right-24 h-96 w-96" />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="font-serif text-sm tracking-[0.25em] text-silver-600 uppercase">
            What We Offer
          </p>
          <h1 className="mt-3 font-serif text-4xl text-silver-100 md:text-6xl">Services</h1>
          <p className="mx-auto mt-5 max-w-xl text-silver-300">
            Every service is quoted transparently before we begin, and every watch leaves our
            workshop tested and ready to wear.
          </p>
        </div>
      </section>

      <section className="bg-navy-900 px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          {FEATURED.map((service, i) => (
            <Reveal key={service.title} delay={i * 100}>
              <div className="flex h-full flex-col rounded border border-navy-700 bg-navy-800 p-8">
                <service.Icon className="h-16 w-16 text-silver-400" />
                <h2 className="mt-5 font-serif text-2xl text-silver-100">{service.title}</h2>
                <p className="mt-3 text-silver-300">{service.description}</p>
                <ul className="mt-5 space-y-2">
                  {service.includes.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-silver-400">
                      <span className="h-1 w-1 rounded-full bg-silver-500" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mx-auto mt-6 grid max-w-5xl gap-6 sm:grid-cols-3">
          {MORE.map((service, i) => (
            <Reveal key={service.title} delay={i * 80}>
              <div className="flex h-full flex-col rounded border border-navy-700 bg-navy-800 p-6">
                <service.Icon className="h-10 w-10 text-silver-400" />
                <h3 className="mt-4 font-serif text-lg text-silver-100">{service.title}</h3>
                <p className="mt-2 text-sm text-silver-300">{service.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Checklist strip — the light break, and genuine information: this is
          the same 10-step checklist every job runs through in the admin. */}
      <section className="bg-silver-100 px-6 py-20 text-navy-950">
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center">
            <p className="font-serif text-sm tracking-[0.25em] text-navy-700/70 uppercase">
              Every Job, Every Time
            </p>
            <h2 className="mt-3 font-serif text-3xl text-navy-950">Our Ten-Point Checklist</h2>
            <p className="mx-auto mt-4 max-w-xl text-navy-800/70">
              Whatever the service, every watch works through the same disciplined checklist
              before it comes back to you.
            </p>
          </Reveal>
          <ol className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-5">
            {CHECKLIST.map((step, i) => (
              <Reveal key={step} delay={i * 40} className="border-t border-navy-950/15 pt-4">
                <span className="font-mono text-xs text-navy-700/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-1 text-sm text-navy-900">{step}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-navy-950 px-6 py-20 text-center">
        <Reveal>
          <h2 className="font-serif text-3xl text-silver-100">Not Sure What You Need?</h2>
          <p className="mx-auto mt-4 max-w-xl text-silver-300">
            Send us a few details and photos of your watch and we&apos;ll recommend the right
            service — no obligation, no pressure.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-block rounded-sm px-7 py-3.5 text-sm font-medium text-navy-950 transition-transform hover:scale-[1.02]"
            style={{
              backgroundImage:
                "linear-gradient(135deg,#f5f7fa 0%,#c9d3de 30%,#eef2f6 50%,#b8c2ce 75%,#e7ecf2 100%)",
              border: "1px solid #ffffff55",
            }}
          >
            Get In Touch
          </Link>
        </Reveal>
      </section>
    </>
  );
}
