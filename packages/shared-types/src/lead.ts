import { z } from "zod";

/* ------------------------------------------------------------------ leads ---- */

export const LeadKindSchema = z.enum(["franchise", "catering", "callback"]);
export type LeadKind = z.infer<typeof LeadKindSchema>;

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "in-discussion",
  "won",
  "lost",
] as const;
export const LeadStatusSchema = z.enum(LEAD_STATUSES);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;

export const FRANCHISE_SCOPES = ["single-brand", "full-lickyeat"] as const;
export const FranchiseScopeSchema = z.enum(FRANCHISE_SCOPES);
export type FranchiseScope = (typeof FRANCHISE_SCOPES)[number];

export const CATERING_EVENT_TYPES = [
  "corporate",
  "wedding",
  "birthday",
  "college-fest",
  "house-party",
  "other",
] as const;
export const CateringEventTypeSchema = z.enum(CATERING_EVENT_TYPES);
export type CateringEventType = (typeof CATERING_EVENT_TYPES)[number];

/** Loose phone check — 10-digit Indian mobile, optionally +91 / leading 0 / spaces. */
export const LeadPhoneSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^(\+?91|0)?[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"));

const BaseLeadFields = {
  name: z.string().trim().min(2).max(80),
  whatsapp: LeadPhoneSchema,
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  callbackRequested: z.boolean().default(false),
  /** honeypot — must be empty. */
  company: z.string().max(0).optional(),
};

export const FranchiseLeadInputSchema = z.object({
  kind: z.literal("franchise"),
  ...BaseLeadFields,
  scope: FranchiseScopeSchema,
  /** required when scope === "single-brand" */
  brandId: z.string().trim().max(64).optional(),
  hasSpace: z.boolean().default(false),
  investmentBand: z.string().trim().max(40).optional().or(z.literal("")),
  timeframe: z.string().trim().max(60).optional().or(z.literal("")),
  currentOccupation: z.string().trim().max(120).optional().or(z.literal("")),
});

export const CateringLeadInputSchema = z.object({
  kind: z.literal("catering"),
  ...BaseLeadFields,
  eventType: CateringEventTypeSchema,
  eventDate: z.string().trim().max(30).optional().or(z.literal("")),
  guestCount: z.coerce.number().int().min(1).max(100000),
  brands: z.array(z.string().trim().max(64)).max(10).default([]),
  venue: z.string().trim().max(160).optional().or(z.literal("")),
});

export const CallbackLeadInputSchema = z.object({
  kind: z.literal("callback"),
  ...BaseLeadFields,
  topic: z.enum(["franchise", "catering", "order-help", "other"]).default("other"),
  callbackRequested: z.literal(true).default(true),
});

export const CreateLeadRequestSchema = z.discriminatedUnion("kind", [
  FranchiseLeadInputSchema,
  CateringLeadInputSchema,
  CallbackLeadInputSchema,
]);
export type CreateLeadRequest = z.infer<typeof CreateLeadRequestSchema>;
export type FranchiseLeadInput = z.infer<typeof FranchiseLeadInputSchema>;
export type CateringLeadInput = z.infer<typeof CateringLeadInputSchema>;
export type CallbackLeadInput = z.infer<typeof CallbackLeadInputSchema>;

export const LeadNoteSchema = z.object({
  body: z.string(),
  at: z.string(),
  by: z.string().optional(),
});

export const LeadSchema = z.object({
  id: z.string(),
  kind: LeadKindSchema,
  name: z.string(),
  whatsapp: z.string(),
  email: z.string().nullable().optional(),
  city: z.string(),
  message: z.string().nullable().optional(),
  callbackRequested: z.boolean(),
  callbackRequestedAt: z.string().nullable().optional(),
  status: LeadStatusSchema,
  source: z.string(),
  details: z.record(z.unknown()).default({}),
  notes: z.array(LeadNoteSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Lead = z.infer<typeof LeadSchema>;

export const UpdateLeadRequestSchema = z.object({
  status: LeadStatusSchema.optional(),
  note: z.string().trim().min(1).max(1000).optional(),
});
export type UpdateLeadRequest = z.infer<typeof UpdateLeadRequestSchema>;

/* --------------------------------------------------------------- alerts ---- */

export const AdminAlertSchema = z.object({
  id: z.string(),
  type: z.enum(["lead.new", "lead.callback"]),
  priority: z.enum(["normal", "high"]),
  title: z.string(),
  body: z.string(),
  leadId: z.string().nullable().optional(),
  href: z.string().nullable().optional(),
  read: z.boolean(),
  readAt: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type AdminAlert = z.infer<typeof AdminAlertSchema>;

/* ---------------------------------------------------------- franchise data -- */

export interface FranchisePlan {
  scope: FranchiseScope;
  name: string;
  blurb: string;
  investment: string;
  area: string;
  staff: string;
  payback: string;
  brandFee: string;
  royalty: string;
  highlights: string[];
}

/**
 * Indicative figures shown on /franchise. These are placeholders — final terms
 * are shared on the discovery call and can vary by city and format.
 */
export const FRANCHISE_PLANS: FranchisePlan[] = [
  {
    scope: "single-brand",
    name: "Single-brand franchise",
    blurb:
      "Run one Lickyeat brand — The Blenders Club, The Alchemy Tails, GG Tiffin or The Biryani Lane — as a compact outlet or cloud kitchen in your area.",
    investment: "₹12–25 lakh",
    area: "150–400 sq ft",
    staff: "3–6 people",
    payback: "14–20 months",
    brandFee: "₹3 lakh (one-time)",
    royalty: "6% of net sales",
    highlights: [
      "One menu to learn, faster to launch",
      "Cloud-kitchen or takeaway-counter format",
      "Ideal for a first-time food-business owner",
    ],
  },
  {
    scope: "full-lickyeat",
    name: "Full Lickyeat franchise",
    blurb:
      "Hold a whole territory and operate every Lickyeat brand from one kitchen — shakes, mocktails, tiffin and biryani — on a single shared order flow.",
    investment: "₹40–75 lakh",
    area: "600–1200 sq ft",
    staff: "10–18 people",
    payback: "20–30 months",
    brandFee: "₹8 lakh (one-time)",
    royalty: "5% of net sales",
    highlights: [
      "Exclusive rights to your city / zone",
      "One combined order can mix every brand",
      "Central menu, pricing, app and marketing",
    ],
  },
];

export const FRANCHISE_INVESTMENT_BANDS = [
  "Under ₹15 lakh",
  "₹15–30 lakh",
  "₹30–50 lakh",
  "₹50 lakh–1 crore",
  "Over ₹1 crore",
] as const;

export const FRANCHISE_TIMEFRAMES = [
  "Ready now",
  "Within 3 months",
  "3–6 months",
  "Just exploring",
] as const;

export const CATERING_MIN_GUESTS = 20;

/** Plain-text brief sent on WhatsApp / shown on screen after a franchise enquiry. */
export function franchiseBriefText(opts: { scope?: FranchiseScope } = {}): string {
  const plan = opts.scope
    ? FRANCHISE_PLANS.find((p) => p.scope === opts.scope)
    : undefined;
  const lines = [
    "Thanks for your interest in a Lickyeat franchise! Here's the quick picture:",
    "",
    "• You can take a SINGLE brand (The Blenders Club, The Alchemy Tails, GG Tiffin or The Biryani Lane) or a FULL Lickyeat territory with every brand.",
    "• Lickyeat can open in any city or town — you don't need to be in Patna.",
    "",
  ];
  if (plan) {
    lines.push(
      `${plan.name} — indicative:`,
      `• Investment: ${plan.investment}`,
      `• Space: ${plan.area}`,
      `• Brand fee: ${plan.brandFee} · Royalty: ${plan.royalty}`,
      `• Typical payback: ${plan.payback}`,
      "",
    );
  } else {
    lines.push(
      "Indicative investment: ₹12–25 lakh for a single brand, ₹40–75 lakh for a full territory. Final numbers depend on city and format.",
      "",
    );
  }
  lines.push(
    "Next step: our franchise team will call you within 24 hours to walk through the numbers, your location and the process.",
    "",
    "— Team Lickyeat",
  );
  return lines.join("\n");
}
