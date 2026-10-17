import { assert } from "chai";
import { applyLinkTemplate } from "../src/modules/linkTemplate";

const LINK =
  "zotero://open-pdf/library/items/ABCD1234?page=2&annotation=WXYZ5678";

describe("applyLinkTemplate", function () {
  it("should replace placeholders with their values", function () {
    assert.equal(
      applyLinkTemplate("[Page {page}]({link})", { page: "2", link: LINK }),
      `[Page 2](${LINK})`,
    );
  });

  it("should keep unknown placeholders", function () {
    assert.equal(
      applyLinkTemplate("{foo} {toString} {link}", { link: LINK }),
      `{foo} {toString} ${LINK}`,
    );
  });
});
