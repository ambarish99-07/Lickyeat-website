import type { CreateLeadRequest, LeadStatus, UpdateLeadRequest } from "@lickyeat/shared-types";
import { LeadModel } from "../../db/models/Lead.model.js";
import { AdminAlertModel } from "../../db/models/AdminAlert.model.js";
import { BrandModel } from "../../db/models/Brand.model.js";
import { notFound, badRequest } from "../../lib/errors.js";
import { serialize } from "../../lib/serialize.js";
import { dispatchOpsAlert } from "./notify.js";

const KIND_LABEL: Record<string, string> = {
  franchise: "Franchise enquiry",
  catering: "Catering enquiry",
  callback: "Call-back request",
};

function splitInput(input: CreateLeadRequest) {
  const { kind, name, whatsapp, email, city, message, callbackRequested, company, ...rest } =
    input as CreateLeadRequest & { company?: string };
  void company; // honeypot, already validated empty
  return {
    common: {
      kind,
      name,
      whatsapp,
      email: email || null,
      city,
      message: message || null,
      callbackRequested: kind === "callback" ? true : Boolean(callbackRequested),
    },
    details: rest as Record<string, unknown>,
  };
}

export async function createLead(input: CreateLeadRequest, source = "web") {
  if (input.kind === "franchise" && input.scope === "single-brand" && !input.brandId) {
    throw badRequest("Pick which brand you'd like to franchise.");
  }

  const { common, details } = splitInput(input);
  const lead = await LeadModel.create({
    ...common,
    source,
    details,
    callbackRequestedAt: common.callbackRequested ? new Date() : null,
  });

  const brandName =
    input.kind === "franchise" && input.brandId
      ? (await BrandModel.findOne({ brandId: input.brandId }).lean())?.name ?? input.brandId
      : null;

  const summaryBits: string[] = [`${common.name} · ${common.whatsapp} · ${common.city}`];
  if (input.kind === "franchise") {
    summaryBits.push(
      input.scope === "single-brand"
        ? `Single brand${brandName ? ` — ${brandName}` : ""}`
        : "Full Lickyeat territory",
    );
    if (input.investmentBand) summaryBits.push(`Budget: ${input.investmentBand}`);
  }
  if (input.kind === "catering") {
    summaryBits.push(`${input.eventType} · ${input.guestCount} guests`);
    if (input.eventDate) summaryBits.push(`on ${input.eventDate}`);
  }
  if (input.kind === "callback") summaryBits.push(`Topic: ${input.topic}`);

  const priority = common.callbackRequested ? "high" : "normal";
  const alert = await AdminAlertModel.create({
    type: common.callbackRequested ? "lead.callback" : "lead.new",
    priority,
    title: `${KIND_LABEL[common.kind]} — ${common.name}`,
    body: summaryBits.join(" · "),
    leadId: lead._id,
    href: "/admin/leads",
  });

  // Fire-and-forget the external fan-out; the persisted alert is the source of truth.
  void dispatchOpsAlert({
    title: alert.title,
    body: alert.body,
    leadId: lead._id,
    priority,
  })
    .then(async (channels) => {
      if (channels.length) {
        await AdminAlertModel.updateOne({ _id: alert._id }, { dispatchedAt: new Date() });
      }
    })
    .catch(() => {
      /* swallowed — admin panel still has the alert */
    });

  return serialize(lead.toObject());
}

export async function listLeads(opts: {
  kind?: string;
  status?: string;
  callbackOnly?: boolean;
} = {}) {
  const filter: Record<string, unknown> = {};
  if (opts.kind) filter.kind = opts.kind;
  if (opts.status) filter.status = opts.status;
  if (opts.callbackOnly) filter.callbackRequested = true;
  const leads = await LeadModel.find(filter).sort({ createdAt: -1 }).limit(300).lean();
  return leads.map((l) => serialize(l));
}

export async function updateLead(id: string, input: UpdateLeadRequest, by?: string) {
  const lead = await LeadModel.findById(id);
  if (!lead) throw notFound("Lead not found");
  if (input.status) lead.status = input.status as LeadStatus;
  if (input.note) {
    lead.notes.push({ body: input.note, at: new Date(), by: by ?? null });
  }
  await lead.save();
  return serialize(lead.toObject());
}

/* --------------------------------------------------------------- alerts ---- */

export async function listAlerts(opts: { unreadOnly?: boolean; limit?: number } = {}) {
  const filter = opts.unreadOnly ? { read: false } : {};
  const alerts = await AdminAlertModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(opts.limit ?? 50)
    .lean();
  return alerts.map((a) => serialize(a));
}

export async function unreadAlertCount() {
  const [total, callbacks] = await Promise.all([
    AdminAlertModel.countDocuments({ read: false }),
    AdminAlertModel.countDocuments({ read: false, type: "lead.callback" }),
  ]);
  return { total, callbacks };
}

export async function markAlertsRead(ids: string[]) {
  const filter = ids.length ? { _id: { $in: ids } } : {};
  await AdminAlertModel.updateMany(filter, { read: true, readAt: new Date() });
  return unreadAlertCount();
}
