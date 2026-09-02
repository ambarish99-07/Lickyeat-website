import { Schema, model, type InferSchemaType } from "mongoose";

const closureSchema = new Schema(
  {
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    reason: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type TiffinClosureDoc = InferSchemaType<typeof closureSchema>;
export const TiffinClosureModel = model("TiffinClosure", closureSchema);
