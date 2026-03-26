import { ZoteroLink } from "./linkDetector";

export async function navigateToAnnotation(link: ZoteroLink): Promise<void> {
  try {
    // Resolve library ID
    let libraryID: number;
    if (link.groupID) {
      const group = (Zotero.Groups as any).getByGroupID(
        parseInt(link.groupID),
      );
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

    // Navigate
    await Zotero.Reader.open(item.id, location);
  } catch (e) {
    Zotero.debug(`[AnnotationLinks] Navigation failed, falling back: ${e}`);
    Zotero.launchURL(link.url);
  }
}
