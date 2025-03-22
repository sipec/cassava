# Project Knowledge

## Core Principles
- All processing happens client-side
- No server dependencies
- Privacy-first like Obsidian

## Tech Stack
- Tauri, targeting desktop
- Vite + React + TypeScript
- Tailwind for styling
- Papa Parse for CSV handling

## Development
- Use `bun` as package manager

### Typed CSV Format
See also `src/lib/parser/README.md`
- Superset of CSV with enhanced multi-line headers
- Uses "0-" prefix for metadata rows
- Supports rich type system including:
  - Basic types (string, number, logical)
  - Dates with format specs
  - Computed fields
  - Select/multiselect
  - Nullable fields
