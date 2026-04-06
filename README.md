# @maxbrennemann/js-functions

Configurable, framework-agnostic HTML table library. Zero dependencies, TypeScript-first.

## Installation

```bash
# From GitHub (with version tag)
npm install git+https://github.com/maxBrennemann/js-functions.git#v0.1.0

# Or in package.json
"@maxBrennemann/js-functions": "git+https://github.com/maxBrennemann/js-functions.git#v0.1.0"
```

## Quick Start

```typescript
import { DataTable } from '@maxBrennemann/tables/datatable';

const table = new DataTable({
    columns: [
        { key: 'name', label: 'Kunde' },
        { key: 'amount', label: 'Betrag', format: 'currency', summary: 'sum' },
        { key: 'date', label: 'Datum', format: 'date' },
    ],
    actions: [
        { name: 'edit', icon: 'edit', className: 'tw:bg-green-400', onClick: (row) => editItem(row.id) },
        { name: 'delete', icon: 'delete', className: 'tw:bg-red-400', confirm: 'Löschen?', onClick: (row) => deleteItem(row.id) },
    ],
    footer: true,
    defaultSort: { column: 'date', direction: 'desc' },
});

table.mount('#table-container').setData(myData);
```

## Modules

### DataTable
Main orchestrator. Composes all other modules.

```typescript
table.setData(data)              // Set/replace data
table.addRow(row)                // Add single row
table.updateRow(id, updates)     // Update by primary key
table.removeRow(id)              // Remove by primary key
table.on('row:click', handler)   // Event listener
table.on('sort:change', handler) // Sort event
table.refresh()                  // Force re-render
table.destroy()                  // Clean up
```

### Formatter
Pluggable value formatting with built-in formats.

**Built-in:** `date`, `datetime`, `currency`, `currency-cents`, `percent`, `percent-decimal`, `seconds`, `duration`, `phone`, `boolean`, `number`

```typescript
// Custom formatter
table.formatter.register('risk', (value) => {
    const span = document.createElement('span');
    span.style.color = value === 'high' ? 'red' : 'green';
    span.textContent = value;
    return span;
});
```

### Sorter
Client-side sorting with smart type detection (numbers, dates, strings).

```typescript
// Server-side sorting
const table = new DataTable({
    columns: [...],
    onSort: async (column, direction) => {
        const data = await api.get(`/items?sort=${column}&dir=${direction}`);
        table.setData(data);
    },
});

// Custom comparer
table.sorter.registerComparer('priority', (a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a] ?? 99) - (order[b] ?? 99);
});
```

### ColumnManager
Column visibility, ordering, localStorage persistence, and toggle-panel UI.

```typescript
// Auto-created on DataTable:
table.columnManager.mountPanel('#settings-panel', '#settings-btn');
table.setColumnVisibility('email', false);

// Standalone:
import { ColumnManager } from '@mbrennemann/datatable';
const cm = new ColumnManager(columns, { storageKey: 'my-cols' });
cm.toggle('email');
cm.reorder(['name', 'date', 'amount']);
```

### IconResolver
Pluggable icon system with built-in icons and optional Lucide support.

**Built-in icons:** `edit`, `delete`, `save`, `add`, `check`, `move`, `chevron-down`, `chevron-up`, `sort-asc`, `sort-desc`, `sort-none`, `eye`, `link`, `settings`

```typescript
// Use built-in (no dependencies)
{ icon: 'edit' }

// Use Lucide (npm install lucide)
import * as lucide from 'lucide';
table.icons.useLucide(lucide);
{ icon: 'pencil' }  // any Lucide icon name

// Register custom
table.icons.register('archive', 'M20.54 5.23L19.15...');
{ icon: 'archive' }

// Raw SVG still works
{ icon: '<svg>...</svg>' }
```

### Events

```typescript
table.on('row:click', ({ row, element, event }) => { ... });
table.on('row:dblclick', ({ row, element, event }) => { ... });
table.on('row:action', ({ action, row, element }) => { ... });
table.on('sort:change', ({ column, direction }) => { ... });
table.on('columns:change', ({ columns }) => { ... });
table.on('data:change', ({ data }) => { ... });
table.on('render:complete', ({ rowCount }) => { ... });
```

## Configuration

```typescript
interface TableConfig {
    columns: ColumnDef[];
    actions?: ActionDef[];
    sortable?: boolean;              // default: true
    defaultSort?: SortState;
    footer?: boolean;                // default: false
    stripedRows?: boolean;           // default: true
    cssPrefix?: string;              // default: 'tw:'
    primaryKey?: string;             // default: 'id'
    persistColumns?: string;         // localStorage key
    emptyMessage?: string;           // default: 'Keine Daten verfügbar.'
    onSort?: (col, dir) => void;     // server-side sort hook
    styles?: {
        headerBg?: string;           // default: 'bg-[#83a9cd]'
        footerBg?: string;           // default: 'bg-[#d3dce3]'
        rowEven?: string;            // default: 'bg-gray-100'
        rowOdd?: string;             // default: 'bg-gray-200'
        rowHover?: string;           // default: 'hover:bg-gray-300'
    };
}
```

## Build

```bash
npm install
npm run build       # → dist/index.js, dist/index.cjs, dist/index.d.ts
npm run dev         # watch mode
npm run typecheck   # type-check without emitting
```

## Release

```bash
# bump version in package.json, then:
git add -A
git commit -m "v0.2.0"
git tag v0.2.0
git push && git push --tags
```

Consumers update via:
```bash
npm install git+https://github.com/maxBrennemann/js-functions.git#v0.2.0
```
