import pickthall from "./pickthall.json";
import sahih from "./sahih.json";
import type { SearchableAyah, TranslationId } from "./types";

export const TRANSLATIONS = {
  sahih: {
    name: "Saheeh International",
    source: "https://tanzil.net/trans/en.sahih",
    verses: sahih,
  },
  pickthall: {
    name: "M. Pickthall",
    source: "https://tanzil.net/trans/en.pickthall",
    verses: pickthall,
  },
};

export function resolveTranslation(value: unknown): TranslationId {
  return value === "pickthall" ? "pickthall" : "sahih";
}

export function getTranslation(
  ayah: Pick<SearchableAyah, "surah_id" | "ayah_id">,
  translation: TranslationId = "sahih",
): string {
  return (
    (TRANSLATIONS[translation].verses as Record<string, string>)[
      `${ayah.surah_id}:${ayah.ayah_id}`
    ] ?? ""
  );
}

export function normalizeEnglish(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
