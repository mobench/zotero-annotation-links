import { registerAnnotationHeader } from "./modules/annotationHeader";
import { registerContextMenu } from "./modules/contextMenu";
import { buildAnnotationUrl } from "./modules/urlBuilder";
import { initLocale } from "./utils/locale";
import { createZToolkit } from "./utils/ztoolkit";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  initLocale();

  registerContextMenu();
  registerAnnotationHeader();
  patchReaderOpenForAnnotationFocus();

  // Ctrl+Shift+C: copy annotation link for selected annotation
  ztoolkit.Keyboard.register((ev) => {
    if (ev.type !== "keydown") return;
    if (ev.ctrlKey && ev.shiftKey && ev.key === "C") {
      const reader = Zotero.Reader._readers.find(
        (r: any) => r._internalReader?._state?.selectedAnnotationIDs?.length,
      ) as any;
      if (!reader) return;

      const annotationKey =
        reader._internalReader._state.selectedAnnotationIDs[0];
      if (!annotationKey) return;

      const url = buildAnnotationUrl(reader._item, annotationKey);
      new ztoolkit.Clipboard().addText(url, "text/unicode").copy();
      new ztoolkit.ProgressWindow(addon.data.config.addonName)
        .createLine({ text: "Link copied", type: "success" })
        .show(2000);

      ev.preventDefault();
      ev.stopPropagation();
    }
  });

  await Promise.all(
    Zotero.getMainWindows().map((win) => onMainWindowLoad(win)),
  );
}

// Store original for cleanup
let originalReaderOpen: typeof Zotero.Reader.open | null = null;

function patchReaderOpenForAnnotationFocus() {
  originalReaderOpen = Zotero.Reader.open.bind(Zotero.Reader);

  Zotero.Reader.open = async (
    itemID: number,
    location?: _ZoteroTypes.Reader.Location,
    options?: _ZoteroTypes.Reader.OpenOptions,
  ) => {
    const reader = await originalReaderOpen!(itemID, location, options);

    // After open, focus the target annotation if one was specified
    if (location?.annotationKey) {
      const annotationID = location.annotationKey;
      setTimeout(() => {
        const targetReader = Zotero.Reader._readers.find(
          (r: any) => r._item?.id === itemID,
        );
        if (targetReader) {
          void targetReader.navigate({ annotationID } as any);
        }
      }, 500);
    }

    return reader;
  };

  addon.data.initialized = true;
}

async function onMainWindowLoad(win: _ZoteroTypes.MainWindow): Promise<void> {
  addon.data.ztoolkit = createZToolkit();

  // Register locale FTL files for this window
  win.MozXULElement.insertFTLIfNeeded(
    `${addon.data.config.addonRef}-addon.ftl`,
  );

  // Load stylesheet
  const styles = ztoolkit.UI.createElement(win.document, "link", {
    properties: {
      type: "text/css",
      rel: "stylesheet",
      href: `chrome://${addon.data.config.addonRef}/content/zoteroPane.css`,
    },
  });
  win.document.documentElement?.appendChild(styles);
}

async function onMainWindowUnload(_win: Window): Promise<void> {
  ztoolkit.unregisterAll();
}

function onShutdown(): void {
  ztoolkit.unregisterAll();
  // Restore original Reader.open
  if (originalReaderOpen) {
    Zotero.Reader.open = originalReaderOpen;
    originalReaderOpen = null;
  }
  addon.data.alive = false;
  // @ts-expect-error - Plugin instance is not typed
  delete Zotero[addon.data.config.addonInstance];
}

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
};
