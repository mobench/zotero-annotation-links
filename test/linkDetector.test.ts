import { assert } from "chai";
import { extractZoteroLinks } from "../src/modules/linkDetector";

const LINK =
  "zotero://open-pdf/library/items/ABCD1234?page=2&annotation=WXYZ5678";

describe("extractZoteroLinks", function () {
  it("should detect a link wrapped in Markdown", function () {
    const [link] = extractZoteroLinks(`see [Page 2](${LINK}).`);
    assert.equal(link.url, LINK);
    assert.equal(link.page, "2");
    assert.equal(link.annotationKey, "WXYZ5678");
  });

  it("should keep balanced parentheses in EPUB links", function () {
    const url =
      "zotero://open/library/items/ABCD1234?cfi=epubcfi(/6/4!/4/2/1:0)";
    const [link] = extractZoteroLinks(`[Chapter 1](${url})`);
    assert.equal(link.url, url);
    assert.equal(link.cfi, "epubcfi(/6/4!/4/2/1:0)");
  });
});
