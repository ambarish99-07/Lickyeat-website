import type { CreateBrandRequest, UpdateBrandRequest } from "@lickyeat/shared-types";
import { BrandModel } from "../../db/models/Brand.model.js";
import { conflict, notFound } from "../../lib/errors.js";
import { serialize } from "../../lib/serialize.js";

export async function listBrands(opts: { status?: "live" | "coming-soon" } = {}) {
  const filter = opts.status ? { status: opts.status } : {};
  const brands = await BrandModel.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
  return brands.map((b) => serialize(b));
}

export async function getBrand(brandId: string) {
  const brand = await BrandModel.findOne({ brandId }).lean();
  if (!brand) throw notFound("Brand not found");
  return serialize(brand);
}

export async function createBrand(input: CreateBrandRequest) {
  const exists = await BrandModel.exists({ brandId: input.brandId });
  if (exists) throw conflict("A brand with that id already exists.");
  const brand = await BrandModel.create(input);
  return serialize(brand.toObject());
}

export async function updateBrand(brandId: string, input: UpdateBrandRequest) {
  const brand = await BrandModel.findOneAndUpdate({ brandId }, input, { new: true }).lean();
  if (!brand) throw notFound("Brand not found");
  return serialize(brand);
}
