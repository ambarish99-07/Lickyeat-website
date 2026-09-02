import type { Metadata } from "next";
import { FRANCHISE_PLANS } from "@lickyeat/shared-types";
import { serverGet } from "@/lib/serverApi";
import type { BrandsResponse } from "@/lib/apiTypes";
import { FranchiseEnquiryForm } from "@/components/leads/FranchiseEnquiryForm";

export const metadata: Metadata = {
  title: "Franchise — own a Lickyeat",
  description:
    "Take a single Lickyeat brand or a full Lickyeat territory, in any city. Indicative investment, the process, and an enquiry form — our team calls back within 24 hours.",
};

export const revalidate = 300;

const STEPS: Array<[string, string]> = [
  ["Send an enquiry", "Tell us your city and whether you want one brand or the full Lickyeat. Takes two minutes."],
  ["We call you back", "Within 24 hours — a real conversation about numbers, your location and whether it's a fit."],
  ["Discovery & numbers", "Detailed unit economics, site evaluation, the franchise agreement and territory terms."],
  ["Setup & launch", "Kitchen build, equipment, staff training, menu certification, and go-live on the Lickyeat app."],
];

const WE_PROVIDE = [
  "Brand, recipes and the full menu system",
  "The Lickyeat app, website and shared order flow",
  "Central kitchen SOPs, training and audits",
  "Marketing, offers and loyalty run from head office",
  "Supply-chain support and approved vendors",
];
const YOU_BRING = [
  "The investment and working capital",
  "A location in your chosen city (we help evaluate)",
  "A hands-on operator — you or a full-time manager",
  "Local licences (FSSAI, GST, trade licence)",
  "Day-to-day running of the outlet",
];

const FAQ: Array<[string, string]> = [
  [
    "Can I open Lickyeat in a city where it doesn't exist yet?",
    "Yes. Lickyeat is built to open anywhere — a new city, a small town, or a second outlet in a city that already has one. You don't need to be in Patna.",
  ],
  [
    "What's the difference between a single-brand and a full franchise?",
    "A single-brand franchise runs one brand (say The Blenders Club) from a compact outlet or cloud kitchen. A full Lickyeat franchise gives you a territory and every brand from one kitchen, on one combined order flow.",
  ],
  [
    "Are the numbers on this page final?",
    "No — they're indicative. Real investment, rent, and payback depend on your city, format and site. You'll get exact figures on the discovery call.",
  ],
  [
    "Do I need food-business experience?",
    "It helps but isn't required for a single brand. A full territory is better suited to someone who has run a kitchen or retail operation before.",
  ],
];

export default async function FranchisePage() {
  let brands: BrandsResponse["brands"] = [];
  try {
    ({ brands } = await serverGet<BrandsResponse>("/brands", { revalidate: 300 }));
  } catch {
    /* render the shell; ISR fills in */
  }
  const brandOptions = brands
    .filter((b) => b.status === "live" || b.status === "coming-soon")
    .map((b) => ({ brandId: b.brandId, name: b.name }));

  return (
    <div>
      {/* Hero */}
      <section className="surface-brand border-b border-line">
        <div className="container-page grid gap-8 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-ink/55">
              Franchise with Lickyeat
            </p>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl">
              Bring Lickyeat to your city.
            </h1>
            <p className="mt-4 max-w-lg text-lg text-brand-ink/80">
              Take one brand or the whole Lickyeat. Open in any city or town. Our franchise team
              calls you back within 24 hours.
            </p>
            <a href="#enquiry" className="btn-dark btn-lg mt-7 inline-flex">
              Start an enquiry
            </a>
          </div>
        </div>
      </section>

      {/* Two paths */}
      <section className="container-page py-16">
        <p className="eyebrow">Two ways in</p>
        <h2 className="mt-1 font-display text-3xl font-extrabold">One brand, or the whole thing</h2>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {FRANCHISE_PLANS.map((p) => (
            <div key={p.scope} className="card flex flex-col p-6">
              <h3 className="font-display text-xl font-extrabold">{p.name}</h3>
              <p className="mt-2 text-sm text-charcoal">{p.blurb}</p>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {[
                  ["Investment (indicative)", p.investment],
                  ["Space", p.area],
                  ["Team", p.staff],
                  ["Typical payback", p.payback],
                  ["Brand fee", p.brandFee],
                  ["Royalty", p.royalty],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
              <ul className="mt-5 space-y-1.5 text-sm text-charcoal">
                {p.highlights.map((h) => (
                  <li key={h}>✓ {h}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">
          Figures are indicative and vary by city, format and site. Final numbers are shared on your
          discovery call.
        </p>
      </section>

      {/* Brands you can pick */}
      {brandOptions.length > 0 && (
        <section className="border-y border-line bg-sand/40">
          <div className="container-page py-14">
            <h2 className="font-display text-2xl font-extrabold">Brands you can franchise</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {brandOptions.map((b) => (
                <span key={b.brandId} className="chip bg-surface text-charcoal">
                  {b.name}
                </span>
              ))}
            </div>
            <p className="mt-4 max-w-xl text-sm text-muted">
              A full Lickyeat franchise includes every brand above under one roof, on one combined
              order flow.
            </p>
          </div>
        </section>
      )}

      {/* Process */}
      <section className="container-page py-16">
        <p className="eyebrow">The process</p>
        <h2 className="mt-1 font-display text-3xl font-extrabold">From enquiry to open</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <div key={t}>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-brand-ink font-display font-extrabold">
                {i + 1}
              </span>
              <h3 className="mt-3 font-display text-lg font-bold">{t}</h3>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Split of responsibilities */}
      <section className="border-y border-line bg-sand/40">
        <div className="container-page grid gap-8 py-14 sm:grid-cols-2">
          <div>
            <h3 className="font-display text-lg font-extrabold">What Lickyeat provides</h3>
            <ul className="mt-3 space-y-2 text-sm text-charcoal">
              {WE_PROVIDE.map((x) => (
                <li key={x}>✓ {x}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-display text-lg font-extrabold">What you bring</h3>
            <ul className="mt-3 space-y-2 text-sm text-charcoal">
              {YOU_BRING.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Enquiry */}
      <section id="enquiry" className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">Enquire</p>
            <h2 className="mt-1 font-display text-3xl font-extrabold">Tell us about you</h2>
            <p className="mt-3 max-w-md text-muted">
              You&rsquo;ll get the franchise brief on WhatsApp straight away, and our team will call
              you within 24 hours to go through everything.
            </p>
          </div>
          <FranchiseEnquiryForm brands={brandOptions} />
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-line bg-sand/40">
        <div className="container-page py-14">
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
        </div>
      </section>
    </div>
  );
}
