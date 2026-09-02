import { Fragment } from "react";

/** Minimal renderer for the blog body: `## heading`, `- list`, blank-line
 *  paragraphs, `**bold**`. No HTML in the source, so nothing to sanitise. */
export function BlogContent({ body }: { body: string }) {
  const blocks = body.trim().split(/\n{2,}/);

  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-charcoal">
      {blocks.map((block, i) => {
        const lines = block.split("\n");

        if (lines.every((l) => l.trim().startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*-\s+/, ""))}</li>
              ))}
            </ul>
          );
        }

        if (block.startsWith("## ")) {
          return (
            <h2 key={i} className="pt-2 font-display text-xl font-extrabold text-ink">
              {block.slice(3)}
            </h2>
          );
        }

        return <p key={i}>{inline(block)}</p>;
      })}
    </div>
  );
}

function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
