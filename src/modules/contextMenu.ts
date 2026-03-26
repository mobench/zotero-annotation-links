import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { buildAnnotationUrl } from "./urlBuilder";

export function registerContextMenu() {
  Zotero.Reader.registerEventListener(
    "createAnnotationContextMenu",
    (event) => {
      const { reader, params, append } = event;

      // Capture all data NOW — params may be stale by the time onCommand fires
      const annotationKey = params.currentID || params.ids[0];
      const url = buildAnnotationUrl(reader._item, annotationKey);

      append({
        label: getString("context-menu-copy-link"),
        onCommand() {
          new ztoolkit.Clipboard().addText(url, "text/unicode").copy();
          // setTimeout escapes the reader iframe context — ProgressWindow crashes otherwise
          setTimeout(() => {
            new ztoolkit.ProgressWindow(addon.data.config.addonName)
              .createLine({ text: "Link copied", type: "success" })
              .show(2000);
          }, 0);
        },
      });
    },
    config.addonID,
  );
}
