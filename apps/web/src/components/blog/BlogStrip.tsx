"use client";

import Link from "next/link";
import useSWR from "swr";
import type { BlogListResponse } from "@/lib/apiTypes";
import { BlogCard } from "./BlogCard";

export function BlogStrip() {
  const { data } = useSWR<BlogListResponse>("/blog?limit=3");
  const posts = data?.posts ?? [];
  if (posts.length === 0) return null;

  return (
    <section className="container-page py-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">From the blog</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">Fresh off the counter</h2>
        </div>
        <Link href="/blog" className="link text-sm">
          All posts →
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <BlogCard key={p.id} post={p} compact />
        ))}
      </div>
    </section>
  );
}
