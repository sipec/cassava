# Cassava

A slick, modern CSV editor with spreadsheet features. Like Obsidian but for CSV files.

## Features

- 📊 [Typed columns](/src/lib/parser/README.md): Text, Numbers, Dates, Checkboxes, Select & Multi-select
- 🔄 Formulas like excel & google sheets - using [HyperFormula](https://hyperformula.dev/)
- 💾 Autosave
- ⌨️ Keyboard navigation
- 🔒 100% local - your data never leaves your device
- 🎯 Column/row reordering
- ✂️ Copy/paste

### Roadmap

- 🔄 Undo/redo support
- 📑 Multiple file tabs
- 📥 Import from other formats
- 📤 Export to Excel/JSON

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build
```

we use biome.js for linting and formatting. (`bun run lint` and `bun run format`)
