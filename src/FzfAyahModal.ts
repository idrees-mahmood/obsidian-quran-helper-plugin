import type { App } from "obsidian";
import { MarkdownView, Notice, SuggestModal } from "obsidian";
import { quranDataService } from "./QuranDataService";
import { QuranSearch } from "./QuranSearch";
import type { IndexedAyah } from "./types";
import { INITIAL_AYAHS } from "./initialAyahs";
import type QuranHelper from "../main";
import { formatAyahs } from "./formatAyahs";
import { TRANSLATIONS, getTranslation } from "./translation";

export class FzfAyahModal extends SuggestModal<IndexedAyah[]> {
  private quranSearch: QuranSearch | null = null;
  private plugin: QuranHelper;
  private onChoose: ((ayah: IndexedAyah) => void) | null = null;

  constructor(
    app: App,
    plugin: QuranHelper,
    onChoose?: (ayah: IndexedAyah) => void,
  ) {
    super(app);
    this.setPlaceholder(
      onChoose
        ? "Search Arabic, English or a reference such as 2:255"
        : "Search Arabic, English, 2:255 or a range such as 2:255-257",
    );
    this.setInstructions([
      { command: "↵", purpose: "insert" },
      { command: "Mod ↵", purpose: "insert inline" },
    ]);
    this.plugin = plugin;
    this.onChoose = onChoose || null;
    this.quranSearch = new QuranSearch(
      INITIAL_AYAHS,
      this.plugin.settings.translation,
    );

    this.scope.register(["Mod"], "Enter", (evt) => {
      this.selectActiveSuggestion(evt);
      return false;
    });
  }

  async onOpen() {
    void super.onOpen();
    try {
      this.quranSearch = await quranDataService.getSearchService(
        this.plugin.settings.translation,
      );
      // Trigger search update to show full results if input is not empty
      this.inputEl.dispatchEvent(new Event("input"));
    } catch (error) {
      console.error("Failed to load ayahs:", error);
      new Notice("Using offline data. Some ayahs may be unavailable.");
    }
  }

  getSuggestions(query: string): IndexedAyah[][] {
    if (!this.quranSearch) return [];
    const range = this.quranSearch.getRange(query);
    if (range !== null) {
      return !this.onChoose && range.length ? [range] : [];
    }
    return this.quranSearch.search(query).map((ayah) => [ayah]);
  }

  renderSuggestion(ayahs: IndexedAyah[], el: HTMLElement) {
    const ayah = ayahs[0];
    if (!ayah) return;
    if (ayahs.length > 1) {
      const last = ayahs[ayahs.length - 1]!;
      el.createDiv({
        text: `Insert ${ayahs.length} ayahs — ${ayah.surah_name_en} ${ayah.surah_id}:${ayah.ayah_id}-${last.ayah_id}`,
      });
    }
    const textEl = el.createDiv({ text: ayah.text });
    textEl.setAttribute("dir", "rtl");
    textEl.addClass("quran-helper-arabic");
    el.createDiv({
      text: getTranslation(ayah, this.plugin.settings.translation),
      cls: "quran-helper-english",
      attr: { lang: "en", dir: "ltr" },
    });
    el.createEl("small", {
      text: `${ayah.surah_name_en} / ${ayah.surah_name} — ${ayah.surah_id}:${ayah.ayah_id} · ${TRANSLATIONS[this.plugin.settings.translation].name}`,
    });
  }

  onChooseSuggestion(ayahs: IndexedAyah[], evt: MouseEvent | KeyboardEvent) {
    const ayah = ayahs[0];
    if (!ayah) return;
    if (this.onChoose) {
      this.onChoose(ayah);
      return;
    }

    // Validate ayah object has required properties
    if (
      !ayah ||
      !ayah.text ||
      !ayah.surah_name ||
      typeof ayah.ayah_id !== "number"
    ) {
      console.error("Invalid ayah data:", ayah);
      new Notice("Error: Invalid ayah data. Please try again.");
      return;
    }

    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const editor = view?.editor;
    if (!editor) {
      new Notice("Error: No active editor found. Please open a note first.");
      return;
    }

    try {
      const content = formatAyahs(
        ayahs,
        this.plugin.settings,
        evt.ctrlKey || evt.metaKey,
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
      console.error("Failed to insert ayah:", error);
      new Notice("Error: Failed to insert ayah. Please try again.");
    }
  }
}
