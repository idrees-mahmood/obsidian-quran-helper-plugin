import { MarkdownView, Notice, SuggestModal } from "obsidian";
import type { App } from "obsidian";
import { quranDataService } from "./QuranDataService";
import { surahDataService } from "./SurahDataService";
import { SurahSearch } from "./SurahSearch";
import type { IndexedSurah } from "./types";
import type QuranHelper from "../main";
import { formatAyahs } from "./formatAyahs";

export class FzfSurahModal extends SuggestModal<IndexedSurah> {
  private surahSearch: SurahSearch | null = null;
  private plugin: QuranHelper;

  constructor(app: App, plugin: QuranHelper) {
    super(app);
    this.plugin = plugin;
    this.setInstructions([
      { command: "↵", purpose: "insert" },
      { command: "Mod ↵", purpose: "insert inline" },
    ]);
    // Initialize with a temporary search instance using empty array
    // so we can use it immediately while full data loads
    this.surahSearch = new SurahSearch([]);

    this.scope.register(["Mod"], "Enter", (evt) => {
      this.selectActiveSuggestion(evt);
      return false;
    });
  }

  async onOpen() {
    void super.onOpen();
    try {
      const surahs = await surahDataService.getSurahs();
      this.surahSearch = new SurahSearch(surahs);
      // Trigger search update to show full results if input is not empty
      this.inputEl.dispatchEvent(new Event("input"));
    } catch (error) {
      console.error("Failed to load surahs:", error);
      new Notice("Using offline data. Some surahs may be unavailable.");
    }
  }

  getSuggestions(query: string): IndexedSurah[] {
    if (!this.surahSearch) return [];
    return this.surahSearch.search(query);
  }

  renderSuggestion(surah: IndexedSurah, el: HTMLElement) {
    const textEl = el.createDiv({ text: surah.name });
    textEl.setAttribute("dir", "rtl");
    el.createEl("small", {
      text: `${surah.transliteration} - ${surah.type} - ${surah.total_verses} verses`,
    });
  }

  onChooseSuggestion(surah: IndexedSurah, evt: MouseEvent | KeyboardEvent) {
    void (async () => {
      // Validate surah object has required properties
      if (
        !surah ||
        !surah.name ||
        !surah.transliteration ||
        typeof surah.id !== "number" ||
        typeof surah.total_verses !== "number"
      ) {
        console.error("Invalid surah data:", surah);
        new Notice("Error: Invalid surah data. Please try again.");
        return;
      }

      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      const editor = view?.editor;
      if (!editor) {
        new Notice("Error: No active editor found. Please open a note first.");
        return;
      }

      try {
        // Load verses for this surah from ayahs data
        const allAyahs = await quranDataService.getAyahs();
        const surahAyahs = allAyahs.filter((a) => a.surah_id === surah.id);

        if (surahAyahs.length === 0) {
          throw new Error(`Could not find verses for surah ${surah.id}`);
        }

        const content = formatAyahs(
          surahAyahs,
          this.plugin.settings,
          evt.ctrlKey || evt.metaKey,
          `${surah.transliteration} / ${surah.name}`,
        );

        const cursor = editor.getCursor();
        const lines = content.split("\n");
        const lastLine = lines[lines.length - 1] || "";
        const isSingleLine = lines.length === 1;
        editor.transaction({
          changes: [{ from: cursor, to: cursor, text: content }],
          selection: {
            from: {
              line: cursor.line + lines.length - 1,
              ch: isSingleLine ? cursor.ch + content.length : lastLine.length,
            },
          },
        });
      } catch (error) {
        console.error("Failed to insert surah:", error);
        new Notice("Error: Failed to insert surah. Please try again.");
      }
    })();
  }
}
