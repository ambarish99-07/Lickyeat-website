import { Schema, model, type InferSchemaType } from "mongoose";
import { nanoid } from "nanoid";

/**
 * A durable notification for the admin team. Written when a lead comes in and
 * cleared only when an admin marks it read — so an alert raised while the panel
 * is closed is still waiting the next time someone signs in.
 */
const adminAlertSchema = new Schema(
  {
    _id: { type: String, default: () => nanoid(12) },
    type: { type: String, enum: ["lead.new", "lead.callback"], required: true },
    priority: { type: String, enum: ["normal", "high"], default: "normal" },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    leadId: { type: String, default: null },
    href: { type: String, default: null },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    /** set once we've also pushed this out over email / WhatsApp to ops. */
    dispatchedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, _id: false },
);

adminAlertSchema.index({ read: 1, createdAt: -1 });

export type AdminAlertDoc = InferSchemaType<typeof adminAlertSchema>;
export const AdminAlertModel = model("AdminAlert", adminAlertSchema);
