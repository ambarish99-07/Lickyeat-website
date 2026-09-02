import { Schema, model, type InferSchemaType } from "mongoose";

const brandSchema = new Schema(
  {
    brandId: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    tagline: { type: String, default: "" },
    description: { type: String, default: "" },
    orderingModel: { type: String, enum: ["catalog", "tiffin"], default: "catalog" },
    status: { type: String, enum: ["live", "coming-soon"], default: "live" },
    logoUrl: { type: String, default: null },
    heroImageUrl: { type: String, default: null },
    primaryColor: { type: String, default: "#e8552d" },
    accentColor: { type: String, default: "#f4a259" },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type BrandDoc = InferSchemaType<typeof brandSchema>;
export const BrandModel = model("Brand", brandSchema);
