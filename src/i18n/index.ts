import { cookies } from "next/headers";
import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from "./config";
import { en, type Dictionary } from "./dictionaries/en";
import { hi } from "./dictionaries/hi";
import { gu } from "./dictionaries/gu";

const dictionaries: Record<Locale, Dictionary> = { en, hi, gu };

/** Read the active locale from the cookie (server-side). */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

/** Get the dictionary for the active locale. Untranslated keys fall back to English. */
export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()];
}

export type { Dictionary };
