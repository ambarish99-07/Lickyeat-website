import { Schema, model, type InferSchemaType } from "mongoose";

const blogSchema = new Schema(
  {
    _id: { type: String }, // slug
    title: { type: String, required: true },
    excerpt: { type: String, default: "" },
    body: { type: String, default: "" },
    coverImageUrl: { type: String, default: null },
    author: { type: String, default: "Team Lickyeat" },
    tags: { type: [String], default: [] },
    readMinutes: { type: Number, default: 3 },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true, _id: false },
);

blogSchema.index({ status: 1, publishedAt: -1 });

export type BlogDoc = InferSchemaType<typeof blogSchema>;
export const BlogModel = model("Blog", blogSchema);
