import { config } from "../../package.json";
import { getString } from "../utils/locale";

export function registerPreferencePane() {
  // Zotero removes the pane automatically when the plugin shuts down
  Zotero.PreferencePanes.register({
    pluginID: config.addonID,
    src: `${rootURI}content/preferences.xhtml`,
    label: getString("prefs-title"),
    image: `chrome://${config.addonRef}/content/icons/link.svg`,
  });
}
