import ayahs from "../src/ayahs.json";
import pickthall from "../src/pickthall.json";
import { formatAyahs } from "../src/formatAyahs";
import { QuranSearch } from "../src/QuranSearch";
import { DEFAULT_SETTINGS } from "../src/types";
import type { IndexedAyah } from "../src/types";
import {
  TRANSLATIONS,
  resolveTranslation,
  getTranslation,
} from "../src/translation";
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
  expect(
    ayahs.every((a) => getTranslation(a, "pickthall").trim().length > 0),
  ).toBe(true);
  expect(getTranslation({ surah_id: 114, ayah_id: 6 }, "pickthall")).toBe(
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
      expect(output.includes("Saheeh International")).toBe(
        outputLanguage !== "arabic",
      );
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
  expect(output).toContain("[Al-Fatihah 1:1–2]");
  expect(output.match(/https:\/\/tanzil.net\/#/g)).toHaveLength(1);
  expect(output.indexOf(getTranslation(verse))).toBeLessThan(
    output.indexOf(getTranslation(second)),
  );
  expect(output.match(/Saheeh International/g)).toHaveLength(1);
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
  const search = new QuranSearch([verse], "pickthall");
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

test("both editions cover the complete Quran and format with their own attribution", () => {
  for (const translation of ["sahih", "pickthall"] as const) {
    const edition = TRANSLATIONS[translation];
    expect(Object.keys(edition.verses).sort()).toEqual(
      ayahs.map((a) => `${a.surah_id}:${a.ayah_id}`).sort(),
    );
    expect(ayahs.every((a) => getTranslation(a, translation).trim())).toBe(
      true,
    );
    for (const outputFormat of ["callout", "blockquote", "inline"] as const) {
      const output = formatAyahs([verse], {
        ...DEFAULT_SETTINGS,
        translation,
        outputFormat,
        outputLanguage: "both",
      });
      expect(output).toContain(getTranslation(verse, translation));
      expect(output).toContain(`[${edition.name}](${edition.source})`);
    }
  }
});

test("switching translation selects the correct search index, including switching back", async () => {
  const sahih = await quranDataService.getSearchService("sahih");
  const pickthallSearch = await quranDataService.getSearchService("pickthall");
  const includesFirst = (search: QuranSearch, query: string) =>
    search.search(query).some((a) => a.surah_id === 1 && a.ayah_id === 1);
  expect(includesFirst(sahih, "Entirely")).toBe(true);
  expect(includesFirst(sahih, "Beneficent")).toBe(false);
  expect(includesFirst(pickthallSearch, "Beneficent")).toBe(true);
  expect(includesFirst(pickthallSearch, "Entirely")).toBe(false);
  expect(await quranDataService.getSearchService("sahih")).toBe(sahih);
});

test("missing or invalid saved editions default to Saheeh International", () => {
  for (const value of [undefined, null, "unknown", "__proto__", {}]) {
    expect(resolveTranslation(value)).toBe(DEFAULT_SETTINGS.translation);
  }
  expect(resolveTranslation("sahih")).toBe("sahih");
  expect(resolveTranslation("pickthall")).toBe("pickthall");
});

test("ranges support Arabic digits, validate endpoints and never truncate at the search limit", async () => {
  const search = await quranDataService.getSearchService();
  for (const query of ["2:255-257", "٢:٢٥٥-٢٥٧", " 2 : 255 – 257 "]) {
    expect(search.getRange(query)?.map((a) => a.ayah_id)).toEqual([
      255, 256, 257,
    ]);
  }
  expect(search.search("2:1-286")).toHaveLength(286);
  expect(search.getRange("1:7-7")?.map((a) => a.ayah_id)).toEqual([7]);
  for (const query of [
    "1:7-8",
    "2:257-255",
    "0:1-2",
    "115:1-2",
    "1:0-2",
    "2:1-999999",
    "2:255-",
    "2:255-3:2",
  ]) {
    expect(search.getRange(query)).toEqual([]);
    expect(search.search(query)).toEqual([]);
  }
  expect(search.getRange("mercy")).toBeNull();
  expect(search.getRange("2:255")).toBeNull();
  expect(new QuranSearch([verse]).getRange("1:1-3")).toEqual([]);
});

test("all output formats use one passage reference, including cross-surah pages", async () => {
  const records = await quranDataService.getAyahs();
  const passage = records.filter(
    (a) =>
      (a.surah_id === 1 && a.ayah_id === 7) ||
      (a.surah_id === 2 && a.ayah_id <= 2),
  );
  for (const outputFormat of ["callout", "blockquote", "inline"] as const) {
    const output = formatAyahs(passage, {
      ...DEFAULT_SETTINGS,
      outputFormat,
      outputLanguage: "both",
    });
    expect(output).toContain("1:7–2:2");
    expect(output.match(/https:\/\/tanzil.net\/#/g)).toHaveLength(1);
    expect(output.match(/Saheeh International/g)).toHaveLength(1);
    expect(output).not.toContain("English translation:");
  }
});
