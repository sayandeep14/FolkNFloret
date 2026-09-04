"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/account";
import { addressSchema } from "@/lib/address";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean };

function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fields[key] ??= issue.message;
  }
  return fields;
}

export async function saveAddress(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const id = String(formData.get("id") ?? "");
  const makeDefault = formData.get("isDefault") === "on";
  const data = { ...parsed.data, line2: parsed.data.line2 || null, landmark: parsed.data.landmark || null };

  if (id) {
    // Scoped by userId, so an id from someone else's book matches nothing.
    const owned = await db.address.findFirst({ where: { id, userId: user.id } });
    if (!owned) return { error: "That address is no longer in your book." };
    await db.address.update({ where: { id }, data });
  } else {
    const count = await db.address.count({ where: { userId: user.id } });
    await db.address.create({
      data: { ...data, userId: user.id, isDefault: makeDefault || count === 0 },
    });
  }

  if (makeDefault) await setDefaultFor(user.id, id || undefined);
  revalidatePath("/account/addresses");
  return { ok: true };
}

/** Exactly one default. Done in a transaction so there is never zero or two. */
async function setDefaultFor(userId: string, addressId?: string) {
  const target =
    addressId ??
    (await db.address.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }))?.id;
  if (!target) return;

  await db.$transaction([
    db.address.updateMany({ where: { userId }, data: { isDefault: false } }),
    db.address.updateMany({ where: { id: target, userId }, data: { isDefault: true } }),
  ]);
}

export async function makeDefaultAddress(formData: FormData): Promise<void> {
  const user = await requireUser();
  await setDefaultFor(user.id, String(formData.get("id")));
  revalidatePath("/account/addresses");
}

export async function deleteAddress(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const address = await db.address.findFirst({ where: { id, userId: user.id } });
  if (!address) return;

  await db.address.delete({ where: { id } });
  // Deleting the default would leave the book with none; promote another.
  if (address.isDefault) await setDefaultFor(user.id);
  revalidatePath("/account/addresses");
}

const profileSchema = z.object({
  name: z.string().trim().max(80).optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|0)/, ""))
    .pipe(z.string().regex(/^[6-9][0-9]{9}$/, "Ten digits starting 6–9.").or(z.literal("")))
    .optional(),
});

export async function saveProfile(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || "",
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  await db.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name || null,
      phone: parsed.data.phone || null,
      marketingOptIn: formData.get("marketingOptIn") === "on",
    },
  });

  revalidatePath("/account/profile");
  return { ok: true };
}
