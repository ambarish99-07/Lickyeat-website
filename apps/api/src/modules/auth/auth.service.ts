import bcrypt from "bcryptjs";
import type { LoginRequest, SignupRequest } from "@lickyeat/shared-types";
import { UserModel } from "../../db/models/User.model.js";
import { badRequest, conflict, unauthorized } from "../../lib/errors.js";
import { signToken } from "../../lib/jwt.js";
import { serialize } from "../../lib/serialize.js";

function isEmail(v: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
}

export async function signup(input: SignupRequest) {
  const email = input.email?.toLowerCase() ?? null;
  const phone = input.phone ? normalizePhone(input.phone) : null;

  const existing = await UserModel.findOne({
    $or: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
  }).lean();
  if (existing) throw conflict("An account with that email or phone already exists.");

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await UserModel.create({
    name: input.name,
    email,
    phone,
    passwordHash,
    role: "customer",
  });

  return {
    token: signToken({ sub: String(user._id), role: "customer" }),
    user: serialize(user.toObject()),
  };
}

export async function login(input: LoginRequest) {
  const id = input.identifier.trim();
  const query = isEmail(id)
    ? { email: id.toLowerCase() }
    : { phone: normalizePhone(id) };

  const user = await UserModel.findOne(query);
  if (!user) throw unauthorized("Invalid credentials");

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw unauthorized("Invalid credentials");

  return {
    token: signToken({ sub: String(user._id), role: user.role }),
    user: serialize(user.toObject()),
  };
}

export async function getMe(userId: string) {
  const user = await UserModel.findById(userId).lean();
  if (!user) throw unauthorized();
  return serialize(user);
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  if (local.length !== 10) throw badRequest("Enter a valid 10-digit mobile number.");
  return local;
}
