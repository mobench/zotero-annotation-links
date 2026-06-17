import { ZoteroLink } from "./linkDetector";

export async function navigateToZoteroLink(link: ZoteroLink): Promise<void> {
  const isPdfAnnotation =
    (link.action === "open" || link.action === "open-pdf") &&
    link.objectType === "items" &&
    !!link.annotationKey &&
    !link.cfi &&
    !link.sel;

  if (isPdfAnnotation) {
    await navigateToAnnotation(link); // optimized Reader.open + focus patch
  } else {
    dispatchZoteroUri(link.url); // select / collection / EPUB / page-only
  }
}

function dispatchZoteroUri(url: string): void {
  try {
    const pane = Zotero.getActiveZoteroPane?.();
    if (pane?.loadURI) {
      pane.loadURI(url);
    } else {
      Zotero.launchURL(url);
    }
  } catch (e) {
    Zotero.debug(`[AnnotationLinks] zotero:// dispatch failed: ${e}`);
    Zotero.launchURL(url);
  }
}

export async function navigateToAnnotation(link: ZoteroLink): Promise<void> {
  try {
    // Resolve library ID
    let libraryID: number;
    if (link.groupID) {
      const group = (Zotero.Groups as any).getByGroupID(parseInt(link.groupID));
      if (!group) {
        Zotero.debug(`[AnnotationLinks] Group ${link.groupID} not found`);
        return;
      }
      libraryID = group.libraryID;
    } else {
      libraryID = Zotero.Libraries.userLibraryID;
    }

    // Get the attachment item
    const item = Zotero.Items.getByLibraryAndKey(libraryID, link.itemKey);
    if (!item) {
      Zotero.debug(
        `[AnnotationLinks] Item ${link.itemKey} not found in library ${libraryID}`,
      );
      return;
    }

    // Build location
    const location: _ZoteroTypes.Reader.Location = {};
    if (link.annotationKey) {
      location.annotationKey = link.annotationKey;
    }
    if (link.page) {
      location.pageIndex = parseInt(link.page) - 1;
    }

    // Open the PDF — the patched Reader.open in hooks.ts handles annotation focus
    await Zotero.Reader.open(item.id, location);
  } catch (e) {
    Zotero.debug(`[AnnotationLinks] Navigation failed, falling back: ${e}`);
    Zotero.launchURL(link.url);
  }
}

export function openWebLink(url: string): void {
  try {
    Zotero.launchURL(url);
  } catch (e) {
    Zotero.debug(`[AnnotationLinks] Failed to open web link: ${e}`);
  }
}
