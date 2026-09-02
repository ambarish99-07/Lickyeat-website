"use client";

import { useState } from "react";
import useSWR from "swr";
import type { BlogPost } from "@lickyeat/shared-types";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Badge, EmptyState } from "@/components/ui/misc";
import { toast } from "@/state/toastStore";

type Draft = {
  id?: string;
  title: string;
  excerpt: string;
  body: string;
  coverImageUrl: string;
  tags: string;
  status: "draft" | "published";
};

const BLANK: Draft = {
  title: "",
  excerpt: "",
  body: "",
  coverImageUrl: "",
  tags: "",
  status: "draft",
};

export default function AdminBlog() {
  const { data, mutate } = useSWR<{ posts: BlogPost[] }>("/blog/admin/all");
  const [draft, setDraft] = useState<Draft | null>(null);

  function edit(p: BlogPost) {
    setDraft({
      id: p.id,
      title: p.title,
      excerpt: p.excerpt,
      body: p.body,
      coverImageUrl: p.coverImageUrl ?? "",
      tags: p.tags.join(", "),
      status: p.status,
    });
  }

  async function save() {
    if (!draft) return;
    const payload = {
      title: draft.title,
      excerpt: draft.excerpt,
      body: draft.body,
      coverImageUrl: draft.coverImageUrl || null,
      tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
      status: draft.status,
    };
    try {
      if (draft.id) await api.patch(`/blog/${draft.id}`, payload);
      else await api.post("/blog", payload);
      setDraft(null);
      mutate();
      toast("Saved", { tone: "success" });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", { tone: "error" });
    }
  }

  async function remove(slug: string) {
    await api.del(`/blog/${slug}`);
    mutate();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">Blog</h1>
        {!draft && (
          <button className="btn-primary btn-sm" onClick={() => setDraft({ ...BLANK })}>
            New post
          </button>
        )}
      </div>

      {draft ? (
        <div className="card space-y-3 p-5">
          <h2 className="font-display font-bold">{draft.id ? `Edit “${draft.id}”` : "New post"}</h2>
          <label className="block">
            <span className="field-label">Title</span>
            <input className="field" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </label>
          <label className="block">
            <span className="field-label">Excerpt</span>
            <input className="field" value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} />
          </label>
          <label className="block">
            <span className="field-label">Cover image URL (e.g. /static/menu-images/choco-crush.jpg)</span>
            <input className="field" value={draft.coverImageUrl} onChange={(e) => setDraft({ ...draft, coverImageUrl: e.target.value })} />
          </label>
          <label className="block">
            <span className="field-label">Tags (comma separated)</span>
            <input className="field" value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} />
          </label>
          <label className="block">
            <span className="field-label">Body — `## heading`, `- list`, blank line = paragraph, **bold**</span>
            <textarea
              className="field min-h-[240px] font-mono text-xs"
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.status === "published"}
              onChange={(e) => setDraft({ ...draft, status: e.target.checked ? "published" : "draft" })}
            />
            Published
          </label>
          <div className="flex gap-2">
            <button className="btn-primary btn-sm" onClick={save} disabled={!draft.title}>
              Save
            </button>
            <button className="btn-ghost btn-sm" onClick={() => setDraft(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {data?.posts.length === 0 && <EmptyState title="No posts yet" />}
          {data?.posts.map((p) => (
            <div key={p.id} className="card flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-[200px]">
                <p className="font-semibold">{p.title}</p>
                <p className="text-xs text-muted">
                  /{p.id} · {p.publishedAt ? formatDate(p.publishedAt) : "—"}
                </p>
              </div>
              <Badge tone={p.status === "published" ? "good" : "neutral"}>{p.status}</Badge>
              <div className="ml-auto flex gap-2">
                <button className="btn-ghost btn-sm" onClick={() => edit(p)}>
                  Edit
                </button>
                <button
                  className="btn-ghost btn-sm !border-rose-300 !text-rose-700"
                  onClick={() => remove(p.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
