<div align="center">

# Annotation Links

**Clickable cross-reference links between PDF annotations in Zotero.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Zotero](https://img.shields.io/badge/Zotero-7+-darkgreen.svg)](https://www.zotero.org)

</div>

---

## Features

- **Copy Annotation Link** — Right-click any annotation to copy its `zotero://` deep link
- **Clickable link icons** — Annotations containing `zotero://` links show a chain icon in the sidebar header; click to navigate
- **Cross-document detection** — Links to other PDFs show an external link icon with the document title on hover
- **Multi-link support** — Annotations with multiple links show a dropdown to pick the target
- **Localized** — English and Arabic UI

## How It Works

1. **Copy** — Right-click an annotation, select "Copy Annotation Link". A clean `zotero://open-pdf/...` URL is copied to your clipboard.
2. **Paste** — Paste the link into another annotation's comment field (as plain text).
3. **Navigate** — A link icon appears in the annotation header. Click it to jump to the target annotation, even across different PDFs.

## Installation

<details>
<summary>Manual installation</summary>

1. Download `annotation-links.xpi` from the [latest release](https://github.com/mobench/zotero-annotation-links/releases/latest)
2. In Zotero: **Tools > Add-ons > gear icon > Install Add-on from File**
3. Select the `.xpi` file and enable the plugin

</details>

## Link Format

The plugin works with Zotero's native protocol links:

```
zotero://open-pdf/library/items/{ITEM_KEY}?page={PAGE}&annotation={ANNOTATION_KEY}
```

These links are generated automatically by "Copy Annotation Link" — no need to construct them manually.

## Contributing

Found a bug or have a feature request? [Open an issue](https://github.com/mobench/zotero-annotation-links/issues).

## Support

If you find this plugin useful, consider [buying me a coffee](https://buymeacoffee.com/mobench).

## License

[MIT](LICENSE)

---

> [!NOTE]
> This plugin requires Zotero 7 or later. It does not make network requests or collect telemetry.
