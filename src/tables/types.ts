/**
 * ============================================================
 *  @your-scope/datatable — Type Definitions
 * ============================================================
 */

/* ---------------------------------------------------------- */
/*  Column Definition                                          */
/* ---------------------------------------------------------- */

/** Custom format function — receives cell value + full row, returns string or DOM element */
export type FormatFn = (value: any, row?: TableRow) => string | HTMLElement;

/** Custom summary function — receives all column values + all rows */
export type SummaryFn = (values: any[], rows: TableRow[]) => string | number;

export interface ColumnDef {
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

/* ---------------------------------------------------------- */
/*  Action Buttons                                             */
/* ---------------------------------------------------------- */

export interface ActionDef {
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

/* ---------------------------------------------------------- */
/*  Sort                                                       */
/* ---------------------------------------------------------- */

export type SortDirection = 'asc' | 'desc';

export interface SortState {
    column: string;
    direction: SortDirection;
}

/* ---------------------------------------------------------- */
/*  Table Config                                               */
/* ---------------------------------------------------------- */

export interface TableConfig {
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

/* ---------------------------------------------------------- */
/*  Events                                                     */
/* ---------------------------------------------------------- */

export interface TableEventMap {
    'row:click': { row: TableRow; element: HTMLTableRowElement; event: MouseEvent };
    'row:dblclick': { row: TableRow; element: HTMLTableRowElement; event: MouseEvent };
    'row:action': { action: string; row: TableRow; element: HTMLTableRowElement };
    'sort:change': { column: string; direction: SortDirection };
    'columns:change': { columns: ColumnDef[] };
    'data:change': { data: TableRow[] };
    'render:complete': { rowCount: number };
}

export type TableEventCallback<K extends keyof TableEventMap> = (detail: TableEventMap[K]) => void;

/* ---------------------------------------------------------- */
/*  Utility Types                                              */
/* ---------------------------------------------------------- */

export type TableRow = Record<string, any>;
