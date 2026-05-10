"use client";

import { useEffect, useState } from "react";

type Mode = "day" | "night";

export function ThemeToggle({ initial = "day" }: { initial?: Mode }) {
  const [mode, setMode] = useState<Mode>(initial);

  // На клиенте — синхронизируем стейт с тем, что уже стоит на <html>
  // (его выставил inline-script в layout до гидратации).
  useEffect(() => {
    const t = document.documentElement.getAttribute("data-theme");
    if (t === "night" || t === "day") setMode(t);
  }, []);

  function apply(next: Mode) {
    setMode(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("okiyo-theme", next);
    } catch {
      /* ignore */
    }
    // Cookie на 365 дней — чтобы SSR следующего запроса знал тему.
    document.cookie = `okiyo-theme=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }

  function toggle() {
    apply(mode === "night" ? "day" : "night");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mode === "night" ? "Включить дневную тему" : "Включить ночную тему"}
      className="theme-toggle"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        border: "1px solid var(--line)",
        borderRadius: 999,
        padding: 3,
        cursor: "pointer",
        background: "transparent",
        color: "var(--ink)",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 26,
          height: 26,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          color: mode === "day" ? "var(--bg)" : "var(--muted)",
          background: mode === "day" ? "var(--ink)" : "transparent",
          transition: "all .25s ease",
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </span>
      <span
        aria-hidden
        style={{
          width: 26,
          height: 26,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          color: mode === "night" ? "var(--bg)" : "var(--muted)",
          background: mode === "night" ? "var(--ink)" : "transparent",
          transition: "all .25s ease",
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      </span>
    </button>
  );
}
