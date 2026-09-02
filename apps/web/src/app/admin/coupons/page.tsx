"use client";

import { useState } from "react";
import useSWR from "swr";
import type { Coupon } from "@lickyeat/shared-types";
import { api } from "@/lib/api";
import { couponSummary } from "@lickyeat/shared-types";

export default function AdminCoupons() {
  const { data, mutate } = useSWR<{ coupons: Coupon[] }>("/coupons");
  const [form, setForm] = useState({
    code: "",
    kind: "percent" as "percent" | "flat" | "bogo",
    value: 10,
    maxDiscount: 0,
    minOrderAmount: 0,
    brandId: "",
    oncePerCustomer: false,
  });

  async function create() {
    await api.post("/coupons", {
      code: form.code,
      kind: form.kind,
      value: Number(form.value),
      maxDiscount: form.kind === "percent" && form.maxDiscount ? Number(form.maxDiscount) : null,
      minOrderAmount: Number(form.minOrderAmount),
      brandId: form.brandId || null,
      oncePerCustomer: form.oncePerCustomer,
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
          onChange={(e) => setForm({ ...form, kind: e.target.value as "percent" | "flat" | "bogo" })}
        >
          <option value="percent">percent</option>
          <option value="flat">flat ₹</option>
          <option value="bogo">BOGO</option>
        </select>
        {form.kind !== "bogo" && (
          <input
            type="number"
            className="input !w-20"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
          />
        )}
        {form.kind === "percent" && (
          <input
            type="number"
            className="input !w-24"
            placeholder="cap ₹"
            value={form.maxDiscount}
            onChange={(e) => setForm({ ...form, maxDiscount: Number(e.target.value) })}
          />
        )}
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
        <label className="flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={form.oncePerCustomer}
            onChange={(e) => setForm({ ...form, oncePerCustomer: e.target.checked })}
          />
          once / customer
        </label>
        <button className="btn-primary !py-2" onClick={create}>
          Add
        </button>
      </div>

      <div className="space-y-2">
        {data?.coupons.map((c) => (
          <div key={c.id} className="card flex items-center gap-3 p-3 text-sm">
            <span className="font-mono font-semibold">{c.code}</span>
            <span className="text-charcoal">
              {couponSummary(c)}
              {c.brandId ? ` · ${c.brandId} only` : ""}
              {c.oncePerCustomer ? " · one per account" : ""}
            </span>
            <button
              className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
                c.isActive ? "bg-green-100 text-green-700" : "bg-ink/10 text-muted"
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
