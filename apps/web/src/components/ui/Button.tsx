import Link from "next/link";
import { forwardRef } from "react";

type Variant = "primary" | "dark" | "ghost" | "quiet";
type Size = "sm" | "md" | "lg";

const V: Record<Variant, string> = {
  primary: "btn-primary",
  dark: "btn-dark",
  ghost: "btn-ghost",
  quiet: "btn-quiet",
};
const S: Record<Size, string> = { sm: "btn-sm", md: "btn-md", lg: "btn-lg" };

function cn(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

export const Button = forwardRef<
  HTMLButtonElement,
  CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>
>(function Button({ variant = "primary", size = "md", className, children, ...rest }, ref) {
  return (
    <button ref={ref} className={cn(V[variant], S[size], className)} {...rest}>
      {children}
    </button>
  );
});

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...rest
}: CommonProps & { href: string } & Omit<
    React.ComponentProps<typeof Link>,
    "href" | "className"
  >) {
  return (
    <Link href={href} className={cn(V[variant], S[size], className)} {...rest}>
      {children}
    </Link>
  );
}
