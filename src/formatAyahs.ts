import type { IndexedAyah, QuranHelperSettings } from "./types";
import { getTranslation, TRANSLATIONS } from "./translation";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Shared by ayah, surah, page and standalone-note insertion. */
export function formatAyahs(
  ayahs: IndexedAyah[],
  settings: QuranHelperSettings,
  inline = false,
  title?: string,
): string {
  if (ayahs.length === 0) return "";
  const format = inline ? "inline" : settings.outputFormat;
  const language = settings.outputLanguage;
  const edition = TRANSLATIONS[settings.translation];
  const paragraphs = ayahs.flatMap((ayah) => {
    const reference = `${ayah.surah_id}:${ayah.ayah_id}`;
    const parts: string[] = [];
    if (language !== "english") {
      parts.push(
        `<span class="quran-helper-arabic" lang="ar" dir="rtl">${escapeHtml(ayah.text)}</span>`,
      );
    }
    if (language !== "arabic") {
      const translation = getTranslation(ayah, settings.translation);
      if (!translation)
        throw new Error(`English translation unavailable for ${reference}`);
      parts.push(
        `<span class="quran-helper-english" lang="en" dir="ltr">${escapeHtml(translation)}</span>`,
      );
    }
    parts.push(
      `[${ayah.surah_name_en || ayah.surah_name} ${reference}](https://tanzil.net/#${reference})`,
    );
    return format === "inline" ? [parts.join(" — ")] : parts;
  });
  if (language !== "arabic") {
    paragraphs.push(
      `English translation: [${edition.name}](${edition.source}).`,
    );
  }
  if (format === "inline") return paragraphs.join("\n\n");
  const first = ayahs[0]!;
  const heading =
    title ||
    `${first.surah_name_en || first.surah_name} ${first.surah_id}:${first.ayah_id}`;
  const safeHeading = heading.replace(/[\r\n]/g, " ");
  const type = /^[a-zA-Z0-9-]+$/.test(settings.calloutType)
    ? settings.calloutType
    : "quran-ayah";
  const header =
    format === "callout" ? `> [!${type}|quran-helper] ${safeHeading}\n>\n` : "";
  return (
    header +
    paragraphs
      .map((p) =>
        p
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n"),
      )
      .join("\n>\n") +
    "\n\n"
  );
}
