import { Router } from "express";
import { CreateBlogPostRequestSchema, UpdateBlogPostRequestSchema } from "@lickyeat/shared-types";
import { asyncHandler, parse, param, queryStr } from "../../lib/http.js";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import * as service from "./blog.service.js";

export const blogRouter: Router = Router();

// ---- public ----
blogRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const tag = queryStr(req, "tag");
    const limit = Number(queryStr(req, "limit") ?? 0) || undefined;
    res.json({ posts: await service.listPublished({ tag, limit }) });
  }),
);

// ---- admin ----
blogRouter.get(
  "/admin/all",
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    res.json({ posts: await service.listAllPosts() });
  }),
);

blogRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = parse(CreateBlogPostRequestSchema, req.body);
    res.status(201).json({ post: await service.createPost(body) });
  }),
);

blogRouter.patch(
  "/:slug",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = parse(UpdateBlogPostRequestSchema, req.body);
    res.json({ post: await service.updatePost(param(req, "slug"), body) });
  }),
);

blogRouter.delete(
  "/:slug",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await service.deletePost(param(req, "slug"));
    res.status(204).end();
  }),
);

// ---- public single (kept last so it doesn't shadow /admin/all) ----
blogRouter.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    res.json({ post: await service.getPublishedBySlug(param(req, "slug")) });
  }),
);
