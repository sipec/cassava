# Project Knowledge

This is a csv editor that wants to be a spreasheet when it grows up.

## Core Principles

- All processing happens client-side
- No server dependencies
- Privacy-first
- Open file types, like Obsidian
- Keep it simple - avoid premature optimizations like useCallback/useMemo

## Tech Stack

- Tauri, targeting desktop
- Vite + React + TypeScript
- Tailwind for styling
- Papa Parse for CSV handling

## Development

- Use `bun` as package manager
- Run `bun run ai:validate` after each change, and fix errors
  - also run `bun run ai:validate:rust` if you change anything in src-tauri

### Implementation Notes

- Keep parsing logic separate in lib/parser
- Focus on reliability over performance initially
- Add error boundaries around key components

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
