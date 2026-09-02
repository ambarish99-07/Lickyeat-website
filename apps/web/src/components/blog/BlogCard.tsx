import Link from "next/link";
import type { BlogPost } from "@lickyeat/shared-types";
import { assetUrl, formatDate } from "@/lib/format";
import { cn } from "@/components/ui/misc";

export function BlogCard({ post, compact }: { post: BlogPost; compact?: boolean }) {
  const img = assetUrl(post.coverImageUrl);
  return (
    <Link
      href={`/blog/${post.id}`}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt=""
          className={cn("w-full object-cover", compact ? "h-36" : "h-44")}
        />
      )}
      <div className="flex flex-1 flex-col p-5">
        {post.tags[0] && <p className="eyebrow mb-1.5">{post.tags[0]}</p>}
        <h3 className="font-display text-lg font-extrabold leading-snug text-ink group-hover:text-brand">
          {post.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted">{post.excerpt}</p>
        <p className="mt-3 text-xs text-muted">
          {post.publishedAt ? formatDate(post.publishedAt) : "Draft"} · {post.readMinutes} min read
        </p>
      </div>
    </Link>
  );
}
