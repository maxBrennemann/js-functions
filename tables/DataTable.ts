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

import { EventEmitter } from './EventEmitter';
import { Formatter } from './Formatter';
import { Sorter } from './Sorter';
import { ColumnManager } from './ColumnManager';
import { IconResolver } from './IconResolver';
import type {
    TableConfig,
    TableRow,
    ColumnDef,
    ActionDef,
    SortDirection,
    SummaryFn,
} from './types';

/* Default styles — can be overridden via config.styles */
const DEFAULT_STYLES = {
    headerBg: 'bg-[#83a9cd]',
    footerBg: 'bg-[#d3dce3]',
    rowEven: 'bg-gray-100',
    rowOdd: 'bg-gray-200',
    rowHover: 'hover:bg-gray-300',
};

export class DataTable extends EventEmitter {
    private config: Required<
        Pick<TableConfig, 'columns' | 'sortable' | 'footer' | 'stripedRows' | 'cssPrefix' | 'primaryKey' | 'emptyMessage'>
    > & TableConfig;

    private data: TableRow[] = [];
    private sortedData: TableRow[] = [];

    private tableEl!: HTMLTableElement;
    private theadEl!: HTMLTableSectionElement;
    private tbodyEl!: HTMLTableSectionElement;
    private tfootEl: HTMLTableSectionElement | null = null;
    private containerEl: HTMLElement | null = null;

    readonly formatter: Formatter;
    readonly sorter: Sorter;
    readonly columnManager: ColumnManager;
    readonly icons: IconResolver;

    private styles: Required<NonNullable<TableConfig['styles']>>;

    constructor(config: TableConfig) {
        super();

        this.config = {
            sortable: true,
            footer: false,
            stripedRows: true,
            cssPrefix: 'tw:',
            primaryKey: 'id',
            emptyMessage: 'Keine Daten verfügbar.',
            ...config,
        };

        this.formatter = new Formatter();
        this.sorter = new Sorter(config.defaultSort, config.onSort);
        this.icons = new IconResolver();

        this.columnManager = new ColumnManager(config.columns, {
            storageKey: config.persistColumns,
            cssPrefix: this.config.cssPrefix,
            onChange: (cols) => {
                this.render();
                this.emit('columns:change', { columns: cols });
            },
        });

        this.styles = { ...DEFAULT_STYLES, ...config.styles };
    }

    /* ====================================================== */
    /*  Public API                                             */
    /* ====================================================== */

    /**
     * Mount the table into a DOM container.
     * Accepts a CSS selector string or an HTMLElement.
     */
    mount(container: string | HTMLElement): this {
        const el = typeof container === 'string'
            ? document.querySelector<HTMLElement>(container)
            : container;

        if (!el) {
            throw new Error(`[DataTable] Container not found: ${container}`);
        }

        this.containerEl = el;
        this.createTableElement();
        el.appendChild(this.tableEl);

        return this;
    }

    /**
     * Set (or replace) the table data and re-render.
     */
    setData(data: TableRow[]): this {
        this.data = [...data];
        this.sortedData = this.sorter.applyCurrentSort(this.data);
        this.render();
        this.emit('data:change', { data: this.data });
        return this;
    }

    /**
     * Get current data (unsorted).
     */
    getData(): TableRow[] {
        return [...this.data];
    }

    /**
     * Add a single row and re-render.
     */
    addRow(row: TableRow): this {
        this.data.push(row);
        this.sortedData = this.sorter.applyCurrentSort(this.data);
        this.render();
        this.emit('data:change', { data: this.data });
        return this;
    }

    /**
     * Update a row by primary key and re-render.
     */
    updateRow(key: any, updates: Partial<TableRow>): this {
        const pk = this.config.primaryKey;
        const idx = this.data.findIndex(r => r[pk] === key);
        if (idx === -1) {
            console.warn(`[DataTable] Row with ${pk}=${key} not found.`);
            return this;
        }
        this.data[idx] = { ...this.data[idx], ...updates };
        this.sortedData = this.sorter.applyCurrentSort(this.data);
        this.render();
        this.emit('data:change', { data: this.data });
        return this;
    }

    /**
     * Remove a row by primary key and re-render.
     */
    removeRow(key: any): this {
        const pk = this.config.primaryKey;
        this.data = this.data.filter(r => r[pk] !== key);
        this.sortedData = this.sorter.applyCurrentSort(this.data);
        this.render();
        this.emit('data:change', { data: this.data });
        return this;
    }

    /**
     * Update column visibility at runtime.
     */
    setColumnVisibility(key: string, visible: boolean): this {
        this.columnManager.setVisibility(key, visible);
        return this;
    }

    /**
     * Get visible columns.
     */
    getVisibleColumns(): ColumnDef[] {
        return this.columnManager.getVisible();
    }

    /**
     * Completely destroy the table and clean up.
     */
    destroy(): void {
        this.removeAllListeners();
        if (this.tableEl && this.containerEl) {
            this.containerEl.removeChild(this.tableEl);
        }
    }

    /**
     * Force a full re-render.
     */
    refresh(): this {
        this.render();
        return this;
    }

    /* ====================================================== */
    /*  Rendering                                              */
    /* ====================================================== */

    private createTableElement(): void {
        this.tableEl = document.createElement('table');
        this.theadEl = document.createElement('thead');
        this.tbodyEl = document.createElement('tbody');

        const p = this.config.cssPrefix;
        this.tableEl.className = `${p}w-full ${p}border-collapse ${this.config.tableClassName ?? ''}`.trim();

        this.tableEl.appendChild(this.theadEl);
        this.tableEl.appendChild(this.tbodyEl);
    }

    private render(): void {
        const visibleCols = this.getVisibleColumns();

        this.renderHeader(visibleCols);
        this.renderBody(visibleCols);

        /* Footer */
        if (this.tfootEl) {
            this.tableEl.removeChild(this.tfootEl);
            this.tfootEl = null;
        }
        if (this.config.footer) {
            this.renderFooter(visibleCols);
        }

        this.emit('render:complete', { rowCount: this.sortedData.length });
    }

    /* ---- Header ---- */

    private renderHeader(columns: ColumnDef[]): void {
        const p = this.config.cssPrefix;
        this.theadEl.innerHTML = '';

        const tr = document.createElement('tr');

        const hasActions = (this.config.actions?.length ?? 0) > 0;
        const allCols = hasActions
            ? [...columns, { key: '__actions', label: 'Aktionen', sortable: false } as ColumnDef]
            : columns;

        allCols.forEach((col, idx) => {
            const th = document.createElement('th');
            th.className = [
                `${p}text-black`,
                `${p}font-semibold`,
                `${p}text-left`,
                `${p}px-2`,
                `${p}py-2`,
                `${p}text-[12px]`,
                `${p}${this.styles.headerBg}`,
                col.headerClassName ?? '',
            ].filter(Boolean).join(' ');

            th.dataset.key = col.key;
            th.textContent = col.label;

            /* Rounded corners on first/last header cell */
            if (idx === 0) th.classList.add(`${p}rounded-tl-lg`);
            if (idx === allCols.length - 1) th.classList.add(`${p}rounded-tr-lg`);

            /* Sortable */
            if (this.config.sortable && col.sortable !== false && col.key !== '__actions') {
                th.style.cursor = 'pointer';
                th.appendChild(this.createSortIndicator(col.key));
                th.addEventListener('click', () => this.handleSort(col.key));
            }

            tr.appendChild(th);
        });

        this.theadEl.appendChild(tr);
    }

    /* ---- Body ---- */

    private renderBody(columns: ColumnDef[]): void {
        const p = this.config.cssPrefix;
        this.tbodyEl.innerHTML = '';

        if (this.sortedData.length === 0) {
            const tr = document.createElement('tr');
            tr.className = `${p}bg-gray-100`;
            const td = document.createElement('td');
            const totalCols = columns.length + ((this.config.actions?.length ?? 0) > 0 ? 1 : 0);
            td.colSpan = totalCols;
            td.className = `${p}p-4 ${p}text-center ${p}text-gray-500`;
            td.textContent = this.config.emptyMessage;
            tr.appendChild(td);
            this.tbodyEl.appendChild(tr);
            return;
        }

        const hasActions = (this.config.actions?.length ?? 0) > 0;

        this.sortedData.forEach((row, idx) => {
            const tr = document.createElement('tr');

            /* Striped rows */
            const rowBg = this.config.stripedRows
                ? (idx % 2 === 0 ? this.styles.rowEven : this.styles.rowOdd)
                : this.styles.rowEven;
            tr.className = `${p}${rowBg} ${p}${this.styles.rowHover}`;

            /* Primary key as data attribute */
            const pk = this.config.primaryKey;
            if (row[pk] != null) {
                tr.dataset.id = String(row[pk]);
            }

            /* Data cells */
            columns.forEach(col => {
                const td = document.createElement('td');
                td.className = `${p}p-2 ${col.className ?? ''}`.trim();

                const rawValue = row[col.key];

                /* Custom render function takes priority */
                if (col.render) {
                    const result = col.render(rawValue, row, td);
                    if (result instanceof HTMLElement) {
                        td.appendChild(result);
                    } else if (typeof result === 'string') {
                        td.textContent = result;
                    }
                    /* void = render function handled it via td reference */
                } else {
                    const formatted = this.formatter.format(rawValue, col.format, row);
                    if (formatted instanceof HTMLElement) {
                        td.appendChild(formatted);
                    } else {
                        td.textContent = formatted;
                    }
                }

                tr.appendChild(td);
            });

            /* Action buttons */
            if (hasActions) {
                tr.appendChild(this.createActionCell(row, tr));
            }

            /* Row click events */
            tr.addEventListener('click', (e) => {
                this.emit('row:click', { row, element: tr, event: e });
            });
            tr.addEventListener('dblclick', (e) => {
                this.emit('row:dblclick', { row, element: tr, event: e });
            });

            this.tbodyEl.appendChild(tr);
        });

        /* Rounded bottom corners if no footer */
        if (!this.config.footer && this.tbodyEl.lastElementChild) {
            this.applyBottomRounding(this.tbodyEl.lastElementChild as HTMLTableRowElement);
        }
    }

    /* ---- Footer ---- */

    private renderFooter(columns: ColumnDef[]): void {
        const p = this.config.cssPrefix;
        this.tfootEl = document.createElement('tfoot');

        const tr = document.createElement('tr');

        const hasActions = (this.config.actions?.length ?? 0) > 0;
        const allCols = hasActions
            ? [...columns, { key: '__actions', label: '' } as ColumnDef]
            : columns;

        allCols.forEach((col, idx) => {
            const td = document.createElement('td');
            td.className = [
                `${p}text-black`,
                `${p}font-semibold`,
                `${p}text-left`,
                `${p}px-2`,
                `${p}py-2`,
                `${p}text-[12px]`,
                `${p}${this.styles.footerBg}`,
            ].join(' ');

            if (idx === 0) td.classList.add(`${p}rounded-bl-lg`);
            if (idx === allCols.length - 1) td.classList.add(`${p}rounded-br-lg`);

            if (col.summaryLabel) {
                td.textContent = col.summaryLabel;
            } else if (col.summary) {
                td.textContent = String(this.computeSummary(col));
            }

            tr.appendChild(td);
        });

        this.tfootEl.appendChild(tr);
        this.tableEl.appendChild(this.tfootEl);
    }

    /* ====================================================== */
    /*  Sorting                                                */
    /* ====================================================== */

    private handleSort(column: string): void {
        this.sortedData = this.sorter.sort(this.data, column);
        const state = this.sorter.getState()!;
        this.render();
        this.emit('sort:change', { column: state.column, direction: state.direction });
    }

    private createSortIndicator(column: string): HTMLSpanElement {
        const span = document.createElement('span');
        span.className = 'sort-indicator';
        span.style.marginLeft = '4px';
        span.style.fontSize = '10px';
        span.style.opacity = '0.5';

        const state = this.sorter.getState();
        if (state?.column === column) {
            span.textContent = state.direction === 'asc' ? '▲' : '▼';
            span.style.opacity = '1';
        } else {
            span.textContent = '⇅';
        }

        return span;
    }

    /* ====================================================== */
    /*  Actions                                                */
    /* ====================================================== */

    private createActionCell(row: TableRow, tr: HTMLTableRowElement): HTMLTableCellElement {
        const p = this.config.cssPrefix;
        const td = document.createElement('td');
        td.className = `${p}p-2`;

        const wrapper = document.createElement('div');
        wrapper.className = `${p}flex ${p}gap-1`;

        (this.config.actions ?? []).forEach(action => {
            /* Conditional visibility */
            if (action.visible && !action.visible(row)) return;

            const btn = document.createElement('button');
            btn.className = [
                `${p}inline-flex`,
                `${p}items-center`,
                `${p}justify-center`,
                `${p}p-1`,
                `${p}rounded-md`,
                `${p}cursor-pointer`,
                `${p}border-0`,
                action.className ?? '',
            ].filter(Boolean).join(' ');

            btn.title = action.label ?? action.name;
            btn.innerHTML = this.resolveIcon(action.icon);

            btn.addEventListener('click', (e) => {
                e.stopPropagation(); /* don't trigger row:click */

                if (action.confirm) {
                    const msg = typeof action.confirm === 'string'
                        ? action.confirm
                        : `Aktion "${action.name}" wirklich ausführen?`;
                    if (!confirm(msg)) return;
                }

                action.onClick(row, tr, e);
                this.emit('row:action', { action: action.name, row, element: tr });
            });

            wrapper.appendChild(btn);
        });

        td.appendChild(wrapper);
        return td;
    }

    /**
     * Resolve icon via IconResolver.
     */
    private resolveIcon(icon: string): string {
        return this.icons.resolve(icon);
    }

    /* ====================================================== */
    /*  Summary Computation                                    */
    /* ====================================================== */

    private computeSummary(col: ColumnDef): string | number {
        const values = this.data.map(row => row[col.key]);

        if (typeof col.summary === 'function') {
            return (col.summary as SummaryFn)(values, this.data);
        }

        const numericValues = values
            .map(v => typeof v === 'string' ? parseFloat(v) : v)
            .filter(v => typeof v === 'number' && !isNaN(v));

        switch (col.summary) {
            case 'sum': {
                const sum = numericValues.reduce((acc, v) => acc + v, 0);
                /* Apply same format as column if it exists */
                if (col.format && typeof col.format === 'string') {
                    const formatted = this.formatter.format(sum, col.format);
                    return typeof formatted === 'string' ? formatted : String(sum);
                }
                return sum;
            }
            case 'count':
                return values.filter(v => v != null && v !== '').length;
            case 'avg': {
                if (numericValues.length === 0) return 0;
                const avg = numericValues.reduce((acc, v) => acc + v, 0) / numericValues.length;
                if (col.format && typeof col.format === 'string') {
                    const formatted = this.formatter.format(avg, col.format);
                    return typeof formatted === 'string' ? formatted : String(avg);
                }
                return Math.round(avg * 100) / 100;
            }
            default:
                return '';
        }
    }

    /* ====================================================== */
    /*  Helpers                                                */
    /* ====================================================== */

    private applyBottomRounding(tr: HTMLTableRowElement): void {
        const p = this.config.cssPrefix;
        const cells = tr.children;
        if (cells.length > 0) {
            cells[0].classList.add(`${p}rounded-bl-lg`);
            cells[cells.length - 1].classList.add(`${p}rounded-br-lg`);
        }
    }
}
