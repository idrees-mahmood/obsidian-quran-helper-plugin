import pickthall from "./pickthall.json";
import type { SearchableAyah } from "./types";

export const TRANSLATION_NAME = "M. Pickthall";
export const TRANSLATION_SOURCE = "https://tanzil.net/trans/en.pickthall";

export function getTranslation(
  ayah: Pick<SearchableAyah, "surah_id" | "ayah_id">,
): string {
  return (
    (pickthall as Record<string, string>)[`${ayah.surah_id}:${ayah.ayah_id}`] ??
    ""
  );
}

export function normalizeEnglish(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
