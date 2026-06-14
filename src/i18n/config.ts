export const locales = ["en", "hi", "gu"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Native names for the language switcher. */
export const localeNames: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  gu: "ગુજરાતી",
};

/** Cookie that stores the user's language preference. */
export const LOCALE_COOKIE = "cupsync_locale";

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
