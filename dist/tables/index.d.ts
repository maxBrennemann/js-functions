/**
 * ============================================================
 *  @your-scope/datatable — Type Definitions
 * ============================================================
 */
/** Custom format function — receives cell value + full row, returns string or DOM element */
type FormatFn = (value: any, row?: TableRow) => string | HTMLElement;
/** Custom summary function — receives all column values + all rows */
type SummaryFn = (values: any[], rows: TableRow[]) => string | number;
interface ColumnDef {
    /** Unique key matching the data property */
    key: string;
    /** Display label in the header */
    label: string;
    /** Whether the column is visible (default: true) */
    visible?: boolean;
    /** Whether the column is sortable (default: true) */
    sortable?: boolean;
    /**
     * Built-in format name or custom format function.
     * Built-ins: 'date', 'datetime', 'currency', 'percent', 'seconds', 'duration', 'phone'
     */
    format?: string | FormatFn;
    /**
     * Footer summary aggregation.
     * Built-ins: 'sum', 'count', 'avg'
     * Or pass a custom SummaryFn.
     */
    summary?: 'sum' | 'count' | 'avg' | SummaryFn;
    /** Optional static label shown in the footer instead of a computed value */
    summaryLabel?: string;
    /** Extra CSS classes applied to all cells in this column (th, td, tfoot td) */
    className?: string;
    /** Extra CSS classes applied only to the header cell */
    headerClassName?: string;
    /**
     * If set, the cell content is wrapped in a function that returns an HTMLElement.
     * Useful for rendering links, badges, icons, etc.
     */
    render?: (value: any, row: TableRow, cell: HTMLTableCellElement) => HTMLElement | string | void;
}
interface ActionDef {
    /** Unique name for this action */
    name: string;
    /** Label / tooltip text */
    label?: string;
    /**
     * Icon definition — either a Lucide icon name ('pencil', 'trash-2')
     * or raw SVG string.
     */
    icon: string;
    /** CSS classes for the button wrapper */
    className?: string;
    /** Click handler — receives the row data and the <tr> element */
    onClick: (row: TableRow, rowEl: HTMLTableRowElement, e: MouseEvent) => void;
    /** Conditionally show/hide this action per row */
    visible?: (row: TableRow) => boolean;
    /** If true, shows a confirm() dialog before calling onClick */
    confirm?: string | boolean;
}
type SortDirection = 'asc' | 'desc';
interface SortState {
    column: string;
    direction: SortDirection;
}
interface TableConfig {
    /** Column definitions */
    columns: ColumnDef[];
    /** Row action buttons */
    actions?: ActionDef[];
    /** Enable client-side sorting (default: true) */
    sortable?: boolean;
    /** Initial sort state */
    defaultSort?: SortState;
    /** Show footer with summary row (default: false) */
    footer?: boolean;
    /** Alternating row colors (default: true) */
    stripedRows?: boolean;
    /**
     * CSS class prefix. Supports Tailwind prefixed mode.
     * Default: 'tw:' (set to '' for plain Tailwind)
     */
    cssPrefix?: string;
    /**
     * localStorage key for persisting column visibility.
     * If omitted, column settings are not persisted.
     */
    persistColumns?: string;
    /**
     * Hook for server-side sorting.
     * When provided, client-side sorting is skipped and this callback is called instead.
     */
    onSort?: (column: string, direction: SortDirection) => void;
    /**
     * Primary key field in row data. Used for row identification (data-id attribute).
     * Default: 'id'
     */
    primaryKey?: string;
    /** Message shown when data is empty */
    emptyMessage?: string;
    /** Extra CSS classes on the <table> element */
    tableClassName?: string;
    /** Style overrides for different table sections */
    styles?: {
        headerBg?: string;
        footerBg?: string;
        rowEven?: string;
        rowOdd?: string;
        rowHover?: string;
    };
}
interface TableEventMap {
    'row:click': {
        row: TableRow;
        element: HTMLTableRowElement;
        event: MouseEvent;
    };
    'row:dblclick': {
        row: TableRow;
        element: HTMLTableRowElement;
        event: MouseEvent;
    };
    'row:action': {
        action: string;
        row: TableRow;
        element: HTMLTableRowElement;
    };
    'sort:change': {
        column: string;
        direction: SortDirection;
    };
    'columns:change': {
        columns: ColumnDef[];
    };
    'data:change': {
        data: TableRow[];
    };
    'render:complete': {
        rowCount: number;
    };
}
type TableEventCallback<K extends keyof TableEventMap> = (detail: TableEventMap[K]) => void;
type TableRow = Record<string, any>;

/**
 * ============================================================
 *  EventEmitter — Typed event bus for DataTable
 * ============================================================
 *
 * Lightweight pub/sub. Supports `.on()`, `.off()`, `.once()`, `.emit()`.
 */

declare class EventEmitter {
    private _listeners;
    /**
     * Subscribe to an event.
     */
    on<K extends keyof TableEventMap>(event: K, callback: TableEventCallback<K>): this;
    /**
     * Subscribe to an event, but only fire once.
     */
    once<K extends keyof TableEventMap>(event: K, callback: TableEventCallback<K>): this;
    /**
     * Unsubscribe from an event.
     */
    off<K extends keyof TableEventMap>(event: K, callback: TableEventCallback<K>): this;
    /**
     * Emit an event with payload.
     */
    protected emit<K extends keyof TableEventMap>(event: K, detail: TableEventMap[K]): void;
    /**
     * Remove all listeners, optionally for a specific event.
     */
    removeAllListeners(event?: keyof TableEventMap): this;
}

/**
 * ============================================================
 *  Formatter — Pluggable value formatting
 * ============================================================
 *
 * Ships with common built-in formats (date, currency, percent, …).
 * Custom formats can be registered at runtime via `.register()`.
 *
 * Usage:
 *   const fmt = new Formatter();
 *   fmt.format(1234.5, 'currency');     // "1.234,50 €"
 *   fmt.format(0.85, 'percent');        // "85 %"
 *   fmt.register('badge', v => …);      // custom
 */

declare class Formatter {
    private formats;
    constructor(locale?: string, currency?: string);
    /**
     * Register a named format function.
     * Overwrites existing formats with the same name.
     */
    register(name: string, fn: FormatFn): this;
    /**
     * Check if a format is registered.
     */
    has(name: string): boolean;
    /**
     * Format a value.
     *
     * @param value    - The raw cell value
     * @param format   - A registered format name OR a custom function
     * @param row      - The full row data (passed to custom functions)
     */
    format(value: any, format?: string | FormatFn, row?: TableRow): string | HTMLElement;
    /**
     * Get list of all registered format names.
     */
    getRegistered(): string[];
    private registerBuiltins;
}

/**
 * ============================================================
 *  Sorter — Client-side table sorting
 * ============================================================
 *
 * Handles:
 *   - Sort state management (column + direction)
 *   - Type-aware comparison (numbers, dates, strings)
 *   - Toggling sort direction on repeated clicks
 *   - Optional server-side delegation via callback
 *
 * Usage:
 *   const sorter = new Sorter({ column: 'date', direction: 'desc' });
 *   const sorted = sorter.sort(data, 'date');  // toggles direction
 *   sorter.getState();  // { column: 'date', direction: 'asc' }
 */

type SortCompareFn = (a: any, b: any, direction: SortDirection) => number;
declare class Sorter {
    private state;
    private onSortCallback?;
    private customComparers;
    constructor(defaultSort?: SortState, onSort?: (column: string, direction: SortDirection) => void);
    /**
     * Get current sort state.
     */
    getState(): SortState | null;
    /**
     * Set sort state without sorting data.
     */
    setState(state: SortState | null): void;
    /**
     * Register a custom comparer for a specific column.
     */
    registerComparer(column: string, fn: SortCompareFn): this;
    /**
     * Sort data by column. Toggles direction if same column is clicked again.
     *
     * If `onSort` callback was provided (server-side mode), the data
     * is NOT sorted locally — only the callback is invoked.
     *
     * @returns The sorted array (or original array in server-side mode)
     */
    sort(data: TableRow[], column: string): TableRow[];
    /**
     * Sort data without changing state (e.g., for initial render with defaultSort).
     */
    applyCurrentSort(data: TableRow[]): TableRow[];
    private sortData;
    /**
     * Smart comparison: handles null, numbers, dates, strings.
     */
    private compare;
    /**
     * Heuristic: does a string look like a date?
     * Avoids false positives for plain numbers that Date.parse() accepts.
     */
    private looksLikeDate;
}

/**
 * ============================================================
 *  ColumnManager — Column visibility, order & persistence
 * ============================================================
 *
 * Manages which columns are visible, their order, and optionally
 * persists settings to localStorage.
 *
 * Can render a toggle-panel UI that lets users show/hide columns
 * at runtime (similar to the colSettings pattern in the original code).
 *
 * Usage standalone:
 *   const cm = new ColumnManager(columns, 'my-table-cols');
 *   cm.toggle('status');         // flip visibility
 *   cm.getVisible();             // only visible ColumnDefs
 *   cm.mountPanel('#settings');  // render checkboxes UI
 *
 * Integrated with DataTable:
 *   table.columnManager.mountPanel('#settings');
 */

interface ColumnManagerOptions {
    /** localStorage key for persisting settings. Omit to disable persistence. */
    storageKey?: string;
    /** Callback fired whenever column visibility or order changes. */
    onChange?: (columns: ColumnDef[]) => void;
    /** CSS prefix (default: 'tw:') */
    cssPrefix?: string;
    /** Label for the save button */
    labelSave?: string;
    /** Label for the cancel button */
    labelCancel?: string;
    /** Label for the "select all" checkbox */
    labelSelectAll?: string;
    /** Title shown at the top of the panel */
    panelTitle?: string;
}
declare class ColumnManager {
    private columns;
    private options;
    private panelEl;
    constructor(columns: ColumnDef[], options?: ColumnManagerOptions);
    /**
     * Get all columns (visible + hidden).
     */
    getAll(): ColumnDef[];
    /**
     * Get only visible columns, in order.
     */
    getVisible(): ColumnDef[];
    /**
     * Get only hidden columns.
     */
    getHidden(): ColumnDef[];
    /**
     * Set visibility for a specific column.
     */
    setVisibility(key: string, visible: boolean): this;
    /**
     * Toggle visibility for a specific column.
     */
    toggle(key: string): this;
    /**
     * Show all columns.
     */
    showAll(): this;
    /**
     * Reorder columns. Pass an array of keys in the desired order.
     * Keys not in the array are appended at the end.
     */
    reorder(keyOrder: string[]): this;
    /**
     * Reset to initial column definitions (before any user changes).
     */
    reset(initialColumns: ColumnDef[]): this;
    /**
     * Render a column-toggle panel into a container.
     * The panel shows checkboxes for each column + save/cancel buttons.
     *
     * @param container  CSS selector or HTMLElement
     * @param trigger    Optional: CSS selector or HTMLElement that toggles the panel
     */
    mountPanel(container: string | HTMLElement, trigger?: string | HTMLElement): this;
    /** Show the panel */
    showPanel(): void;
    /** Hide the panel */
    hidePanel(): void;
    private renderPanel;
    private createCheckboxRow;
    /** Sync checkbox states with current column visibility */
    private syncCheckboxes;
    /** Read checkbox states and apply to columns */
    private applyFromCheckboxes;
    private saveToStorage;
    private loadFromStorage;
    private clearStorage;
}

/**
 * ============================================================
 *  IconResolver — Pluggable icon system
 * ============================================================
 *
 * Resolves icon identifiers to SVG elements. Supports:
 *   1. Raw SVG strings (pass-through)
 *   2. Built-in mini icons (edit, delete, etc.)
 *   3. Lucide icons (if lucide library is loaded)
 *   4. Custom resolvers (register your own icon source)
 *
 * Usage:
 *   const icons = new IconResolver();
 *
 *   // Use built-in
 *   icons.resolve('edit');        // returns <svg>...</svg> string
 *
 *   // Use Lucide (must be installed: npm i lucide)
 *   icons.useLucide(lucide);
 *   icons.resolve('pencil');      // Lucide pencil icon
 *
 *   // Use custom
 *   icons.register('star', '<svg>...</svg>');
 *   icons.resolve('star');
 */
type IconResolverFn = (name: string, size?: number) => string | null;
interface IconOptions {
    /** Icon width/height in px (default: 15) */
    size?: number;
    /** CSS class(es) applied to SVG elements */
    className?: string;
    /** Fill color for built-in icons (default: 'white') */
    fill?: string;
}
declare class IconResolver {
    private customIcons;
    private resolverFn;
    private defaultOptions;
    constructor(options?: IconOptions);
    /**
     * Resolve an icon identifier to an SVG string.
     *
     * Resolution order:
     *   1. Raw SVG (starts with `<svg` or `<path`)
     *   2. Custom registered icons
     *   3. External resolver (e.g., Lucide)
     *   4. Built-in icons
     *   5. Text fallback
     */
    resolve(icon: string, options?: IconOptions): string;
    /**
     * Register a custom icon by name.
     * Pass either a full SVG string or just the inner <path> content.
     */
    register(name: string, svg: string): this;
    /**
     * Register multiple icons at once.
     */
    registerAll(icons: Record<string, string>): this;
    /**
     * Set an external resolver function (e.g., for Lucide integration).
     */
    setResolver(fn: IconResolverFn): this;
    /**
     * Integrate with the Lucide icon library.
     *
     * Usage:
     *   import * as lucide from 'lucide';
     *   icons.useLucide(lucide);
     *
     * Or with lucide-static:
     *   import { icons } from 'lucide-static';
     *   icons.useLucideStatic(icons);
     */
    useLucide(lucideModule: any): this;
    /**
     * Integrate with lucide-static (pre-built SVG strings).
     *
     * Usage:
     *   import { Pencil, Trash2 } from 'lucide-static';
     *   icons.registerAll({ edit: Pencil, delete: Trash2 });
     */
    private registerBuiltins;
    /**
     * Wrap a path data string into a full SVG element.
     */
    private wrapSvg;
}

/**
 * ============================================================
 *  DataTable — Main orchestrator class
 * ============================================================
 *
 * Composes Formatter, Sorter, EventEmitter into a single API.
 * Renders a full HTML table from config + data.
 *
 * Usage:
 *   const table = new DataTable({
 *     columns: [
 *       { key: 'name', label: 'Name' },
 *       { key: 'amount', label: 'Betrag', format: 'currency', summary: 'sum' },
 *     ],
 *     footer: true,
 *     defaultSort: { column: 'name', direction: 'asc' },
 *   });
 *
 *   table.mount('#container').setData(myData);
 */

declare class DataTable extends EventEmitter {
    private config;
    private data;
    private sortedData;
    private tableEl;
    private theadEl;
    private tbodyEl;
    private tfootEl;
    private containerEl;
    readonly formatter: Formatter;
    readonly sorter: Sorter;
    readonly columnManager: ColumnManager;
    readonly icons: IconResolver;
    private styles;
    constructor(config: TableConfig);
    /**
     * Mount the table into a DOM container.
     * Accepts a CSS selector string or an HTMLElement.
     */
    mount(container: string | HTMLElement): this;
    /**
     * Set (or replace) the table data and re-render.
     */
    setData(data: TableRow[]): this;
    /**
     * Get current data (unsorted).
     */
    getData(): TableRow[];
    /**
     * Add a single row and re-render.
     */
    addRow(row: TableRow): this;
    /**
     * Update a row by primary key and re-render.
     */
    updateRow(key: any, updates: Partial<TableRow>): this;
    /**
     * Remove a row by primary key and re-render.
     */
    removeRow(key: any): this;
    /**
     * Update column visibility at runtime.
     */
    setColumnVisibility(key: string, visible: boolean): this;
    /**
     * Get visible columns.
     */
    getVisibleColumns(): ColumnDef[];
    /**
     * Completely destroy the table and clean up.
     */
    destroy(): void;
    /**
     * Force a full re-render.
     */
    refresh(): this;
    private createTableElement;
    private render;
    private renderHeader;
    private renderBody;
    private renderFooter;
    private handleSort;
    private createSortIndicator;
    private createActionCell;
    /**
     * Resolve icon via IconResolver.
     */
    private resolveIcon;
    private computeSummary;
    private applyBottomRounding;
}

export { type ActionDef, type ColumnDef, ColumnManager, type ColumnManagerOptions, DataTable, EventEmitter, type FormatFn, Formatter, type IconOptions, IconResolver, type IconResolverFn, type SortDirection, type SortState, Sorter, type SummaryFn, type TableConfig, type TableEventCallback, type TableEventMap, type TableRow };
