import Image from "next/image";
import Link from "next/link";
import { ActiveJobBanner } from "@/components/active-job-banner";
import { getActiveJobForCurrentCustomer } from "@/data/jobs";

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
      <section className="bg-navy-950 px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-[58%_42%]">
          <div>
            <p className="font-serif text-sm tracking-[0.25em] text-silver-400 uppercase">
              Callin Watch Care
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-silver-100 md:text-5xl">
              Expert Care for Exceptional Timepieces
            </h1>
            <div
              className="my-5 h-[3px] w-16 rounded-full"
              style={{
                backgroundImage:
                  "linear-gradient(90deg,#7c8aa0 0%,#f2f4f7 50%,#7c8aa0 100%)",
              }}
              aria-hidden
            />
            <p className="max-w-md text-silver-300">
              From routine servicing to complete restoration, every watch that
              comes through our workshop is treated with the precision,
              patience and discretion it deserves.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="rounded-sm px-6 py-3 text-sm font-medium text-navy-950"
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
                className="rounded-sm border border-silver-300 px-6 py-3 text-sm text-silver-200"
              >
                View Our Services
              </Link>
            </div>
          </div>
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at 50% 50%, rgba(199,211,222,0.28) 0%, rgba(199,211,222,0.10) 40%, rgba(199,211,222,0) 70%)",
            }}
          >
            <Image
              src="/brand/watch-illustration.png"
              alt="Minimalist line illustration of a wristwatch"
              width={300}
              height={300}
              className="w-64"
            />
          </div>
        </div>
      </section>

      <Divider />

      {/* About teaser */}
      <section className="bg-navy-900 px-6 py-16 text-center">
        <p className="font-serif text-sm tracking-[0.25em] text-silver-600 uppercase">
          About Us
        </p>
        <h2 className="mt-3 font-serif text-3xl text-silver-100">
          Trusted Care, Uncompromising Standards
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-silver-300">
          Callin Watch Care is dedicated to the servicing, restoration and
          refurbishment of fine watches. Every timepiece that passes through
          our workshop is handled with the same care and attention to detail
          as the craftsmen who first built it.
        </p>
      </section>

      <Divider />

      {/* Services */}
      <section className="bg-navy-950 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="font-serif text-sm tracking-[0.25em] text-silver-600 uppercase">
              What We Offer
            </p>
            <h2 className="mt-3 font-serif text-3xl text-silver-100">
              Our Services
            </h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <div
                key={service.title}
                className="rounded border border-navy-700 bg-navy-800 p-6"
              >
                <h3 className="font-serif text-lg text-silver-100">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm text-silver-300">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* Process */}
      <section className="bg-navy-900 px-6 py-16">
        <div className="mx-auto max-w-6xl text-center">
          <p className="font-serif text-sm tracking-[0.25em] text-silver-600 uppercase">
            How It Works
          </p>
          <h2 className="mt-3 font-serif text-3xl text-silver-100">
            A Simple, Transparent Process
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((item) => (
              <div key={item.step}>
                <p className="font-serif text-2xl text-silver-400">
                  {item.step}
                </p>
                <h3 className="mt-2 font-serif text-lg text-silver-100">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-silver-300">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* CTA */}
      <section className="bg-navy-950 px-6 py-20 text-center">
        <h2 className="font-serif text-3xl text-silver-100">
          Ready to Restore Your Watch?
        </h2>
        <p className="mt-4 text-silver-300">
          Get in touch to book a service or request a free assessment.
        </p>
        <Link
          href="/contact"
          className="mt-8 inline-block rounded-sm px-6 py-3 text-sm font-medium text-navy-950"
          style={{
            backgroundImage:
              "linear-gradient(135deg,#f5f7fa 0%,#c9d3de 30%,#eef2f6 50%,#b8c2ce 75%,#e7ecf2 100%)",
            border: "1px solid #ffffff55",
          }}
        >
          Book Now
        </Link>
      </section>
    </>
  );
}

function Divider() {
  return (
    <div
      className="h-px w-full"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(154,167,184,0) 0%, rgba(200,209,222,0.85) 50%, rgba(154,167,184,0) 100%)",
      }}
      aria-hidden
    />
  );
}
