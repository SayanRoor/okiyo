"use server";

import { headers } from "next/headers";

import { payload } from "@/lib/payload";

type LeadInput = {
  name: string;
  phone: string;
  message?: string;
  productId?: string | number | null;
  source?: string;
  honeypot?: string;
};

export type LeadResult = { ok: true } | { ok: false; error: string };

export async function submitLead(input: LeadInput): Promise<LeadResult> {
  if (input.honeypot && input.honeypot.length > 0) {
    return { ok: true };
  }

  const name = String(input.name ?? "").trim();
  const phone = String(input.phone ?? "").trim();
  const message = String(input.message ?? "").trim();

  if (name.length < 2) return { ok: false, error: "Укажите имя" };
  if (phone.replace(/\D/g, "").length < 7) {
    return { ok: false, error: "Укажите телефон" };
  }
  if (message.length > 2000) {
    return { ok: false, error: "Слишком длинное сообщение" };
  }

  const h = await headers();
  const referer = h.get("referer") || input.source || "";

  try {
    const p = await payload();
    const productId =
      input.productId == null
        ? undefined
        : typeof input.productId === "number"
          ? input.productId
          : Number(input.productId);
    await p.create({
      collection: "leads",
      data: {
        name,
        phone,
        message: message || undefined,
        product:
          productId !== undefined && Number.isFinite(productId)
            ? productId
            : undefined,
        source: referer || undefined,
        status: "new",
      },
    });
    return { ok: true };
  } catch (e) {
    console.error("submitLead failed", e);
    return { ok: false, error: "Не удалось отправить. Попробуйте позже." };
  }
}
