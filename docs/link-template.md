# Link Templates

By default, **Copy Annotation Link** copies a plain `zotero://` URL. A link template wraps that URL in your own text — for example a Markdown link for Obsidian — so you don't need to format it each time you paste.

### Setting a Template

1. In Zotero: **Settings > Annotation Links**
2. Enter a template in the **Link template** field
3. Copy an annotation link — right-click "Copy Annotation Link" or `Ctrl+Shift+C` — and the template is applied

Leave the field empty (or set it to `{link}`) to copy the plain URL.

### Placeholders

Placeholders are written in curly braces and replaced with the values of the copied annotation:

| Placeholder       | Replaced with                                         | Example                                                               |
| ----------------- | ----------------------------------------------------- | --------------------------------------------------------------------- |
| `{link}`          | The `zotero://` link to the annotation                | `zotero://open-pdf/library/items/ABCD1234?page=2&annotation=WXYZ5678` |
| `{page}`          | The annotation's page label                           | `2`                                                                   |
| `{title}`         | The title of the document                             | `An Example Paper`                                                    |
| `{text}`          | The highlighted text, on a single line                | `an example highlighted sentence`                                     |
| `{author}`        | The document's authors, as in Zotero's Creator column | `Mark`, `Mark and Smith` or `Mark et al.`                             |
| `{year}`          | The year of the document's date                       | `2000`                                                                |
| `{citation}`      | The author and year, separated by a comma             | `Mark et al., 2000`                                                   |
| `{annotationKey}` | The annotation's item key                             | `WXYZ5678`                                                            |
| `{itemKey}`       | The PDF attachment's item key                         | `ABCD1234`                                                            |

For a PDF attached to an item, `{title}`, `{author}`, `{year}` and `{citation}` come from that parent item. `{citation}` leaves out whichever part is missing, e.g. `Mark` for an undated item.

Placeholders are case-sensitive. Unknown placeholders such as `{foo}` are copied as they are, and a placeholder without a value (e.g. `{text}` for an image annotation) is replaced with nothing.

### Examples

| Template                                  | Copied text                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| `{link}`                                  | `zotero://open-pdf/library/items/ABCD1234?page=2&annotation=WXYZ5678`           |
| `[Page {page}]({link})`                   | `[Page 2](zotero://open-pdf/library/items/ABCD1234?page=2&annotation=WXYZ5678)` |
| `[{title}, p. {page}]({link})`            | `[An Example Paper, p. 2](zotero://...)`                                        |
| `> {text} ([p. {page}]({link}))`          | `> an example highlighted sentence ([p. 2](zotero://...))`                      |
| `[{citation}, p. {page}]({link})`         | `[Mark et al., 2000, p. 2](zotero://...)`                                       |
| `({author}, {year}, p. [{page}]({link}))` | `(Mark et al., 2000, p. [2](zotero://...))`                                     |
| `<a href="{link}">p. {page}</a>`          | `<a href="zotero://...">p. 2</a>`                                               |

> [!NOTE]
> Links copied with a template still work inside Zotero. When you paste one into another annotation's comment, the plugin detects the `zotero://` link inside it and shows the link icon as usual.
