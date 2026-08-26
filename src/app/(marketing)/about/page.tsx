import type { Metadata } from "next";

export const metadata: Metadata = { title: "About — Callin Watch Care" };

export default function AboutPage() {
  return (
    <section className="bg-navy-950 px-6 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-serif text-sm tracking-[0.25em] text-silver-600 uppercase">
          About Us
        </p>
        <h1 className="mt-3 font-serif text-4xl text-silver-100">
          Trusted Care, Uncompromising Standards
        </h1>
        <p className="mt-8 text-silver-300">
          Callin Watch Care is dedicated to the servicing, restoration and
          refurbishment of fine watches. Every timepiece that passes through
          our workshop is handled with the same care and attention to detail
          as the craftsmen who first built it — from routine maintenance to
          complete mechanical and cosmetic restoration.
        </p>
        <p className="mt-4 text-silver-400 italic">
          {/* TODO (owner): replace with your story — years of experience,
              training, or what makes your workshop different. */}
          [Add your story here — years of experience, training, or what
          makes your workshop different.]
        </p>
      </div>
    </section>
  );
}
