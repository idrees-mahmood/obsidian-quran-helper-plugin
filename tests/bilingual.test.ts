import ayahs from "../src/ayahs.json";
import pickthall from "../src/pickthall.json";
import { formatAyahs } from "../src/formatAyahs";
import { QuranSearch } from "../src/QuranSearch";
import { DEFAULT_SETTINGS } from "../src/types";
import type { IndexedAyah } from "../src/types";
import { getTranslation } from "../src/translation";
import { normalizeArabic } from "../src/utils";
import { quranDataService } from "../src/QuranDataService";

const verse: IndexedAyah = {
  surah_id: 1,
  ayah_id: 1,
  page: 1,
  surah_name: "الفاتحة",
  surah_name_en: "Al-Fatihah",
  text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  normalized_text: normalizeArabic("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"),
};

test("every Arabic verse has exactly one nonempty English translation", () => {
  expect(ayahs).toHaveLength(6236);
  expect(Object.keys(pickthall).sort()).toEqual(
    ayahs.map((a) => `${a.surah_id}:${a.ayah_id}`).sort(),
  );
  expect(ayahs.every((a) => getTranslation(a).trim().length > 0)).toBe(true);
  expect(getTranslation({ surah_id: 114, ayah_id: 6 })).toBe(
    "Of the jinn and of mankind.",
  );
});

test("the real data service searches English offline without changing Arabic", async () => {
  const records = await quranDataService.getAyahs();
  expect(records.map((a) => a.text)).toEqual(ayahs.map((a) => a.text));
  const search = await quranDataService.getSearchService();
  expect(
    search
      .search("Lord of the Worlds")
      .some((a) => a.surah_id === 1 && a.ayah_id === 2),
  ).toBe(true);
  expect(search.search("٢:٢٥٥")[0]?.ayah_id).toBe(255);
});

test.each(["callout", "blockquote", "inline"] as const)(
  "%s honors all language modes and attributes English",
  (outputFormat) => {
    for (const outputLanguage of ["arabic", "english", "both"] as const) {
      const output = formatAyahs([verse], {
        ...DEFAULT_SETTINGS,
        outputFormat,
        outputLanguage,
      });
      expect(output.includes(verse.text)).toBe(outputLanguage !== "english");
      expect(output.includes(getTranslation(verse))).toBe(
        outputLanguage !== "arabic",
      );
      expect(output.includes("M. Pickthall")).toBe(outputLanguage !== "arabic");
      expect(output).toContain("https://tanzil.net/#1:1");
      if (outputLanguage === "both") {
        expect(output).toContain('lang="ar" dir="rtl"');
        expect(output).toContain('lang="en" dir="ltr"');
      }
      expect(output.startsWith("> [!")).toBe(outputFormat === "callout");
      if (outputFormat === "inline") expect(output).not.toContain("\n>");
    }
  },
);

test("surah/page formatting preserves order, references and a single attribution", () => {
  const second = { ...verse, ayah_id: 2 };
  const output = formatAyahs(
    [verse, second],
    { ...DEFAULT_SETTINGS, outputLanguage: "both" },
    false,
    "Page 1",
  );
  expect(output).toContain("Page 1");
  expect(output.indexOf("#1:1")).toBeLessThan(output.indexOf("#1:2"));
  expect(output.match(/M\. Pickthall/g)).toHaveLength(1);
  expect(output).toContain(getTranslation(second));
});

test("inline override, empty results and unavailable translations are safe", () => {
  expect(formatAyahs([verse], DEFAULT_SETTINGS, true)).not.toContain("> [!");
  expect(formatAyahs([], DEFAULT_SETTINGS)).toBe("");
  expect(() =>
    formatAyahs([{ ...verse, ayah_id: 999 }], {
      ...DEFAULT_SETTINGS,
      outputLanguage: "english",
    }),
  ).toThrow("unavailable for 1:999");
  const output = formatAyahs(
    [{ ...verse, text: '<script>alert("x")</script>' }],
    { ...DEFAULT_SETTINGS, calloutType: "bad]\nInjected" },
  );
  expect(output).not.toContain("<script>");
  expect(output).toContain("&lt;script&gt;");
  expect(output).toContain("[!quran-ayah|quran-helper]");
});

test("English search is case/punctuation insensitive while Arabic and references still work", () => {
  const search = new QuranSearch([verse]);
  for (const query of [
    "BENEFICENT, MERCIFUL",
    "Al-Fatihah",
    "بسم",
    "1:1",
    "١:١",
  ]) {
    expect(search.search(query)).toEqual([verse]);
  }
  expect(search.search("nonexistent word")).toEqual([]);
  expect(search.search("999:999")).toEqual([]);
});
