import type { Metadata } from "next";
import { serverGet } from "@/lib/serverApi";
import type { BrandsResponse } from "@/lib/apiTypes";
import { CateringEnquiryForm } from "@/components/leads/CateringEnquiryForm";

export const metadata: Metadata = {
  title: "Catering & bulk orders",
  description:
    "Live shake counters, a zero-proof cocktail bar, office tiffin runs and biryani for functions — Lickyeat catering for events of 20 to 2000. Request a quote.",
};

export const revalidate = 300;

const OFFERINGS: Array<[string, string]> = [
  ["Live shake counter", "A Blenders Club station at your venue — shakes and cold coffee blended to order in front of guests."],
  ["Zero-proof cocktail bar", "The Alchemy Tails set up a mocktail bar: clarified juices, smoked garnishes, the full show."],
  ["Office tiffin runs", "GG Tiffin delivers home-style thalis to your office daily or for a one-off team lunch."],
  ["Biryani for functions", "Dum-cooked biryani in bulk for weddings, poojas and get-togethers, with sides and raita."],
];

const FAQ: Array<[string, string]> = [
  ["How many guests do you cater for?", "From 20 for a small office lunch up to a few thousand for a wedding. Give us the number and we'll build a plan."],
  ["How much notice do you need?", "48 hours for tiffin and biryani in bulk; 5–7 days for live counters and bars so we can staff and set up."],
  ["Which cities?", "Patna and nearby for live counters. Bulk biryani and tiffin can travel further — ask us."],
];

export default async function CateringPage() {
  let brands: BrandsResponse["brands"] = [];
  try {
    ({ brands } = await serverGet<BrandsResponse>("/brands", { revalidate: 300 }));
  } catch {
    /* shell */
  }
  const brandOptions = brands
    .filter((b) => b.status === "live" || b.status === "coming-soon")
    .map((b) => ({ brandId: b.brandId, name: b.name }));

  return (
    <div>
      <section className="surface-brand border-b border-line">
        <div className="container-page grid gap-8 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-ink/55">
              Lickyeat catering
            </p>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl">
              For your event, from 20 to 2000.
            </h1>
            <p className="mt-4 max-w-lg text-lg text-brand-ink/80">
              Live shake counters, a mocktail bar, office tiffin, or biryani in bulk — one team,
              every Lickyeat kitchen.
            </p>
            <a href="#quote" className="btn-dark btn-lg mt-7 inline-flex">
              Request a quote
            </a>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <p className="eyebrow">What we do</p>
        <h2 className="mt-1 font-display text-3xl font-extrabold">Pick a format, or mix them</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {OFFERINGS.map(([t, d]) => (
            <div key={t} className="card p-6">
              <h3 className="font-display text-lg font-bold">{t}</h3>
              <p className="mt-1.5 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="quote" className="border-t border-line bg-sand/40">
        <div className="container-page py-16">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="eyebrow">Get a quote</p>
              <h2 className="mt-1 font-display text-3xl font-extrabold">Tell us about the event</h2>
              <p className="mt-3 max-w-md text-muted">
                Send the details and we&rsquo;ll come back with a plan and pricing. Ask for a call
                back and we&rsquo;ll ring within 24 hours.
              </p>
            </div>
            <CateringEnquiryForm brands={brandOptions} />
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <h2 className="font-display text-2xl font-extrabold">Questions</h2>
        <div className="mt-6 divide-y divide-line">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-4">
              <summary className="cursor-pointer list-none font-semibold marker:content-none">
                {q}
              </summary>
              <p className="mt-2 text-sm text-charcoal">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
