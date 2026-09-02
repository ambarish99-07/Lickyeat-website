import { z } from "zod";

export const BlogStatusSchema = z.enum(["draft", "published"]);
export type BlogStatus = z.infer<typeof BlogStatusSchema>;

export const BlogPostSchema = z.object({
  /** slug — also the Mongo _id. */
  id: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  excerpt: z.string().max(400).default(""),
  /** lightweight markdown: `## heading`, `- list`, blank-line paragraphs, **bold**. */
  body: z.string().default(""),
  coverImageUrl: z.string().nullable().default(null),
  author: z.string().default("Team Lickyeat"),
  tags: z.array(z.string()).default([]),
  readMinutes: z.number().int().positive().default(3),
  status: BlogStatusSchema.default("draft"),
  publishedAt: z.string().nullable().default(null),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type BlogPost = z.infer<typeof BlogPostSchema>;

export const CreateBlogPostRequestSchema = BlogPostSchema.omit({
  createdAt: true,
  updatedAt: true,
  readMinutes: true,
}).partial({
  id: true,
  excerpt: true,
  body: true,
  coverImageUrl: true,
  author: true,
  tags: true,
  status: true,
  publishedAt: true,
});
export type CreateBlogPostRequest = z.infer<typeof CreateBlogPostRequestSchema>;

export const UpdateBlogPostRequestSchema = CreateBlogPostRequestSchema.partial();
export type UpdateBlogPostRequest = z.infer<typeof UpdateBlogPostRequestSchema>;

/** ~200 wpm reading estimate, floored to 1. */
export function estimateReadMinutes(body: string): number {
  return Math.max(1, Math.round(body.trim().split(/\s+/).filter(Boolean).length / 200));
}
