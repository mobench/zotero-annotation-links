import { config } from "../../package.json";
import {
  extractWebLinks,
  extractZoteroLinks,
  ZoteroLink,
} from "./linkDetector";
import { navigateToZoteroLink, openWebLink } from "./linkNavigation";

const EXTERNAL_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-inline-start:2px;vertical-align:middle;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

const CHAIN_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;

const GLOBE_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;

interface DropdownItem {
  label: string;
  title?: string;
  showExternalIcon?: boolean;
  dir?: "ltr";
  onClick: () => void;
}

interface LinkInfo {
  text: string;
  tooltip: string;
  showExternalIcon: boolean;
}

function resolveLibraryID(groupID?: string): number | null {
  try {
    if (groupID) {
      return (
        (Zotero.Groups as any).getByGroupID(parseInt(groupID))?.libraryID ??
        null
      );
    }
    return Zotero.Libraries.userLibraryID;
  } catch {
    return null;
  }
}

function describeZoteroLink(
  link: ZoteroLink,
  currentAttachmentKey: string,
): LinkInfo {
  const libraryID = resolveLibraryID(link.groupID);

  // Select / open a collection
  if (link.objectType === "collections") {
    let name: string | undefined;
    try {
      if (libraryID != null) {
        const collection = (Zotero.Collections as any).getByLibraryAndKey(
          libraryID,
          link.itemKey,
        );
        if (collection) name = collection.name;
      }
    } catch (e) {
      Zotero.debug(`[AnnotationLinks] Failed to resolve collection: ${e}`);
    }
    const label = name || link.itemKey;
    return {
      text: label,
      tooltip: `Collection: ${label}`,
      showExternalIcon: true,
    };
  }

  // PDF annotation link — keep the existing "Page N" behavior
  if (
    (link.action === "open" || link.action === "open-pdf") &&
    link.annotationKey &&
    !link.cfi &&
    !link.sel
  ) {
    const page = link.page || "?";
    const isCrossDoc = link.itemKey !== currentAttachmentKey;

    if (!isCrossDoc) {
      return {
        text: `Page ${page}`,
        tooltip: `Linked annotation (page ${page})`,
        showExternalIcon: false,
      };
    }

    const docTitle = resolveItemTitle(libraryID, link.itemKey) || link.itemKey;
    return {
      text: `Page ${page}`,
      tooltip: `${docTitle} — Page ${page}`,
      showExternalIcon: true,
    };
  }

  // select / open an item (no annotation), incl. EPUB/snapshot
  const title = resolveItemTitle(libraryID, link.itemKey) || link.itemKey;
  return { text: title, tooltip: `Open: ${title}`, showExternalIcon: true };
}

function resolveItemTitle(
  libraryID: number | null,
  itemKey: string,
): string | undefined {
  if (libraryID == null) return undefined;
  try {
    const item = Zotero.Items.getByLibraryAndKey(libraryID, itemKey);
    if (!item) return undefined;
    // For attachments, prefer the parent item's title
    if (item.parentItem) {
      return item.parentItem.getDisplayTitle();
    } else if (item.parentItemKey) {
      const parent = Zotero.Items.getByLibraryAndKey(
        libraryID,
        item.parentItemKey as string,
      );
      if (parent) return parent.getDisplayTitle();
    }
    return item.getDisplayTitle();
  } catch (e) {
    Zotero.debug(`[AnnotationLinks] Failed to resolve title: ${e}`);
    return undefined;
  }
}

export function registerAnnotationHeader() {
  Zotero.Reader.registerEventListener(
    "renderSidebarAnnotationHeader",
    (event) => {
      const { reader, doc, params, append } = event;
      const comment = params.annotation.comment || "";

      const zoteroLinks = extractZoteroLinks(comment);
      const webLinks = extractWebLinks(comment);
      if (zoteroLinks.length === 0 && webLinks.length === 0) return;

      const currentAttachmentKey = reader._item.key;

      // Wrap both icons in a single container — append() must be synchronous,
      // so one wrapper avoids relying on multiple append() calls.
      const container = doc.createElement("span");
      container.style.cssText = "display:inline-flex;align-items:center;";

      if (zoteroLinks.length > 0) {
        container.appendChild(
          buildZoteroIcon(doc, zoteroLinks, currentAttachmentKey),
        );
      }
      if (webLinks.length > 0) {
        container.appendChild(buildWebIcon(doc, webLinks));
      }

      append(container);
    },
    config.addonID,
  );
}

function buildZoteroIcon(
  doc: Document,
  links: ZoteroLink[],
  currentAttachmentKey: string,
): HTMLElement {
  const icon = doc.createElement("span");
  icon.style.cssText =
    "display:inline-flex;align-items:center;cursor:pointer;padding:2px;margin-inline-start:4px;";
  icon.innerHTML = CHAIN_ICON_SVG;

  if (links.length === 1) {
    const info = describeZoteroLink(links[0], currentAttachmentKey);
    icon.title = info.tooltip;
    if (info.showExternalIcon) {
      icon.innerHTML += EXTERNAL_ICON_SVG;
    }
    icon.addEventListener("click", (e) => {
      e.stopPropagation();
      void navigateToZoteroLink(links[0]);
    });
  } else {
    icon.title = `${links.length} Zotero links`;
    const items: DropdownItem[] = links.map((link) => {
      const info = describeZoteroLink(link, currentAttachmentKey);
      return {
        label: info.text,
        title: info.tooltip,
        showExternalIcon: info.showExternalIcon,
        onClick: () => void navigateToZoteroLink(link),
      };
    });
    icon.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown(icon, items, doc);
    });
  }

  return icon;
}

function buildWebIcon(doc: Document, urls: string[]): HTMLElement {
  const icon = doc.createElement("span");
  icon.style.cssText =
    "display:inline-flex;align-items:center;cursor:pointer;padding:2px;margin-inline-start:4px;";
  icon.innerHTML = GLOBE_ICON_SVG;

  if (urls.length === 1) {
    icon.title = urls[0];
    icon.addEventListener("click", (e) => {
      e.stopPropagation();
      openWebLink(urls[0]);
    });
  } else {
    icon.title = `${urls.length} web links`;
    const items: DropdownItem[] = urls.map((url) => ({
      label: url,
      title: url,
      dir: "ltr",
      onClick: () => openWebLink(url),
    }));
    icon.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown(icon, items, doc);
    });
  }

  return icon;
}

function toggleDropdown(
  anchor: HTMLElement,
  items: DropdownItem[],
  doc: Document,
) {
  // Toggle — remove if already open
  const existing = anchor.querySelector(".annotation-links-dropdown");
  if (existing) {
    existing.remove();
    return;
  }

  const dropdown = doc.createElement("div");
  dropdown.className = "annotation-links-dropdown";
  // max-width is capped to the sidebar viewport so long URLs ellipsize instead
  // of pushing the box off-screen; final position is clamped below.
  dropdown.style.cssText =
    "position:absolute;top:100%;inset-inline-end:0;background:var(--color-background);border:1px solid var(--color-border);border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.15);z-index:100;min-width:120px;max-width:min(320px, calc(100vw - 16px));padding:4px 0;";

  for (const it of items) {
    const item = doc.createElement("div");
    item.style.cssText =
      "padding:4px 12px;cursor:pointer;font-size:12px;display:flex;align-items:center;";

    // Label lives in its own span so text-overflow:ellipsis works inside the
    // flex row (min-width:0 lets it shrink). Truncation happens on the end.
    const label = doc.createElement("span");
    label.style.cssText =
      "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;";
    if (it.dir) {
      // Force LTR for URLs so the right end truncates (comment may be RTL/Arabic)
      label.style.cssText += `direction:${it.dir};text-align:left;`;
    }
    label.textContent = it.label;
    item.appendChild(label);

    if (it.showExternalIcon) {
      item.insertAdjacentHTML("beforeend", EXTERNAL_ICON_SVG);
    }
    if (it.title) {
      item.title = it.title;
    }
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.remove();
      it.onClick();
    });
    dropdown.appendChild(item);
  }

  anchor.style.position = "relative";
  anchor.appendChild(dropdown);

  // Clamp horizontally so the box stays within the sidebar viewport. The anchor
  // sits near the panel edge, so an RTL/long-URL dropdown can overflow and get
  // clipped by the panel; shift it back into view.
  const view = doc.defaultView;
  if (view) {
    const margin = 8;
    const rect = dropdown.getBoundingClientRect();
    let shift = 0;
    if (rect.right > view.innerWidth - margin) {
      shift -= rect.right - (view.innerWidth - margin);
    }
    if (rect.left + shift < margin) {
      shift += margin - (rect.left + shift);
    }
    if (shift !== 0) {
      dropdown.style.transform = `translateX(${shift}px)`;
    }
  }

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
