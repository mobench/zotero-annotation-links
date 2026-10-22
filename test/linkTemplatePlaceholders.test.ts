import { assert } from "chai";
import { config } from "../package.json";
import { buildAnnotationLinkText } from "../src/modules/linkTemplate";

const TEMPLATE_PREF = `${config.prefsPrefix}.linkTemplate`;

async function createParentItem(authors: string[], date?: string) {
  const parentItem = new Zotero.Item("journalArticle");
  parentItem.setField("title", "An Example Paper");
  parentItem.setCreators(
    authors.map((lastName) => ({
      firstName: "Ann",
      lastName,
      creatorType: "author",
    })),
  );
  if (date) {
    parentItem.setField("date", date);
  }
  await parentItem.saveTx();
  return parentItem;
}

async function createPdfAttachment(parentItem?: Zotero.Item) {
  const attachment = new Zotero.Item("attachment");
  if (parentItem) {
    attachment.parentID = parentItem.id;
  }
  attachment.attachmentLinkMode = Zotero.Attachments.LINK_MODE_IMPORTED_FILE;
  attachment.attachmentContentType = "application/pdf";
  attachment.setField("title", "Example Attachment");
  await attachment.saveTx();
  return attachment;
}

async function createAnnotation(
  attachment: Zotero.Item,
  type: "highlight" | "image",
  text?: string,
) {
  const annotation = new Zotero.Item("annotation");
  annotation.libraryID = attachment.libraryID;
  annotation.parentID = attachment.id;
  annotation.annotationType = type;
  if (text) {
    annotation.annotationText = text;
  }
  annotation.annotationColor = "#ffd400";
  annotation.annotationPageLabel = "iv";
  // @ts-expect-error - Sort index is typed as a number, but Zotero expects a string
  annotation.annotationSortIndex = "00003|000283|00100";
  annotation.annotationPosition = JSON.stringify({
    pageIndex: 3,
    rects: [[100, 200, 300, 220]],
  });
  await annotation.saveTx();
  return annotation;
}

function setTemplate(template: string) {
  Zotero.Prefs.set(TEMPLATE_PREF, template, true);
}

describe("buildAnnotationLinkText", function () {
  let parentItem: Zotero.Item;
  let attachment: Zotero.Item;
  let annotation: Zotero.Item;
  let link: string;

  before(async function () {
    parentItem = await createParentItem(
      ["Mark", "Smith", "Jones"],
      "2000-05-01",
    );
    attachment = await createPdfAttachment(parentItem);
    annotation = await createAnnotation(
      attachment,
      "highlight",
      "an example\n  highlighted sentence",
    );
    link = `zotero://open-pdf/library/items/${attachment.key}?page=iv&annotation=${annotation.key}`;
  });

  afterEach(function () {
    Zotero.Prefs.clear(TEMPLATE_PREF, true);
  });

  after(async function () {
    await parentItem.eraseTx();
  });

  it("should copy the plain link by default", function () {
    assert.equal(buildAnnotationLinkText(attachment, annotation.key), link);
  });

  it("should use the given template instead of the main one", function () {
    setTemplate("[Page {page}]({link})");
    assert.equal(
      buildAnnotationLinkText(attachment, annotation.key, "> {text}"),
      "> an example highlighted sentence",
    );
  });

  it("should copy the plain link for an empty template", function () {
    setTemplate("");
    assert.equal(buildAnnotationLinkText(attachment, annotation.key), link);
  });

  it("should replace {link}", function () {
    setTemplate("<{link}>");
    assert.equal(
      buildAnnotationLinkText(attachment, annotation.key),
      `<${link}>`,
    );
  });

  it("should replace {page} with the page label", function () {
    setTemplate("p. {page}");
    assert.equal(buildAnnotationLinkText(attachment, annotation.key), "p. iv");
  });

  it("should replace {title} with the parent item's title", function () {
    setTemplate("{title}");
    assert.equal(
      buildAnnotationLinkText(attachment, annotation.key),
      "An Example Paper",
    );
  });

  it("should replace {text} with the highlighted text on one line", function () {
    setTemplate("> {text}");
    assert.equal(
      buildAnnotationLinkText(attachment, annotation.key),
      "> an example highlighted sentence",
    );
  });

  it("should replace {annotationKey} and {itemKey}", function () {
    setTemplate("{annotationKey} {itemKey}");
    assert.equal(
      buildAnnotationLinkText(attachment, annotation.key),
      `${annotation.key} ${attachment.key}`,
    );
  });

  it("should replace {author} with the first creator", function () {
    setTemplate("{author}");
    assert.equal(
      buildAnnotationLinkText(attachment, annotation.key),
      "Mark et al.",
    );
  });

  it("should replace {year} with the year of the date", function () {
    setTemplate("{year}");
    assert.equal(buildAnnotationLinkText(attachment, annotation.key), "2000");
  });

  it("should replace {citation} with the author and year", function () {
    setTemplate("{citation}, p. {page}");
    assert.equal(
      buildAnnotationLinkText(attachment, annotation.key),
      "Mark et al., 2000, p. iv",
    );
  });

  it("should replace all placeholders in one template", function () {
    setTemplate(
      "[{title}, p. {page}]({link}) {text} ({author}, {year}) {citation}",
    );
    assert.equal(
      buildAnnotationLinkText(attachment, annotation.key),
      `[An Example Paper, p. iv](${link}) an example highlighted sentence (Mark et al., 2000) Mark et al., 2000`,
    );
  });

  it("should name one or two authors in {author}", async function () {
    const oneAuthorItem = await createParentItem(["Mark"], "2000");
    const twoAuthorsItem = await createParentItem(["Mark", "Smith"], "2000");
    setTemplate("{author}");
    try {
      for (const [item, expected] of [
        [oneAuthorItem, "Mark"],
        [twoAuthorsItem, "Mark and Smith"],
      ] as const) {
        const itemAttachment = await createPdfAttachment(item);
        const itemAnnotation = await createAnnotation(
          itemAttachment,
          "highlight",
          "text",
        );
        assert.equal(
          buildAnnotationLinkText(itemAttachment, itemAnnotation.key),
          expected,
        );
      }
    } finally {
      await oneAuthorItem.eraseTx();
      await twoAuthorsItem.eraseTx();
    }
  });

  it("should leave out the year in {citation} for an undated item", async function () {
    const undatedItem = await createParentItem(["Mark"]);
    const undatedAttachment = await createPdfAttachment(undatedItem);
    const undatedAnnotation = await createAnnotation(
      undatedAttachment,
      "highlight",
      "text",
    );
    setTemplate("[{citation}] [{year}]");
    try {
      assert.equal(
        buildAnnotationLinkText(undatedAttachment, undatedAnnotation.key),
        "[Mark] []",
      );
    } finally {
      await undatedItem.eraseTx();
    }
  });

  it("should replace {text} with nothing for an image annotation", async function () {
    const imageAnnotation = await createAnnotation(attachment, "image");
    setTemplate("[{text}]");
    assert.equal(
      buildAnnotationLinkText(attachment, imageAnnotation.key),
      "[]",
    );
  });

  it("should use the attachment's title and no citation for a standalone PDF", async function () {
    const standaloneAttachment = await createPdfAttachment();
    const standaloneAnnotation = await createAnnotation(
      standaloneAttachment,
      "highlight",
      "text",
    );
    setTemplate("{title} [{author}] [{year}] [{citation}]");
    try {
      assert.equal(
        buildAnnotationLinkText(standaloneAttachment, standaloneAnnotation.key),
        "Example Attachment [] [] []",
      );
    } finally {
      await standaloneAttachment.eraseTx();
    }
  });
});
