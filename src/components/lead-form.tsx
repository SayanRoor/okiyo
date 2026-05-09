"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { submitLead } from "@/lib/leads";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md bg-(--accent) text-white text-sm font-medium px-5 py-3 hover:opacity-90 disabled:opacity-60 transition w-full sm:w-auto"
    >
      {pending ? "Отправляем…" : "Оставить заявку"}
    </button>
  );
}

export function LeadForm({
  productId,
  variant = "block",
}: {
  productId?: string | number | null;
  variant?: "block" | "inline";
}) {
  const [done, setDone] = useState<null | "ok" | string>(null);

  if (done === "ok") {
    return (
      <div className="rounded-lg border border-(--border) bg-(--card) p-6 text-center">
        <div className="text-lg font-medium text-(--primary)">
          Спасибо! Мы свяжемся с вами в ближайшее время.
        </div>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        const result = await submitLead({
          name: String(formData.get("name") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          message: String(formData.get("message") ?? ""),
          productId: productId ?? null,
          honeypot: String(formData.get("company") ?? ""),
        });
        setDone(result.ok ? "ok" : result.error);
      }}
      className={
        variant === "inline"
          ? "grid sm:grid-cols-[1fr_1fr_auto] gap-3"
          : "grid gap-3 max-w-lg"
      }
    >
      <input
        name="company"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />
      <input
        name="name"
        required
        placeholder="Ваше имя"
        className="rounded-md border border-(--border) bg-(--card) px-4 py-3 text-sm focus:outline-none focus:border-(--accent)"
      />
      <input
        name="phone"
        required
        type="tel"
        placeholder="+7 (___) ___-__-__"
        className="rounded-md border border-(--border) bg-(--card) px-4 py-3 text-sm focus:outline-none focus:border-(--accent)"
      />
      {variant === "block" ? (
        <textarea
          name="message"
          placeholder="Комментарий (необязательно)"
          rows={3}
          className="rounded-md border border-(--border) bg-(--card) px-4 py-3 text-sm focus:outline-none focus:border-(--accent)"
        />
      ) : null}
      <SubmitButton />
      {done && done !== "ok" ? (
        <div className="text-sm text-red-600 sm:col-span-3">{done}</div>
      ) : null}
    </form>
  );
}
