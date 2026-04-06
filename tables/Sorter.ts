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

import type { SortState, SortDirection, TableRow } from './types';

export type SortCompareFn = (a: any, b: any, direction: SortDirection) => number;

export class Sorter {
    private state: SortState | null;
    private onSortCallback?: (column: string, direction: SortDirection) => void;
    private customComparers = new Map<string, SortCompareFn>();

    constructor(
        defaultSort?: SortState,
        onSort?: (column: string, direction: SortDirection) => void,
    ) {
        this.state = defaultSort ?? null;
        this.onSortCallback = onSort;
    }

    /* ------------------------------------------------------ */
    /*  Public API                                             */
    /* ------------------------------------------------------ */

    /**
     * Get current sort state.
     */
    getState(): SortState | null {
        return this.state ? { ...this.state } : null;
    }

    /**
     * Set sort state without sorting data.
     */
    setState(state: SortState | null): void {
        this.state = state;
    }

    /**
     * Register a custom comparer for a specific column.
     */
    registerComparer(column: string, fn: SortCompareFn): this {
        this.customComparers.set(column, fn);
        return this;
    }

    /**
     * Sort data by column. Toggles direction if same column is clicked again.
     *
     * If `onSort` callback was provided (server-side mode), the data
     * is NOT sorted locally — only the callback is invoked.
     *
     * @returns The sorted array (or original array in server-side mode)
     */
    sort(data: TableRow[], column: string): TableRow[] {
        /* Toggle or set direction */
        if (this.state?.column === column) {
            this.state.direction = this.state.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.state = { column, direction: 'asc' };
        }

        /* Server-side mode: delegate */
        if (this.onSortCallback) {
            this.onSortCallback(this.state.column, this.state.direction);
            return data;
        }

        /* Client-side sort */
        return this.sortData(data, this.state.column, this.state.direction);
    }

    /**
     * Sort data without changing state (e.g., for initial render with defaultSort).
     */
    applyCurrentSort(data: TableRow[]): TableRow[] {
        if (!this.state) return data;
        if (this.onSortCallback) return data;
        return this.sortData(data, this.state.column, this.state.direction);
    }

    /* ------------------------------------------------------ */
    /*  Internal                                               */
    /* ------------------------------------------------------ */

    private sortData(data: TableRow[], column: string, direction: SortDirection): TableRow[] {
        const customComparer = this.customComparers.get(column);

        return [...data].sort((a, b) => {
            const valA = a[column];
            const valB = b[column];

            let result: number;

            if (customComparer) {
                result = customComparer(valA, valB, direction);
            } else {
                result = this.compare(valA, valB);
            }

            return direction === 'asc' ? result : -result;
        });
    }

    /**
     * Smart comparison: handles null, numbers, dates, strings.
     */
    private compare(a: any, b: any): number {
        /* Nulls go last */
        if (a == null && b == null) return 0;
        if (a == null) return 1;
        if (b == null) return -1;

        /* Both numbers */
        const numA = Number(a);
        const numB = Number(b);
        if (!isNaN(numA) && !isNaN(numB) && a !== '' && b !== '') {
            return numA - numB;
        }

        /* Both look like dates (ISO string or Date-parseable) */
        if (typeof a === 'string' && typeof b === 'string') {
            const dateA = Date.parse(a);
            const dateB = Date.parse(b);
            if (!isNaN(dateA) && !isNaN(dateB) && this.looksLikeDate(a) && this.looksLikeDate(b)) {
                return dateA - dateB;
            }
        }

        /* String comparison */
        return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
    }

    /**
     * Heuristic: does a string look like a date?
     * Avoids false positives for plain numbers that Date.parse() accepts.
     */
    private looksLikeDate(str: string): boolean {
        return /\d{4}-\d{2}-\d{2}/.test(str) || /\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4}/.test(str);
    }
}
