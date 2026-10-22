import { assert } from "chai";
import { config } from "../package.json";
import { getCopyLinkOptions } from "../src/modules/linkTemplate";

const DEFAULT_LABEL = "Copy Annotation Link";
const numberedLabel = (number: number) => `Annotation Link ${number}`;
const PREF_NAMES = [
  "linkTemplate",
  "linkLabel",
  ...[2, 3, 4, 5].flatMap((n) => [`linkTemplate${n}`, `linkLabel${n}`]),
];

function setPref(name: string, value: string) {
  Zotero.Prefs.set(`${config.prefsPrefix}.${name}`, value, true);
}

describe("getCopyLinkOptions", function () {
  afterEach(function () {
    for (const name of PREF_NAMES) {
      Zotero.Prefs.clear(`${config.prefsPrefix}.${name}`, true);
    }
  });

  it("should only have the main option by default", function () {
    assert.deepEqual(getCopyLinkOptions(DEFAULT_LABEL, numberedLabel), [
      { label: DEFAULT_LABEL, template: "{link}" },
    ]);
  });

  it("should use the main option's label and template", function () {
    setPref("linkLabel", "Copy Citation");
    setPref("linkTemplate", "([{citation}]({link}))");
    assert.deepEqual(getCopyLinkOptions(DEFAULT_LABEL, numberedLabel), [
      { label: "Copy Citation", template: "([{citation}]({link}))" },
    ]);
  });

  it("should add the options with a template in order", function () {
    setPref("linkLabel2", "Copy Quote");
    setPref("linkTemplate2", "{text} ([{citation}]({link}))");
    setPref("linkLabel3", "Unused");
    setPref("linkTemplate5", "[Page {page}]({link})");
    setPref("linkLabel5", "Copy Page Link");
    assert.deepEqual(getCopyLinkOptions(DEFAULT_LABEL, numberedLabel), [
      { label: DEFAULT_LABEL, template: "{link}" },
      { label: "Copy Quote", template: "{text} ([{citation}]({link}))" },
      { label: "Copy Page Link", template: "[Page {page}]({link})" },
    ]);
  });

  it("should label an option without a label with its number", function () {
    setPref("linkTemplate2", "{text}");
    setPref("linkTemplate4", "[Page {page}]({link})");
    assert.deepEqual(getCopyLinkOptions(DEFAULT_LABEL, numberedLabel), [
      { label: DEFAULT_LABEL, template: "{link}" },
      { label: "Annotation Link 2", template: "{text}" },
      { label: "Annotation Link 4", template: "[Page {page}]({link})" },
    ]);
  });

  it("should leave out an option with a blank template", function () {
    setPref("linkTemplate2", "  ");
    setPref("linkLabel2", "Copy Blank");
    assert.lengthOf(getCopyLinkOptions(DEFAULT_LABEL, numberedLabel), 1);
  });
});
