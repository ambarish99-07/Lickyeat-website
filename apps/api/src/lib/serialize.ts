/**
 * Recursively convert a Mongoose lean document into a plain JSON-safe DTO:
 * `_id` / ObjectId -> string `id`, `Date` -> ISO string, strip `__v`.
 */
export function serialize<T = unknown>(input: unknown): T {
  return walk(input) as T;
}

function walk(value: unknown): unknown {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(walk);
  if (value instanceof Date) return value.toISOString();

  // ObjectId (has toHexString) — Buffer also has it? no. Check duck-type.
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof (obj as { toHexString?: () => string }).toHexString === "function") {
      return (obj as { toHexString: () => string }).toHexString();
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === "__v") continue;
      if (k === "_id") {
        out.id = walk(v);
        continue;
      }
      if (k === "passwordHash") continue;
      out[k] = walk(v);
    }
    return out;
  }
  return value;
}
