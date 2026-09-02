import type { CSSProperties } from "react";
import { brandThemeVars } from "@/lib/color";

/**
 * Sets --brand / --brand-accent / --brand-ink from the brand's own record so
 * every `bg-brand`, `text-brand`, `ring-brand` inside adopts that brand's
 * identity. Brand colours are never hardcoded in component code.
 */
export function BrandTheme({
  brand,
  as: Tag = "div",
  className,
  style,
  children,
}: {
  brand: { primaryColor: string; accentColor: string };
  as?: "div" | "section" | "main" | "article";
  className?: string;
  style?: CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <Tag
      className={className}
      style={{ ...(brandThemeVars(brand) as CSSProperties), ...style }}
    >
      {children}
    </Tag>
  );
}
