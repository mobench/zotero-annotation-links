export interface ZoteroLink {
  url: string;
  itemKey: string;
  page?: string;
  annotationKey?: string;
  groupID?: string;
}

const ZOTERO_LINK_REGEX =
  /zotero:\/\/open-pdf\/(library|groups\/(\d+))\/items\/([A-Z0-9]+)(\?[^\s]*)?/gi;

export function extractZoteroLinks(text: string): ZoteroLink[] {
  if (!text) return [];

  const links: ZoteroLink[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  ZOTERO_LINK_REGEX.lastIndex = 0;

  while ((match = ZOTERO_LINK_REGEX.exec(text)) !== null) {
    const fullUrl = match[0];
    const groupID = match[2]; // undefined for "library", number string for groups
    const itemKey = match[3];
    const queryString = match[4] || "";

    // Parse query params
    const params = new URLSearchParams(queryString.replace(/^\?/, ""));

    links.push({
      url: fullUrl,
      itemKey,
      page: params.get("page") ?? undefined,
      annotationKey: params.get("annotation") ?? undefined,
      groupID,
    });
  }

  return links;
}
