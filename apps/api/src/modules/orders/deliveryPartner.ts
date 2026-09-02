import type { DeliveryPartner } from "@lickyeat/shared-types";

/**
 * Fixed demo pool — there is no real rider/dispatch system (§5). Assignment is
 * deterministic by order id so re-reads are stable. Regular orders and tiffin
 * orders draw from SEPARATE pools on purpose.
 */
const REGULAR_POOL: DeliveryPartner[] = [
  { name: "Ravi Kumar", phone: "+919000000101", vehicle: "Honda Activa · BR01 AB 1234" },
  { name: "Sunil Yadav", phone: "+919000000102", vehicle: "Bajaj Pulsar · BR01 CD 5678" },
  { name: "Amit Raj", phone: "+919000000103", vehicle: "TVS Jupiter · BR01 EF 9012" },
  { name: "Deepak Singh", phone: "+919000000104", vehicle: "Hero Splendor · BR01 GH 3456" },
];

const TIFFIN_POOL: DeliveryPartner[] = [
  { name: "Manoj Prasad", phone: "+919000000201", vehicle: "Cycle · Tiffin route A" },
  { name: "Vikash Kumar", phone: "+919000000202", vehicle: "Honda Activa · BR01 TF 1010" },
  { name: "Rohit Anand", phone: "+919000000203", vehicle: "TVS XL · BR01 TF 2020" },
];

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function pickDeliveryPartner(orderId: string, pool: "regular" | "tiffin" = "regular"): DeliveryPartner {
  const list = pool === "tiffin" ? TIFFIN_POOL : REGULAR_POOL;
  return list[hash(orderId) % list.length]!;
}
