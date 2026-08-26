import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Contact — Callin Watch Care" };

export default function ContactPage() {
  return (
    <section className="bg-navy-950 px-6 py-20">
      <div className="mx-auto grid max-w-4xl gap-16 md:grid-cols-2">
        <div>
          <p className="font-serif text-sm tracking-[0.25em] text-silver-600 uppercase">
            Get In Touch
          </p>
          <h1 className="mt-3 font-serif text-4xl text-silver-100">
            Contact
          </h1>
          <div className="mt-10 space-y-6 text-sm">
            <div>
              <p className="font-serif italic tracking-[0.15em] text-silver-500 uppercase">
                Visit Us
              </p>
              <p className="mt-1 text-silver-200">[Add your address]</p>
            </div>
            <div>
              <p className="font-serif italic tracking-[0.15em] text-silver-500 uppercase">
                Contact
              </p>
              <p className="mt-1 text-silver-200">
                [Add phone number]
                <br />
                [Add email address]
              </p>
            </div>
            <div>
              <p className="font-serif italic tracking-[0.15em] text-silver-500 uppercase">
                Opening Hours
              </p>
              <p className="mt-1 text-silver-200">[Add opening hours]</p>
            </div>
          </div>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
