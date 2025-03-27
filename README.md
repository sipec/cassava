# Cassava

A slick, modern CSV editor with spreadsheet features. Like Obsidian but for CSV files.

## Features

- 📊 [Typed columns](/src/lib/parser/README.md): Text, Numbers, Dates, Checkboxes, Select & Multi-select
- 🔄 Functions (coming soon)
- 💾 Autosave
- ⌨️ Keyboard navigation
- ✂️ Copy/paste (coming soon)
- 🔒 100% local - your data never leaves your device

### Roadmap

- 🎯 Column/row reordering
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
