export interface ZoteroLink {
  url: string;
  action: "open-pdf" | "open" | "select";
  objectType: "items" | "collections";
  itemKey: string; // item OR collection key
  page?: string;
  annotationKey?: string;
  groupID?: string;
  cfi?: string;
  sel?: string;
}

const ZOTERO_LINK_REGEX =
  /zotero:\/\/(open-pdf|open|select)\/(?:groups\/(\d+)\/|library\/)(items|collections)\/([A-Z0-9]+)(\?[^\s]*)?/gi;

export function extractZoteroLinks(text: string): ZoteroLink[] {
  if (!text) return [];

  const links: ZoteroLink[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  ZOTERO_LINK_REGEX.lastIndex = 0;

  while ((match = ZOTERO_LINK_REGEX.exec(text)) !== null) {
    const fullUrl = match[0];
    const action = match[1] as ZoteroLink["action"];
    const groupID = match[2]; // undefined for "library", number string for groups
    const objectType = match[3] as ZoteroLink["objectType"];
    const itemKey = match[4];
    const queryString = match[5] || "";

    // Parse query params
    const params = new URLSearchParams(queryString.replace(/^\?/, ""));

    links.push({
      url: fullUrl,
      action,
      objectType,
      itemKey,
      page: params.get("page") ?? undefined,
      annotationKey: params.get("annotation") ?? undefined,
      groupID,
      cfi: params.get("cfi") ?? undefined,
      sel: params.get("sel") ?? undefined,
    });
  }

  return links;
}

const WEB_LINK_REGEX = /https?:\/\/[^\s<>"']+/gi;

export function extractWebLinks(text: string): string[] {
  if (!text) return [];

  const links: string[] = [];
  let match: RegExpExecArray | null;

  WEB_LINK_REGEX.lastIndex = 0;

  while ((match = WEB_LINK_REGEX.exec(text)) !== null) {
    // Strip trailing punctuation that usually isn't part of the URL
    const url = match[0].replace(/[.,;:!?)\]]+$/, "");
    if (url) links.push(url);
  }

  return links;
}
