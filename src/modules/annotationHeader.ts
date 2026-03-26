import { config } from "../../package.json";
import { extractZoteroLinks, ZoteroLink } from "./linkDetector";
import { navigateToAnnotation } from "./linkNavigation";

const EXTERNAL_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-inline-start:2px;vertical-align:middle;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

function getLinkLabel(
  link: ZoteroLink,
  currentAttachmentKey: string,
): { text: string; isCrossDoc: boolean; docTitle?: string } {
  const page = link.page || "?";
  const isCrossDoc = link.itemKey !== currentAttachmentKey;

  if (!isCrossDoc) {
    return { text: `Page ${page}`, isCrossDoc: false };
  }

  let docTitle: string | undefined;
  try {
    const libraryID = link.groupID
      ? (Zotero.Groups as any).getByGroupID(parseInt(link.groupID))?.libraryID
      : Zotero.Libraries.userLibraryID;

    if (libraryID != null) {
      const attachment = Zotero.Items.getByLibraryAndKey(
        libraryID,
        link.itemKey,
      );
      if (attachment) {
        if (attachment.parentItem) {
          docTitle = attachment.parentItem.getDisplayTitle();
        } else if (attachment.parentItemKey) {
          const parent = Zotero.Items.getByLibraryAndKey(
            libraryID,
            attachment.parentItemKey as string,
          );
          if (parent) {
            docTitle = parent.getDisplayTitle();
          }
        } else {
          docTitle =
            attachment.getField("title") || attachment.getDisplayTitle();
        }
      }
    }
  } catch (e) {
    Zotero.debug(`[AnnotationLinks] Failed to resolve title: ${e}`);
  }

  return {
    text: `Page ${page}`,
    isCrossDoc: true,
    docTitle: docTitle || link.itemKey,
  };
}

export function registerAnnotationHeader() {
  Zotero.Reader.registerEventListener(
    "renderSidebarAnnotationHeader",
    (event) => {
      const { reader, doc, params, append } = event;
      const comment = params.annotation.comment || "";

      const links = extractZoteroLinks(comment);
      if (links.length === 0) return;

      const currentAttachmentKey = reader._item.key;

      const icon = doc.createElement("span");
      icon.style.cssText =
        "display:inline-flex;align-items:center;cursor:pointer;padding:2px;margin-inline-start:4px;";

      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;

      if (links.length === 1) {
        const info = getLinkLabel(links[0], currentAttachmentKey);
        icon.title = info.isCrossDoc
          ? `${info.docTitle} — Page ${links[0].page || "?"}`
          : `Linked annotation (page ${links[0].page || "?"})`;
        if (info.isCrossDoc) {
          icon.innerHTML += EXTERNAL_ICON_SVG;
        }
        icon.addEventListener("click", (e) => {
          e.stopPropagation();
          void navigateToAnnotation(links[0]);
        });
      } else {
        icon.title = `${links.length} linked annotations`;
        icon.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleDropdown(icon, links, doc, currentAttachmentKey);
        });
      }

      append(icon);
    },
    config.addonID,
  );
}

function toggleDropdown(
  anchor: HTMLElement,
  links: ZoteroLink[],
  doc: Document,
  currentAttachmentKey: string,
) {
  // Toggle — remove if already open
  const existing = anchor.querySelector(".annotation-links-dropdown");
  if (existing) {
    existing.remove();
    return;
  }

  const dropdown = doc.createElement("div");
  dropdown.className = "annotation-links-dropdown";
  dropdown.style.cssText =
    "position:absolute;top:100%;inset-inline-end:0;background:var(--color-background);border:1px solid var(--color-border);border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.15);z-index:100;min-width:120px;padding:4px 0;";

  for (const link of links) {
    const info = getLinkLabel(link, currentAttachmentKey);
    const item = doc.createElement("div");
    item.style.cssText =
      "padding:4px 12px;cursor:pointer;white-space:nowrap;font-size:12px;display:flex;align-items:center;";
    item.textContent = info.text;
    if (info.isCrossDoc) {
      item.innerHTML += EXTERNAL_ICON_SVG;
      item.title = info.docTitle || "";
    }
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.remove();
      void navigateToAnnotation(link);
    });
    dropdown.appendChild(item);
  }

  anchor.style.position = "relative";
  anchor.appendChild(dropdown);

  // Close on click outside (works for annotation clicks, not PDF area)
  setTimeout(() => {
    const closeHandler = (e: Event) => {
      if (!anchor.contains(e.target as Node)) {
        dropdown.remove();
        doc.removeEventListener("click", closeHandler, true);
      }
    };
    doc.addEventListener("click", closeHandler, true);
  }, 50);
}
