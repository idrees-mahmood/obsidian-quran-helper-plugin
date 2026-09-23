import type { App, Editor } from "obsidian";
import { MarkdownView, Notice, SuggestModal } from "obsidian";
import type { IndexedAyah, PageEntry } from "./types";
import { normalizeArabic } from "./utils";
import type QuranHelper from "../main";
import { formatAyahs } from "./formatAyahs";
import { getTranslation, normalizeEnglish } from "./translation";

type PageAyahItem =
  | { kind: "all"; ayahs: IndexedAyah[] }
  | { kind: "single"; ayah: IndexedAyah };

export class FzfPageAyahModal extends SuggestModal<PageAyahItem> {
  private entry: PageEntry;
  private plugin: QuranHelper;
  private allItem: PageAyahItem;
  private singleItems: PageAyahItem[];

  constructor(app: App, plugin: QuranHelper, entry: PageEntry) {
    super(app);
    this.plugin = plugin;
    this.entry = entry;
    this.allItem = { kind: "all", ayahs: entry.ayahs };
    this.singleItems = entry.ayahs.map((ayah) => ({
      kind: "single" as const,
      ayah,
    }));
    this.setPlaceholder(
      `Page ${entry.page} / الصفحة — Search Arabic or English…`,
    );
  }

  getSuggestions(query: string): PageAyahItem[] {
    if (!query.trim()) {
      return [this.allItem, ...this.singleItems];
    }

    const normalizedQ = normalizeArabic(query.trim());
    const filtered = this.singleItems.filter((item) => {
      const { ayah } = item as { kind: "single"; ayah: IndexedAyah };
      return (
        ayah.normalized_text.includes(normalizedQ) ||
        (normalizeEnglish(query).length > 0 &&
          normalizeEnglish(getTranslation(ayah)).includes(
            normalizeEnglish(query),
          )) ||
        ayah.ayah_id.toString().includes(query.trim())
      );
    });

    return [this.allItem, ...filtered];
  }

  renderSuggestion(item: PageAyahItem, el: HTMLElement) {
    if (item.kind === "all") {
      const textEl = el.createDiv({
        text: `Insert full page ${this.entry.page} / إدراج الصفحة كاملة`,
      });
      textEl.setAttribute("dir", "rtl");
      el.createEl("small", { text: `${this.entry.ayahs.length} ayahs / آية` });
      return;
    }

    const { ayah } = item;
    const textEl = el.createDiv({
      text: ayah.text,
      cls: "quran-helper-arabic",
    });
    textEl.setAttribute("dir", "rtl");
    el.createDiv({
      text: getTranslation(ayah),
      cls: "quran-helper-english",
      attr: { lang: "en", dir: "ltr" },
    });
    el.createEl("small", {
      text: `${ayah.surah_name_en} / ${ayah.surah_name} — ${ayah.surah_id}:${ayah.ayah_id} · M. Pickthall`,
    });
  }

  onChooseSuggestion(item: PageAyahItem, _evt: MouseEvent | KeyboardEvent) {
    if (item.kind === "all") {
      this.insertAllAyahs(item.ayahs);
    } else {
      this.insertSingleAyah(item.ayah);
    }
  }

  private insertSingleAyah(ayah: IndexedAyah) {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const editor = view?.editor;
    if (!editor) {
      new Notice("Error: No active editor found. Please open a note first.");
      return;
    }

    const content = formatAyahs([ayah], this.plugin.settings);

    this.insertContent(editor, content);
  }

  private insertAllAyahs(ayahs: IndexedAyah[]) {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const editor = view?.editor;
    if (!editor) {
      new Notice("Error: No active editor found. Please open a note first.");
      return;
    }

    const content = formatAyahs(
      ayahs,
      this.plugin.settings,
      false,
      `Page ${this.entry.page} / الصفحة`,
    );

    this.insertContent(editor, content);
  }

  private insertContent(editor: Editor, content: string) {
    const cursor = editor.getCursor();
    editor.replaceRange(content, cursor);
    const lines = content.split("\n");
    const lastLine = lines[lines.length - 1] || "";
    editor.setCursor({
      line: cursor.line + lines.length - 1,
      ch: lastLine.length,
    });
  }
}
