import { Router } from "express";
import {
  CreateLeadRequestSchema,
  UpdateLeadRequestSchema,
  franchiseBriefText,
} from "@lickyeat/shared-types";
import { asyncHandler, parse, param, queryStr } from "../../lib/http.js";
import { requireAuth, requireAdmin } from "../../middleware/auth.js";
import { leadRateLimiter } from "../../middleware/rateLimit.js";
import { env } from "../../config/env.js";
import * as service from "./leads.service.js";

export const leadsRouter: Router = Router();

// ---- public ----

/** Contact details the web app needs for wa.me deep links + the on-screen brief. */
leadsRouter.get("/contact", (_req, res) => {
  res.json({
    whatsappNumber: env.contact.whatsappNumber ?? null,
    supportEmail: env.contact.supportEmail ?? null,
  });
});

leadsRouter.post(
  "/",
  leadRateLimiter,
  asyncHandler(async (req, res) => {
    const body = parse(CreateLeadRequestSchema, req.body);
    const lead = await service.createLead(body, `web:${queryStr(req, "from") ?? body.kind}`);
    const brief =
      body.kind === "franchise"
        ? franchiseBriefText({ scope: body.scope })
        : undefined;
    res.status(201).json({ lead, brief });
  }),
);

// ---- admin ----

leadsRouter.use(requireAuth, requireAdmin);

leadsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json({
      leads: await service.listLeads({
        kind: queryStr(req, "kind"),
        status: queryStr(req, "status"),
        callbackOnly: queryStr(req, "callback") === "1",
      }),
    });
  }),
);

leadsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const body = parse(UpdateLeadRequestSchema, req.body);
    res.json({ lead: await service.updateLead(param(req, "id"), body, req.user?.name) });
  }),
);

leadsRouter.get(
  "/alerts/list",
  asyncHandler(async (req, res) => {
    res.json({ alerts: await service.listAlerts({ unreadOnly: queryStr(req, "unread") === "1" }) });
  }),
);

leadsRouter.get(
  "/alerts/count",
  asyncHandler(async (_req, res) => {
    res.json(await service.unreadAlertCount());
  }),
);

leadsRouter.post(
  "/alerts/read",
  asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    res.json(await service.markAlertsRead(ids));
  }),
);
