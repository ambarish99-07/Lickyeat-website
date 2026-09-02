import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { serverGetOrNull } from "@/lib/serverApi";
import type { BlogPostResponse } from "@/lib/apiTypes";
import { assetUrl, formatDate } from "@/lib/format";
import { BlogContent } from "@/components/blog/BlogContent";

export const revalidate = 120;

async function load(slug: string) {
  return serverGetOrNull<BlogPostResponse>(`/blog/${slug}`, { revalidate: 120 });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: "Post not found" };
  return { title: data.post.title, description: data.post.excerpt };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  const { post } = data;
  const cover = assetUrl(post.coverImageUrl);

  return (
    <article className="container-narrow py-10">
      <Link href="/blog" className="text-sm font-semibold text-muted hover:text-ink">
        ← All posts
      </Link>

      <header className="mt-4">
        {post.tags[0] && <p className="eyebrow">{post.tags[0]}</p>}
        <h1 className="mt-1.5 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-3 text-sm text-muted">
          {post.author} · {post.publishedAt ? formatDate(post.publishedAt) : "Draft"} ·{" "}
          {post.readMinutes} min read
        </p>
      </header>

      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className="mt-6 h-64 w-full rounded-2xl object-cover sm:h-80" />
      )}

      <div className="mt-8">
        {post.excerpt && (
          <p className="mb-6 border-l-2 border-brand pl-4 text-lg font-medium text-ink">
            {post.excerpt}
          </p>
        )}
        <BlogContent body={post.body} />
      </div>

      <div className="mt-12 rounded-2xl bg-sand/60 p-6 text-center">
        <p className="font-display text-lg font-extrabold">Hungry now?</p>
        <Link href="/#brands" className="btn-primary btn-md mt-3">
          Browse the kitchens
        </Link>
      </div>
    </article>
  );
}
