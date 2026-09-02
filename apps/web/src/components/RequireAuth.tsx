"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/state/authStore";
import { EmptyState } from "@/components/ui/misc";

export function RequireAuth({
  children,
  admin,
}: {
  children: React.ReactNode;
  admin?: boolean;
}) {
  const { user, ready } = useAuth();
  const pathname = usePathname();

  if (!ready) {
    return <div className="container-page py-16"><div className="h-40 animate-pulse rounded-2xl bg-ink/5" /></div>;
  }
  if (!user) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="Log in to continue"
          action={
            <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn-primary btn-md">
              Log in
            </Link>
          }
        />
      </div>
    );
  }
  if (admin && user.role !== "admin") {
    return (
      <div className="container-page py-16">
        <EmptyState title="Admin access required">
          This area is for Lickyeat staff.
        </EmptyState>
      </div>
    );
  }
  return <>{children}</>;
}
