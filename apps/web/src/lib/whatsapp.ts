/** Build a wa.me deep link. `number` is digits-only with country code (e.g. 919000000000). */
export function waLink(number: string | null | undefined, text: string): string | null {
  if (!number) return null;
  const digits = number.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
