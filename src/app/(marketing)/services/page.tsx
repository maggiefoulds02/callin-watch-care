import type { Metadata } from "next";

export const metadata: Metadata = { title: "Services — Callin Watch Care" };

const SERVICES = [
  {
    title: "Watch Servicing",
    description:
      "Complete movement servicing — cleaning, lubrication, regulation and water-resistance testing to keep your watch running at its best.",
  },
  {
    title: "Maintenance",
    description:
      "Routine care and inspection to catch small issues before they become costly repairs, preserving performance and value over time.",
  },
  {
    title: "Restoration",
    description:
      "Careful restoration of vintage and antique movements, dials and cases — returning heirloom timepieces to their original glory.",
  },
  {
    title: "Refurbishment",
    description:
      "Case and bracelet refinishing, dial refreshing and cosmetic renewal for watches that deserve to look as good as they run.",
  },
  {
    title: "Strap Replacement",
    description:
      "Expert fitting of new leather, metal and NATO straps, sized and finished to complement your watch perfectly.",
  },
];

export default function ServicesPage() {
  return (
    <section className="bg-navy-950 px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <p className="font-serif text-sm tracking-[0.25em] text-silver-600 uppercase">
          What We Offer
        </p>
        <h1 className="mt-3 font-serif text-4xl text-silver-100">Services</h1>
        <div className="mt-12 space-y-10">
          {SERVICES.map((service) => (
            <div
              key={service.title}
              className="border-b border-white/10 pb-8 last:border-none"
            >
              <h2 className="font-serif text-xl text-silver-100">
                {service.title}
              </h2>
              <p className="mt-2 text-silver-300">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
