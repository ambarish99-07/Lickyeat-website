import type { CreateBlogPostRequest, UpdateBlogPostRequest } from "@lickyeat/shared-types";
import { estimateReadMinutes } from "@lickyeat/shared-types";
import { BlogModel } from "../../db/models/Blog.model.js";
import { badRequest, notFound } from "../../lib/errors.js";
import { serialize } from "../../lib/serialize.js";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export async function listPublished(opts: { limit?: number; tag?: string } = {}) {
  const filter: Record<string, unknown> = { status: "published" };
  if (opts.tag) filter.tags = opts.tag;
  const posts = await BlogModel.find(filter)
    .sort({ publishedAt: -1 })
    .limit(opts.limit ?? 50)
    .lean();
  return posts.map((p) => serialize(p));
}

export async function getPublishedBySlug(slug: string) {
  const post = await BlogModel.findOne({ _id: slug, status: "published" }).lean();
  if (!post) throw notFound("Post not found");
  return serialize(post);
}

// ---- admin ----

export async function listAllPosts() {
  const posts = await BlogModel.find({}).sort({ updatedAt: -1 }).lean();
  return posts.map((p) => serialize(p));
}

export async function createPost(input: CreateBlogPostRequest) {
  const _id = input.id ?? slugify(input.title);
  if (!_id) throw badRequest("A title (or slug) is required.");
  if (await BlogModel.exists({ _id })) throw badRequest("A post with that slug already exists.");
  const post = await BlogModel.create({
    ...input,
    _id,
    readMinutes: estimateReadMinutes(input.body ?? ""),
    publishedAt:
      input.status === "published" ? (input.publishedAt ? new Date(input.publishedAt) : new Date()) : null,
  });
  return serialize(post.toObject());
}

export async function updatePost(slug: string, input: UpdateBlogPostRequest) {
  const post = await BlogModel.findById(slug);
  if (!post) throw notFound("Post not found");

  if (input.title !== undefined) post.title = input.title;
  if (input.excerpt !== undefined) post.excerpt = input.excerpt;
  if (input.coverImageUrl !== undefined) post.coverImageUrl = input.coverImageUrl;
  if (input.author !== undefined) post.author = input.author;
  if (input.tags !== undefined) post.tags = input.tags;
  if (input.body !== undefined) {
    post.body = input.body;
    post.readMinutes = estimateReadMinutes(input.body);
  }
  if (input.status !== undefined) {
    post.status = input.status;
    if (input.status === "published" && !post.publishedAt) post.publishedAt = new Date();
  }
  if (input.publishedAt !== undefined) {
    post.publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
  }

  await post.save();
  return serialize(post.toObject());
}

export async function deletePost(slug: string) {
  const res = await BlogModel.findByIdAndDelete(slug).lean();
  if (!res) throw notFound("Post not found");
}
