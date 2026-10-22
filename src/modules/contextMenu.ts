import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { buildAnnotationLinkText, getCopyLinkOptions } from "./linkTemplate";

export function registerContextMenu() {
  Zotero.Reader.registerEventListener(
    "createAnnotationContextMenu",
    (event) => {
      const { reader, params, append } = event;

      // Capture all data NOW — params may be stale by the time onCommand fires
      const annotationKey = params.currentID || params.ids[0];

      // One menu item per copy option (Settings > Annotation Links)
      const menuItems = getCopyLinkOptions(
        getString("context-menu-copy-link"),
        (number) =>
          getString("context-menu-copy-link-numbered", { args: { number } }),
      ).map(({ label, template }) => {
        const linkText = buildAnnotationLinkText(
          reader._item,
          annotationKey,
          template,
        );

        return {
          label,
          onCommand() {
            new ztoolkit.Clipboard().addText(linkText, "text/unicode").copy();
            // setTimeout escapes the reader iframe context — ProgressWindow crashes otherwise
            setTimeout(() => {
              new ztoolkit.ProgressWindow(addon.data.config.addonName)
                .createLine({ text: "Link copied", type: "success" })
                .show(2000);
            }, 0);
          },
        };
      });

      // Each append call is its own group with a separator before it, so append
      // all items in one call to group them like the highlight colors
      (append as (...items: typeof menuItems) => void)(...menuItems);
    },
    config.addonID,
  );
}
