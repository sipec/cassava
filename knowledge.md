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

### Project Structure

- `src/`
  - `components/` - React components
    - `inputs/` - Specialized input components for different data types
    - `ErrorBoundary.tsx` - Top-level error handling
  - `lib/`
    - `parser/` - CSV parsing and type handling
    - `files.ts` - File operations
  - `App.tsx` - Main application component
- `src-tauri/` - Rust backend code

### Implementation Notes

- Keep parsing logic separate in lib/parser
- Focus on simplicity over performance initially
- Add error boundaries around key components

Component Style:

```typescript
export const CellInput = (props: {
 value: string
 setValue: (value: string) => void
 nullDefault?: string
 type: ColumnType
}) => {
```

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
