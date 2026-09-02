"use client";

import useSWR from "swr";
import { rupees } from "@/lib/format";

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
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Orders" value={d?.totalOrders ?? "—"} />
        <Stat label="Revenue" value={d ? rupees(d.totalRevenue) : "—"} />
        <Stat label="Customers" value={d?.customers ?? "—"} />
        <Stat label="Active orders" value={d?.activeOrders ?? "—"} />
        <Stat label="Active subscriptions" value={d?.activeSubscriptions ?? "—"} />
      </div>

      <div className="card p-5">
        <h2 className="mb-3 font-bold">By brand</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-black/40">
              <th className="py-1">Brand</th>
              <th>Orders</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {(d?.byBrand ?? []).map((b) => (
              <tr key={b._id} className="border-t border-black/5">
                <td className="py-1.5">{b._id}</td>
                <td>{b.orders}</td>
                <td>{rupees(b.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wide text-black/40">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
