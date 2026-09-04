import { z } from "zod";

/**
 * One address schema, used by the account address book and by checkout, on
 * both the client and the server. Two consumers, one definition — a validation
 * rule that exists twice is a validation rule that will disagree with itself.
 */

/** States and union territories, for the delivery dropdown. */
export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam",
  "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
] as const;

/**
 * The state the studio ships from. GST is CGST+SGST within the same state and
 * IGST across state lines — the split does not change the total, but it does
 * change the invoice, so the origin has to be recorded somewhere.
 */
export const ORIGIN_STATE = "Tamil Nadu";

export const addressSchema = z.object({
  name: z.string().trim().min(2, "Please give a name.").max(80),
  line1: z.string().trim().min(4, "Please give a street address.").max(120),
  line2: z.string().trim().max(120).optional().or(z.literal("")),
  landmark: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Please give a city.").max(60),
  state: z.enum(INDIAN_STATES, { message: "Please choose a state." }),
  // Stored and validated as text: Indian PIN codes have leading digits that
  // matter and none of them are arithmetic.
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, "A PIN code is six digits and cannot start with 0."),
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s-]/g, "").replace(/^(\+91|0)/, ""))
    .pipe(
      z
        .string()
        .regex(/^[6-9][0-9]{9}$/, "An Indian mobile number is ten digits starting 6–9."),
    ),
});

export type AddressInput = z.infer<typeof addressSchema>;

export function formatAddress(address: {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
}) {
  return [address.line1, address.line2, `${address.city}, ${address.state} ${address.pincode}`]
    .filter(Boolean)
    .join(", ");
}
