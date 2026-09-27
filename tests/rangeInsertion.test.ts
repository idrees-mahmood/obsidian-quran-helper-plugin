import { FzfAyahModal } from "../src/FzfAyahModal";
import { quranDataService } from "../src/QuranDataService";
import { DEFAULT_SETTINGS } from "../src/types";
import { getTranslation } from "../src/translation";

jest.mock(
  "obsidian",
  () => ({
    SuggestModal: class {},
    MarkdownView: class {},
    Notice: jest.fn(),
  }),
  { virtual: true },
);

test("the picker inserts a range in one transaction and keeps single-ayah callbacks single", async () => {
  const transaction = jest.fn();
  const modal = Object.assign(
    Object.create(FzfAyahModal.prototype) as FzfAyahModal,
    {
      quranSearch: await quranDataService.getSearchService(),
      plugin: { settings: { ...DEFAULT_SETTINGS, outputLanguage: "both" } },
      app: {
        workspace: {
          getActiveViewOfType: () => ({
            editor: {
              getCursor: () => ({ line: 0, ch: 0 }),
              transaction,
            },
          }),
        },
      },
    },
  );
  const suggestions = modal.getSuggestions("2:255-257");
  expect(suggestions).toHaveLength(1);
  expect(suggestions[0]?.map((a) => a.ayah_id)).toEqual([255, 256, 257]);
  modal.onChooseSuggestion(suggestions[0]!, {
    ctrlKey: false,
    metaKey: false,
  } as KeyboardEvent);
  expect(transaction).toHaveBeenCalledTimes(1);
  const content = transaction.mock.calls[0]![0].changes[0].text as string;
  for (const ayah of suggestions[0]!) {
    expect(content).toContain(ayah.text);
    expect(content).toContain(
      getTranslation(ayah)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;"),
    );
  }
  expect(content).toContain("2:255–257");
  expect(modal.getSuggestions("2:257-255")).toEqual([]);
  const callback = jest.fn();
  Object.assign(modal, { onChoose: callback });
  expect(modal.getSuggestions("2:255-257")).toEqual([]);
  const single = modal.getSuggestions("2:255")[0]!;
  modal.onChooseSuggestion(single, {} as KeyboardEvent);
  expect(callback).toHaveBeenCalledWith(single[0]);
  expect(transaction).toHaveBeenCalledTimes(1);
});
