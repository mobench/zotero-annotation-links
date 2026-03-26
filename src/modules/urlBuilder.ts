export function buildAnnotationUrl(
  attachment: Zotero.Item,
  annotationKey: string,
): string {
  const attachmentKey = attachment.key;
  const libraryID = attachment.libraryID;

  // Get page label
  const annotationItem = Zotero.Items.getByLibraryAndKey(
    libraryID,
    annotationKey,
  );
  const pageLabel =
    (annotationItem && annotationItem.annotationPageLabel) || "";

  // Determine library prefix
  const library = Zotero.Libraries.get(libraryID);
  let prefix: string;
  if (library && library.libraryType === "group") {
    prefix = `groups/${(library as any).groupID}`;
  } else {
    prefix = "library";
  }

  // Build URL
  let url = `zotero://open-pdf/${prefix}/items/${attachmentKey}`;
  const queryParams: string[] = [];
  if (pageLabel) {
    queryParams.push(`page=${pageLabel}`);
  }
  if (annotationKey) {
    queryParams.push(`annotation=${annotationKey}`);
  }
  if (queryParams.length) {
    url += `?${queryParams.join("&")}`;
  }

  return url;
}
