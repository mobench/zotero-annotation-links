import { getPref } from "../utils/prefs";
import { buildAnnotationUrl } from "./urlBuilder";

const DEFAULT_LINK_TEMPLATE = "{link}"; //Defaults to just the link

// Numbers of the additional copy options in Settings > Annotation Links
const EXTRA_COPY_OPTIONS = [2, 3, 4, 5] as const;

export interface CopyLinkOption {
  label: string;
  template: string;
}

/**
 * The copy options shown when right-clicking an annotation: the main link
 * template, followed by each additional copy option that has a template.
 * An additional option without a label is labelled by its number, e.g.
 * "Annotation Link 2" (the main option is number 1).
 * @param defaultLabel Label of the main option when no label is set
 * @param numberedLabel Label of an additional option when no label is set
 */
export function getCopyLinkOptions(
  defaultLabel: string,
  numberedLabel: (number: number) => string,
): CopyLinkOption[] {
  const options = [
    {
      label: getPref("linkLabel") || defaultLabel,
      template: getPref("linkTemplate") || DEFAULT_LINK_TEMPLATE,
    },
  ];
  for (const n of EXTRA_COPY_OPTIONS) {
    const template = getPref(`linkTemplate${n}`);
    if (!template.trim()) continue;
    options.push({
      label: getPref(`linkLabel${n}`) || numberedLabel(n),
      template,
    });
  }
  return options;
}

/**
 * Build the text copied to the clipboard for an annotation link.
 * The link is wrapped in the user's link template (Settings > Annotation Links),
 * e.g. `[Page {page}]({link})` for a Markdown link.
 * See docs/link-template.md for the available placeholders.
 * @param attachment
 * @param annotationKey
 * @param template Defaults to the main link template
 */
export function buildAnnotationLinkText(
  attachment: Zotero.Item,
  annotationKey: string,
  template = getPref("linkTemplate") || DEFAULT_LINK_TEMPLATE,
): string {
  const annotationItem = Zotero.Items.getByLibraryAndKey(
    attachment.libraryID,
    annotationKey,
  );

  // For attachments, prefer the parent item's title, creators and date
  const sourceItem = attachment.parentItem || attachment;

  // Same as Zotero's Creator column: "Mark", "Mark and Smith" or "Mark et al."
  const author = sourceItem.getField("firstCreator", true) as string;
  // Dates without a year are stored as "0000"
  const year = (sourceItem.getField("year") as string).replace(/^0000$/, "");

  // Build the link text by replacing placeholders and building the annotation URL.
  // see docs/link-template.md for the available placeholders.
  return applyLinkTemplate(template, {
    link: buildAnnotationUrl(attachment, annotationKey),
    page: (annotationItem && annotationItem.annotationPageLabel) || "",
    title: sourceItem.getDisplayTitle(),
    author,
    year,
    citation: [author, year].filter(Boolean).join(", "),
    // Keep multi-line highlights on one line so the template stays intact
    text: ((annotationItem && annotationItem.annotationText) || "")
      .replace(/\s+/g, " ")
      .trim(),
    annotationKey,
    itemKey: attachment.key,
  });
}

/**
 * Replace `{name}` placeholders in the template with their values.
 * Unknown placeholders are left as they are.
 * @param template
 * @param values
 * @example
 * ```js
 * applyLinkTemplate("[Page {page}]({link})", { page: "2", link: "zotero://..." });
 * // [Page 2](zotero://...)
 * ```
 */
export function applyLinkTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name)
      ? values[name]
      : placeholder,
  );
}
