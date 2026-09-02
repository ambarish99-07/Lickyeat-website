"use client";

import useSWR from "swr";
import { rupees } from "@/lib/format";
import { Skeleton } from "@/components/ui/misc";

interface Dashboard {
  totalOrders: number;
  totalRevenue: number;
  customers: number;
  activeSubscriptions: number;
  activeOrders: number;
  byBrand: Array<{ _id: string; orders: number; revenue: number }>;
}

export default function AdminDashboard() {
  const { data } = useSWR<{ dashboard: Dashboard }>("/admin/dashboard");
  const d = data?.dashboard;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold">Dashboard</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Orders" value={d?.totalOrders} />
        <Stat label="Revenue" value={d ? rupees(d.totalRevenue) : undefined} />
        <Stat label="Customers" value={d?.customers} />
        <Stat label="Orders in flight" value={d?.activeOrders} />
        <Stat label="Active subscriptions" value={d?.activeSubscriptions} />
      </div>

      <div className="card p-5">
        <h2 className="mb-3 font-display font-bold">By brand</h2>
        {!d ? (
          <Skeleton className="h-24" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="py-1.5 font-semibold">Brand</th>
                <th className="font-semibold">Orders</th>
                <th className="font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {d.byBrand.map((b) => (
                <tr key={b._id} className="border-t border-line">
                  <td className="py-2 font-medium">{b._id}</td>
                  <td>{b.orders}</td>
                  <td className="tabular-nums">{rupees(b.revenue)}</td>
                </tr>
              ))}
              {d.byBrand.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-3 text-muted">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="card p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold">
        {value ?? <span className="text-muted">—</span>}
      </p>
    </div>
  );
}
