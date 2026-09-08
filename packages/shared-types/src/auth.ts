import { z } from "zod";
import { ObjectIdSchema } from "./common.js";

export const UserRoleSchema = z.enum(["customer", "admin"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

/** E.164-ish; we only serve India so 10 digits with optional +91. */
export const PhoneSchema = z
  .string()
  .regex(/^(\+91)?[6-9]\d{9}$/, "enter a valid 10-digit Indian mobile number");

export const EmailSchema = z.string().email().toLowerCase();

export const AddressSchema = z.object({
  label: z.string().max(40).default("Home"),
  line1: z.string().min(3).max(200),
  line2: z.string().max(200).default(""),
  city: z.string().min(2).max(80),
  pincode: z.string().regex(/^\d{6}$/),
  /** Customer hint; the real check is the geocoded distance (see `lat`/`lng`). */
  withinDeliveryRadius: z.boolean().default(false),
  /** Filled server-side by geocoding the address on order creation. Null when
   * geocoding failed or hasn't run — callers fall back to the city/pincode check. */
  lat: z.number().nullable().default(null),
  lng: z.number().nullable().default(null),
});
export type Address = z.infer<typeof AddressSchema>;

/** A point on the map. */
export const GeoPointSchema = z.object({ lat: z.number(), lng: z.number() });
export type GeoPoint = z.infer<typeof GeoPointSchema>;

export const UserSchema = z.object({
  id: ObjectIdSchema,
  name: z.string().min(1).max(120),
  email: EmailSchema.nullable(),
  phone: PhoneSchema.nullable(),
  role: UserRoleSchema,
  completedOrderCount: z.number().int().nonnegative(),
  premiumTierOverride: z.boolean(),
  addresses: z.array(AddressSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const SignupRequestSchema = z
  .object({
    name: z.string().min(1).max(120),
    email: EmailSchema.optional(),
    phone: PhoneSchema.optional(),
    password: z.string().min(8).max(200),
  })
  .refine((v) => v.email || v.phone, {
    message: "email or phone is required",
    path: ["email"],
  });
export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const LoginRequestSchema = z.object({
  /** email or phone */
  identifier: z.string().min(3),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: UserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
