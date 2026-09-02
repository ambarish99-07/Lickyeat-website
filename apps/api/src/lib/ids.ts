import { customAlphabet } from "nanoid";

const codeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const nanoCode = customAlphabet(codeAlphabet, 4);
const nanoToken = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 40);

/** Short human-facing order code, e.g. LKY-8F3A. */
export function orderCode(prefix = "LKY"): string {
  return `${prefix}-${nanoCode()}`;
}

/** Opaque capability token for guest order lookup/cancellation. */
export function accessToken(): string {
  return nanoToken();
}
