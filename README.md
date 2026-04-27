# @maxbrennemann/js-functions

Framework-agnostic TypeScript utilities for AJAX, DOM bindings, notifications, and data tables.
Tailwind CSS is required for the table and notification components. Lucide icons are optional.

## Installation

```bash
# Replace vX.Y with the desired version tag
npm install git+https://github.com/maxBrennemann/js-functions.git#v0.6
```

Or in `package.json`:
```json
"@maxbrennemann/js-functions": "git+https://github.com/maxBrennemann/js-functions.git#v0.6"
```

## Modules

### ajax

```typescript
import { ajax } from '@maxbrennemann/js-functions/ajax';
// or from the root:
import { ajax } from '@maxbrennemann/js-functions';

const res = await ajax.get('/api/items');
const res = await ajax.post('/api/items', { name: 'foo' });
const res = await ajax.put('/api/items/1', { name: 'bar' });
const res = await ajax.delete('/api/items/1');

// File upload
const res = await ajax.uploadFiles(input.files, '/api/upload', { userId: '42' });

// Auto-reload on 401
ajax.autoHandleUnauthorized = true;

// Response shape
// { success: true,  data: T,    error: null,   status: number }
// { success: false, data: null, error: string, status: number | null }
```

---

### bindings

Declarative DOM event bindings via `data-*` attributes.

```typescript
import { addBindings, getVariable } from '@maxbrennemann/js-functions/bindings';

addBindings({
    click_saveBtn:   (e) => save(),
    write_emailInput: (e) => validate(e),
    input_searchBox: (e) => search(e),
    drop_dropzone:   (e) => handleDrop(e),
});

// data-binding + id="saveBtn"       → click_saveBtn
// data-binding + data-fun="saveBtn" → click_saveBtn (overrides id)
// data-write   + id="emailInput"    → write_emailInput (change event)
// data-input   + id="searchBox"     → input_searchBox (input event)
// data-drop    + id="dropzone"      → drop_dropzone
// data-toggle  + data-target=".panel" → toggles .hidden on target

// Read a data-variable element's value
const value = getVariable('elementId');
```

---

### notifications

Tailwind-based toast notifications.

```typescript
import {
    notification,
    notificationLoader,
    notificationReplace,
    setTwPrefix,
    setNotificationPersistance,
    setNotificationContainer,
} from '@maxbrennemann/js-functions/notifications';

// Types: "success" | "warning" | "failure" | "loading"
notification('Gespeichert!', 'success');
notification('Etwas ist schiefgelaufen', 'failure', 'Stack trace here');
notification('Bitte prüfen', 'warning', '', 8000);

// Loading notification with manual ID (stays until replaced)
notificationLoader('save-op', 'Wird gespeichert…');
notificationReplace('save-op', 'Gespeichert!', 'success');

// Configuration
setTwPrefix('tw:');                    // default: 'tw:'
setNotificationPersistance(true);      // persist across page reloads via localStorage
setNotificationContainer(myElement);   // custom mount target (default: document.body)
```

> **Note:** `notificationReplace` was named `notificatinReplace` (typo) in versions before 0.6.

---

### deviceDetector

```typescript
import { DeviceDetector } from '@maxbrennemann/js-functions/deviceDetector';

DeviceDetector.isMobile();        // boolean
DeviceDetector.isMobileTablet();  // boolean (includes tablets)
DeviceDetector.getBrowser();      // "Chrome" | "Safari" | "Mozilla Firefox" | …
DeviceDetector.getOS();           // "Mac OS" | "Windows" | "iOS" | "Android" | "Linux" | null
```

---

### functions

```typescript
import { createPopup } from '@maxbrennemann/js-functions/functions';

// Appends a modal overlay to document.body, returns the options container div
const optionsContainer = createPopup(myContentElement);
```

---

### tables

Full-featured data table. Requires Tailwind CSS.

```typescript
import { DataTable } from '@maxbrennemann/js-functions/tables';

const table = new DataTable({
    columns: [
        { key: 'name',   label: 'Kunde' },
        { key: 'amount', label: 'Betrag', format: 'currency', summary: 'sum' },
        { key: 'date',   label: 'Datum',  format: 'date' },
    ],
    actions: [
        { name: 'edit',   icon: 'edit',   className: 'tw:bg-green-400', onClick: (row) => edit(row.id) },
        { name: 'delete', icon: 'delete', className: 'tw:bg-red-400',   confirm: 'Löschen?', onClick: (row) => del(row.id) },
    ],
    footer: true,
    defaultSort: { column: 'date', direction: 'desc' },
});

table.mount('#table-container').setData(myData);
```

#### DataTable API

```typescript
table.setData(data)                        // replace data
table.addRow(row)                          // append row
table.updateRow(id, updates)               // update by primary key
table.removeRow(id)                        // remove by primary key
table.setColumnVisibility('email', false)  // toggle column
table.refresh()                            // force re-render
table.destroy()                            // remove from DOM + clean up listeners
```

#### Formatter

Built-in formats: `date`, `datetime`, `currency`, `currency-cents`, `percent`, `percent-decimal`, `seconds`, `duration`, `phone`, `boolean`, `number`

```typescript
// Custom format
table.formatter.register('risk', (value) => {
    const span = document.createElement('span');
    span.style.color = value === 'high' ? 'red' : 'green';
    span.textContent = value;
    return span;
});
```

#### Sorter

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
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return (order[a] ?? 99) - (order[b] ?? 99);
});
```

#### ColumnManager

```typescript
// Via DataTable
table.columnManager.mountPanel('#settings-panel', '#settings-btn');

// Standalone
import { ColumnManager } from '@maxbrennemann/js-functions/tables';
const cm = new ColumnManager(columns, { storageKey: 'my-table-cols' });
cm.toggle('email');
cm.reorder(['name', 'date', 'amount']);
```

#### IconResolver

Built-in icons: `edit`, `delete`, `save`, `add`, `check`, `move`, `chevron-down`, `chevron-up`, `sort-asc`, `sort-desc`, `sort-none`, `eye`, `link`, `settings`

```typescript
// Lucide (npm install lucide)
import * as lucide from 'lucide';
table.icons.useLucide(lucide);
{ icon: 'pencil' }  // any Lucide icon name

// Custom SVG path
table.icons.register('archive', 'M20.54 5.23L19.15…');
{ icon: 'archive' }

// Raw SVG string still works
{ icon: '<svg>…</svg>' }
```

#### Events

```typescript
table.on('row:click',      ({ row, element, event }) => { … });
table.on('row:dblclick',   ({ row, element, event }) => { … });
table.on('row:action',     ({ action, row, element }) => { … });
table.on('sort:change',    ({ column, direction })    => { … });
table.on('columns:change', ({ columns })              => { … });
table.on('data:change',    ({ data })                 => { … });
table.on('render:complete',({ rowCount })             => { … });
```

#### TableConfig reference

```typescript
interface TableConfig {
    columns:        ColumnDef[];
    actions?:       ActionDef[];
    sortable?:      boolean;         // default: true
    defaultSort?:   SortState;
    footer?:        boolean;         // default: false
    stripedRows?:   boolean;         // default: true
    cssPrefix?:     string;          // default: 'tw:'
    primaryKey?:    string;          // default: 'id'
    persistColumns?:string;          // localStorage key
    emptyMessage?:  string;          // default: 'Keine Daten verfügbar.'
    tableClassName?:string;
    onSort?:        (col: string, dir: SortDirection) => void;
    styles?: {
        headerBg?:  string;          // default: 'bg-[#83a9cd]'
        footerBg?:  string;          // default: 'bg-[#d3dce3]'
        rowEven?:   string;          // default: 'bg-gray-100'
        rowOdd?:    string;          // default: 'bg-gray-200'
        rowHover?:  string;          // default: 'hover:bg-gray-300'
    };
}
```

---

## Development

```bash
npm install
npm run build       # build all modules to dist/
npm run dev         # watch mode
npm run typecheck   # type-check without emitting
```

Source is in `src/`, output goes to `dist/` (ESM + CJS + `.d.ts` for every module).

## Release

```bash
# 1. Bump version in package.json
# 2. Commit and tag
git add -A
git commit -m "v0.7"
git tag v0.7
git push && git push --tags
```

`prepare` runs `npm run build` automatically when someone installs the package via git URL — no pre-built `dist/` needs to be committed.
