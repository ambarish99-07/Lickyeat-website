import { Schema, model, type InferSchemaType } from "mongoose";

const serviceHoursSchema = new Schema(
  {
    weekday: { type: Number, min: 0, max: 6 },
    open: String,
    close: String,
    closed: { type: Boolean, default: false },
  },
  { _id: false },
);

const plannedClosureSchema = new Schema({
  startDate: String,
  endDate: String,
  reason: { type: String, default: "" },
});

const core = {
  manualOpen: { type: Boolean, default: true },
  serviceHours: { type: [serviceHoursSchema], default: [] },
  plannedClosures: { type: [plannedClosureSchema], default: [] },
};

const storeSettingsSchema = new Schema(
  { scope: { type: String, default: "lickyeat", unique: true }, ...core },
  { timestamps: true },
);

const brandStoreSettingsSchema = new Schema(
  { brandId: { type: String, required: true, unique: true, lowercase: true }, ...core },
  { timestamps: true },
);

export type StoreSettingsDoc = InferSchemaType<typeof storeSettingsSchema>;
export type BrandStoreSettingsDoc = InferSchemaType<typeof brandStoreSettingsSchema>;
export const StoreSettingsModel = model("StoreSettings", storeSettingsSchema);
export const BrandStoreSettingsModel = model(
  "BrandStoreSettings",
  brandStoreSettingsSchema,
);
