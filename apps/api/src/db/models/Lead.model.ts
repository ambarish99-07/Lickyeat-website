import { Schema, model, type InferSchemaType } from "mongoose";
import { nanoid } from "nanoid";
import { LEAD_STATUSES } from "@lickyeat/shared-types";

const noteSchema = new Schema(
  {
    body: { type: String, required: true },
    at: { type: Date, default: Date.now },
    by: { type: String, default: null },
  },
  { _id: false },
);

const leadSchema = new Schema(
  {
    _id: { type: String, default: () => nanoid(12) },
    kind: { type: String, enum: ["franchise", "catering", "callback"], required: true, index: true },
    name: { type: String, required: true },
    whatsapp: { type: String, required: true },
    email: { type: String, default: null },
    city: { type: String, required: true },
    message: { type: String, default: null },
    callbackRequested: { type: Boolean, default: false, index: true },
    callbackRequestedAt: { type: Date, default: null },
    status: { type: String, enum: [...LEAD_STATUSES], default: "new", index: true },
    source: { type: String, default: "web" },
    /** kind-specific payload (franchise scope/brand, catering event, callback topic…). */
    details: { type: Schema.Types.Mixed, default: {} },
    notes: { type: [noteSchema], default: [] },
  },
  { timestamps: true, _id: false },
);

leadSchema.index({ createdAt: -1 });

export type LeadDoc = InferSchemaType<typeof leadSchema>;
export const LeadModel = model("Lead", leadSchema);
