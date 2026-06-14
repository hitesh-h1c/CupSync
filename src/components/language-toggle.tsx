"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { locales, localeNames, LOCALE_COOKIE, type Locale } from "@/i18n/config";

/**
 * Sets the locale cookie and refreshes so server components re-render with the
 * chosen language. Lightweight — no URL-based routing.
 */
export function LanguageToggle({ current }: { current: Locale }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Locale;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <label className="inline-flex items-center gap-1.5 text-sm text-text-muted">
      <Languages className="h-4 w-4" />
      <select
        value={current}
        onChange={onChange}
        aria-label="Language"
        className="cursor-pointer rounded-md border border-border bg-surface px-2 py-1 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeNames[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
