import { config } from "../../package.json";
import { getString } from "../utils/locale";

export function registerContextMenu() {
  Zotero.Reader.registerEventListener(
    "createAnnotationContextMenu",
    (event) => {
      const { reader, params, append } = event;

      // Capture all data NOW — params may be stale by the time onCommand fires
      const annotationKey = params.currentID || params.ids[0];
      const attachment = reader._item;
      const attachmentKey = attachment.key;
      const libraryID = attachment.libraryID;

      // Get annotation item to read page label
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

      Zotero.debug(
        `[AnnotationLinks] annotationKey=${annotationKey} ids=${JSON.stringify(params.ids)} currentID=${params.currentID} url=${url}`,
      );

      append({
        label: getString("context-menu-copy-link"),
        onCommand() {
          new ztoolkit.Clipboard().addText(url, "text/unicode").copy();
        },
      });
    },
    config.addonID,
  );
}
