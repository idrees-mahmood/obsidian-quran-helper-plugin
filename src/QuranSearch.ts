import type { IndexedAyah, TranslationId } from "./types";
import { getTranslation, normalizeEnglish } from "./translation";
import {
  convertArabicNumerals,
  isNumericQuery,
  isSurahAyahQuery,
  normalizeArabic,
  parseNumericString,
} from "./utils";

export class QuranSearch {
  private ayahs: IndexedAyah[];
  private uniqueWords: string[] = [];
  private wordToAyahs: Map<string, Set<number>> = new Map();

  constructor(
    ayahs: IndexedAyah[],
    private translation: TranslationId = "sahih",
  ) {
    this.ayahs = ayahs;
    this.buildIndex();
  }

  private buildIndex() {
    const wordSet = new Set<string>();

    this.ayahs.forEach((ayah, index) => {
      // Tokenize by splitting on whitespace
      const tokens =
        `${ayah.normalized_text} ${normalizeEnglish(getTranslation(ayah, this.translation))} ${normalizeEnglish(ayah.surah_name_en)}`
          .split(/\s+/)
          .filter((t) => t.length > 0);

      tokens.forEach((token) => {
        wordSet.add(token);

        if (!this.wordToAyahs.has(token)) {
          this.wordToAyahs.set(token, new Set());
        }
        this.wordToAyahs.get(token)?.add(index);
      });
    });

    this.uniqueWords = Array.from(wordSet);
  }

  /** null means ordinary search; [] means an invalid or unavailable range. */
  public getRange(query: string): IndexedAyah[] | null {
    const normalized = convertArabicNumerals(query).trim();
    if (!/^\d+\s*:.*[-–—]/.test(normalized)) return null;
    const match = /^(\d+)\s*:\s*(\d+)\s*[-–—]\s*(\d+)$/.exec(normalized);
    if (!match) return [];
    const surah = Number(match[1]);
    const start = Number(match[2]);
    const end = Number(match[3]);
    if (surah < 1 || surah > 114 || start < 1 || end < start || end > 286)
      return [];
    const verses = this.ayahs.filter(
      (a) => a.surah_id === surah && a.ayah_id >= start && a.ayah_id <= end,
    );
    return verses.length === end - start + 1 ? verses : [];
  }

  public search(query: string, limit = 50): IndexedAyah[] {
    const range = this.getRange(query);
    if (range !== null) return range;
    if (!query.trim()) {
      return this.ayahs.slice(0, limit);
    }

    const normalizedQuery = /[a-z]/i.test(query)
      ? normalizeEnglish(query)
      : normalizeArabic(query.trim());

    // Handle Surah:Ayah query (e.g. "2:255" or "٢:٢٥٥")
    const surahAyahMatch = isSurahAyahQuery(query);
    if (surahAyahMatch) {
      const surahStr = surahAyahMatch[1];
      const ayahStr = surahAyahMatch[2];
      if (surahStr && ayahStr) {
        const surahId = parseNumericString(surahStr);
        const ayahId = parseNumericString(ayahStr);
        const found = this.ayahs.find(
          (a) => a.surah_id === surahId && a.ayah_id === ayahId,
        );
        return found ? [found] : [];
      }
    }

    const isNumeric = isNumericQuery(query);

    // Handle numeric query (Ayah ID matching) - supports both Western and Arabic numerals
    if (isNumeric) {
      const results: IndexedAyah[] = [];
      const queryNum = parseNumericString(query.trim());
      for (const ayah of this.ayahs) {
        if (results.length >= limit) break;
        if (ayah.ayah_id === queryNum) {
          results.push(ayah);
        }
      }
      return results;
    }

    // Handle text query
    const queryTerms = normalizedQuery.split(/\s+/).filter((t) => t.length > 0);
    if (queryTerms.length === 0) return this.ayahs.slice(0, limit);

    let candidateIndices: Set<number> | null = null;

    for (const term of queryTerms) {
      const termMatches = new Set<number>();

      // Find all words in the vocabulary that contain this term (substring match on words)
      // This is faster than scanning full text because vocabulary size < total text size
      // and we only scan unique words.
      const matchingWords = this.uniqueWords.filter((w) => w.includes(term));

      for (const word of matchingWords) {
        const indices = this.wordToAyahs.get(word);
        if (indices) {
          for (const index of indices) {
            termMatches.add(index);
          }
        }
      }

      if (candidateIndices === null) {
        candidateIndices = termMatches;
      } else {
        // Intersection
        const intersection = new Set<number>();
        for (const index of termMatches) {
          if (candidateIndices.has(index)) {
            intersection.add(index);
          }
        }
        candidateIndices = intersection;
      }

      // Optimization: If intersection becomes empty, no need to continue
      if (candidateIndices.size === 0) {
        return [];
      }
    }

    if (!candidateIndices) return [];

    // Convert indices to Ayah objects and limit
    const results: IndexedAyah[] = [];
    // We iterate through allAyahs or sort indices?
    // Since we want them in order (Surah/Ayah order), iterating this.ayahs and checking set membership is safe
    // but optimized: we can just sort the indices.
    const sortedIndices = Array.from(candidateIndices).sort((a, b) => a - b);

    for (const index of sortedIndices) {
      const ayah = this.ayahs[index];
      if (ayah) {
        results.push(ayah);
      }
      if (results.length >= limit) break;
    }

    return results;
  }
}
