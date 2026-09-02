import type { Metadata } from "next";
import { serverGet } from "@/lib/serverApi";
import type { BlogListResponse } from "@/lib/apiTypes";
import { BlogCard } from "@/components/blog/BlogCard";
import { EmptyState } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notes from the Lickyeat counter — how we build our shakes and mocktails, what's on the tiffin menu this week, and the offers worth knowing about.",
};

export const revalidate = 120;

export default async function BlogIndexPage() {
  let posts: BlogListResponse["posts"] = [];
  try {
    ({ posts } = await serverGet<BlogListResponse>("/blog", { revalidate: 120 }));
  } catch {
    /* API down — render shell */
  }

  const [lead, ...rest] = posts;

  return (
    <div className="container-page py-10">
      <p className="eyebrow">The Lickyeat blog</p>
      <h1 className="mt-1 font-display text-4xl font-extrabold sm:text-5xl">Fresh off the counter</h1>
      <p className="mt-3 max-w-xl text-muted">
        How we make what we make, what's on the menu this week, and the fine print on our offers —
        written by the people behind the blender.
      </p>

      {posts.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="No posts yet">Check back soon.</EmptyState>
        </div>
      ) : (
        <div className="mt-10 space-y-8">
          {lead && (
            <div className="lg:max-w-3xl">
              <BlogCard post={lead} />
            </div>
          )}
          {rest.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
