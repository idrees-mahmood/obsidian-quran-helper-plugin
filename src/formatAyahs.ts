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
    return format === "inline" ? [parts.join(" — ")] : parts;
  });
  const first = ayahs[0]!;
  const last = ayahs[ayahs.length - 1]!;
  const startReference = `${first.surah_id}:${first.ayah_id}`;
  const reference =
    ayahs.length === 1
      ? startReference
      : `${startReference}–${last.surah_id === first.surah_id ? last.ayah_id : `${last.surah_id}:${last.ayah_id}`}`;
  const passage = `${first.surah_name_en || first.surah_name} ${reference}`;
  const source = `[${passage}](https://tanzil.net/#${startReference})`;
  paragraphs.push(
    language === "arabic"
      ? source
      : `${source} · [${edition.name}](${edition.source})`,
  );
  if (format === "inline") return paragraphs.join("\n\n");
  const heading = title || passage;
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
