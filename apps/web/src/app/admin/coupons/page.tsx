"use client";

import { useState } from "react";
import useSWR from "swr";
import type { Coupon } from "@lickyeat/shared-types";
import { api } from "@/lib/api";
import { rupees } from "@/lib/format";

export default function AdminCoupons() {
  const { data, mutate } = useSWR<{ coupons: Coupon[] }>("/coupons");
  const [form, setForm] = useState({
    code: "",
    kind: "percent" as "percent" | "flat",
    value: 10,
    minOrderAmount: 0,
    brandId: "",
  });

  async function create() {
    await api.post("/coupons", {
      code: form.code,
      kind: form.kind,
      value: Number(form.value),
      minOrderAmount: Number(form.minOrderAmount),
      brandId: form.brandId || null,
    });
    setForm({ ...form, code: "" });
    mutate();
  }

  async function toggle(c: Coupon) {
    await api.patch(`/coupons/${c.id}`, { isActive: !c.isActive });
    mutate();
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Coupons</h1>

      <div className="card flex flex-wrap items-end gap-2 p-4">
        <input
          className="input !w-32"
          placeholder="CODE"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
        />
        <select
          className="input !w-28"
          value={form.kind}
          onChange={(e) => setForm({ ...form, kind: e.target.value as "percent" | "flat" })}
        >
          <option value="percent">percent</option>
          <option value="flat">flat ₹</option>
        </select>
        <input
          type="number"
          className="input !w-20"
          value={form.value}
          onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
        />
        <input
          type="number"
          className="input !w-28"
          placeholder="min ₹"
          value={form.minOrderAmount}
          onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
        />
        <input
          className="input !w-32"
          placeholder="brand (opt)"
          value={form.brandId}
          onChange={(e) => setForm({ ...form, brandId: e.target.value })}
        />
        <button className="btn-primary !py-2" onClick={create}>
          Add
        </button>
      </div>

      <div className="space-y-2">
        {data?.coupons.map((c) => (
          <div key={c.id} className="card flex items-center gap-3 p-3 text-sm">
            <span className="font-mono font-semibold">{c.code}</span>
            <span>
              {c.kind === "percent" ? `${c.value}%` : rupees(c.value)}
              {c.minOrderAmount ? ` · min ${rupees(c.minOrderAmount)}` : ""}
              {c.brandId ? ` · ${c.brandId}` : ""}
            </span>
            <button
              className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
                c.isActive ? "bg-green-100 text-green-700" : "bg-black/10 text-black/50"
              }`}
              onClick={() => toggle(c)}
            >
              {c.isActive ? "active" : "inactive"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
