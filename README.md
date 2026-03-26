<div align="center">

# Annotation Links

**Clickable cross-reference links between PDF annotations in Zotero.**

[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![Zotero](https://img.shields.io/badge/Zotero-7+-darkgreen.svg)](https://www.zotero.org)

</div>

---

### Why this plugin?

Zotero's annotation comments don't support clickable hyperlinks — a [long-requested feature](https://forums.zotero.org/discussion/130051/clickable-links-in-annotation-comments-annotation-annotation-annotation-item-pdf) by the community. Researchers studying across multiple sources need to cross-reference annotations, but there's no built-in way to link one annotation to another.

This plugin solves that by making `zotero://` links in annotation comments **clickable and navigable** — within the same PDF or across different documents.

<details>
<summary>Community requests addressed</summary>

- [Clickable links in annotation comments](https://forums.zotero.org/discussion/130051/clickable-links-in-annotation-comments-annotation-annotation-annotation-item-pdf)
- [Zotero links in annotations](https://forums.zotero.org/discussion/102967/zotero-links-in-annotations)
- [PDF annotations: clickable links and advanced syntax](https://forums.zotero.org/discussion/100647/pdf-annotations-clickable-links-and-advanced-syntax)
- [Hyperlinks to PDF annotations](https://forums.zotero.org/discussion/128771/hyperlinks-to-pdf-annotations)
- [Ability to add links in the built-in PDF viewer](https://forums.zotero.org/discussion/93197/ability-to-add-links-in-the-built-in-pdf-viewer)
- [Auto-select/highlight annotations when opening link](https://forums.zotero.org/discussion/125101/enhancement-auto-select-highlight-annotations-when-opening-link)

</details>

---

### ✨ Features

- **Copy Annotation Link** — Right-click any annotation or press `Ctrl+Shift+C` to copy its `zotero://` deep link
- **Clickable link icons** — Annotations containing `zotero://` links show a chain icon in the sidebar; click to navigate
- **Auto-focus** — The target annotation is automatically selected and highlighted after navigation
- **Cross-document detection** — Links to other PDFs show an external link icon with the document title on hover
- **Multi-link support** — Annotations with multiple links show a dropdown to pick the target
- **"Link copied" notification** — Visual confirmation when a link is copied to clipboard

### 🚀 How It Works

1. **Copy** — Right-click an annotation and select "Copy Annotation Link", or press `Ctrl+Shift+C`. A clean `zotero://` URL is copied to your clipboard.
2. **Paste** — Paste the link into another annotation's comment field (as plain text).
3. **Navigate** — A link icon appears in the annotation header. Click it to jump directly to the target annotation — it will be highlighted so you can find it immediately, even on a page with many annotations.

This works within the same PDF, across different PDFs, and even when opening links from external apps like Obsidian.

### 📦 Installation

<details>
<summary>Manual installation</summary>

1. Download `annotation-links.xpi` from the [latest release](https://github.com/mobench/zotero-annotation-links/releases/latest)
2. In Zotero: **Tools > Add-ons > gear icon > Install Add-on from File**
3. Select the `.xpi` file and enable the plugin

</details>

### ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+C` | Copy link for the selected annotation |

### 🔗 Link Format

The plugin works with Zotero's native protocol links:

```
zotero://open-pdf/library/items/{ITEM_KEY}?page={PAGE}&annotation={ANNOTATION_KEY}
```

These links are generated automatically — no need to construct them manually.

### 🤝 Contributing

Found a bug or have a feature request? [Open an issue](https://github.com/mobench/zotero-annotation-links/issues).

### 💜 Support

If you find this plugin useful, consider [buying me a coffee](https://buymeacoffee.com/mobench).

### 📄 License

[AGPL-3.0](LICENSE)

---

> [!NOTE]
> This plugin requires Zotero 7 or later. It does not make network requests or collect telemetry.
