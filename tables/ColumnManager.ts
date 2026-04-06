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

import type { ColumnDef } from './types';

export interface ColumnManagerOptions {
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

export class ColumnManager {
    private columns: ColumnDef[];
    private options: Required<ColumnManagerOptions>;
    private panelEl: HTMLElement | null = null;

    constructor(columns: ColumnDef[], options: ColumnManagerOptions = {}) {
        this.columns = columns.map(c => ({ ...c, visible: c.visible !== false }));

        this.options = {
            storageKey: options.storageKey ?? '',
            onChange: options.onChange ?? (() => {}),
            cssPrefix: options.cssPrefix ?? 'tw:',
            labelSave: options.labelSave ?? 'Speichern',
            labelCancel: options.labelCancel ?? 'Abbrechen',
            labelSelectAll: options.labelSelectAll ?? 'Alle auswählen',
            panelTitle: options.panelTitle ?? 'Spalten konfigurieren',
        };

        this.loadFromStorage();
    }

    /* ====================================================== */
    /*  Public API                                             */
    /* ====================================================== */

    /**
     * Get all columns (visible + hidden).
     */
    getAll(): ColumnDef[] {
        return [...this.columns];
    }

    /**
     * Get only visible columns, in order.
     */
    getVisible(): ColumnDef[] {
        return this.columns.filter(c => c.visible !== false);
    }

    /**
     * Get only hidden columns.
     */
    getHidden(): ColumnDef[] {
        return this.columns.filter(c => c.visible === false);
    }

    /**
     * Set visibility for a specific column.
     */
    setVisibility(key: string, visible: boolean): this {
        const col = this.columns.find(c => c.key === key);
        if (col) {
            col.visible = visible;
            this.saveToStorage();
            this.options.onChange(this.getVisible());
        }
        return this;
    }

    /**
     * Toggle visibility for a specific column.
     */
    toggle(key: string): this {
        const col = this.columns.find(c => c.key === key);
        if (col) {
            col.visible = !(col.visible !== false);
            this.saveToStorage();
            this.options.onChange(this.getVisible());
        }
        return this;
    }

    /**
     * Show all columns.
     */
    showAll(): this {
        this.columns.forEach(c => c.visible = true);
        this.saveToStorage();
        this.options.onChange(this.getVisible());
        return this;
    }

    /**
     * Reorder columns. Pass an array of keys in the desired order.
     * Keys not in the array are appended at the end.
     */
    reorder(keyOrder: string[]): this {
        const ordered: ColumnDef[] = [];
        const remaining = [...this.columns];

        keyOrder.forEach(key => {
            const idx = remaining.findIndex(c => c.key === key);
            if (idx !== -1) {
                ordered.push(remaining.splice(idx, 1)[0]);
            }
        });

        this.columns = [...ordered, ...remaining];
        this.saveToStorage();
        this.options.onChange(this.getVisible());
        return this;
    }

    /**
     * Reset to initial column definitions (before any user changes).
     */
    reset(initialColumns: ColumnDef[]): this {
        this.columns = initialColumns.map(c => ({ ...c, visible: c.visible !== false }));
        this.clearStorage();
        this.options.onChange(this.getVisible());
        return this;
    }

    /* ====================================================== */
    /*  Panel UI                                               */
    /* ====================================================== */

    /**
     * Render a column-toggle panel into a container.
     * The panel shows checkboxes for each column + save/cancel buttons.
     *
     * @param container  CSS selector or HTMLElement
     * @param trigger    Optional: CSS selector or HTMLElement that toggles the panel
     */
    mountPanel(container: string | HTMLElement, trigger?: string | HTMLElement): this {
        const el = typeof container === 'string'
            ? document.querySelector<HTMLElement>(container)
            : container;

        if (!el) {
            console.warn(`[ColumnManager] Panel container not found: ${container}`);
            return this;
        }

        this.panelEl = el;
        this.renderPanel();

        /* Wire up trigger button */
        if (trigger) {
            const triggerEl = typeof trigger === 'string'
                ? document.querySelector<HTMLElement>(trigger)
                : trigger;

            triggerEl?.addEventListener('click', () => this.showPanel());
        }

        return this;
    }

    /** Show the panel */
    showPanel(): void {
        if (!this.panelEl) return;
        const p = this.options.cssPrefix;
        this.panelEl.classList.remove(`${p}hidden`);
        this.panelEl.classList.add(`${p}flex`);
        this.syncCheckboxes();
    }

    /** Hide the panel */
    hidePanel(): void {
        if (!this.panelEl) return;
        const p = this.options.cssPrefix;
        this.panelEl.classList.remove(`${p}flex`);
        this.panelEl.classList.add(`${p}hidden`);
    }

    private renderPanel(): void {
        if (!this.panelEl) return;
        const p = this.options.cssPrefix;

        this.panelEl.innerHTML = '';
        this.panelEl.className = [
            `${p}hidden`, `${p}flex-col`, `${p}gap-2`, `${p}p-4`,
            `${p}bg-white`, `${p}border`, `${p}border-gray-300`,
            `${p}rounded-lg`, `${p}shadow-md`, `${p}max-w-xs`,
        ].join(' ');

        /* Title */
        const title = document.createElement('h3');
        title.className = `${p}font-semibold ${p}text-sm ${p}mb-2`;
        title.textContent = this.options.panelTitle;
        this.panelEl.appendChild(title);

        /* Select All */
        const allLabel = this.createCheckboxRow('__all', this.options.labelSelectAll, true);
        const allCheckbox = allLabel.querySelector('input') as HTMLInputElement;
        allCheckbox.addEventListener('change', () => {
            const checkboxes = this.panelEl!.querySelectorAll<HTMLInputElement>('input[data-col-key]');
            checkboxes.forEach(cb => {
                cb.checked = allCheckbox.checked;
            });
        });
        this.panelEl.appendChild(allLabel);

        /* Divider */
        const hr = document.createElement('hr');
        hr.className = `${p}border-gray-200 ${p}my-1`;
        this.panelEl.appendChild(hr);

        /* Column checkboxes */
        this.columns.forEach(col => {
            const label = this.createCheckboxRow(col.key, col.label, col.visible !== false);
            this.panelEl!.appendChild(label);
        });

        /* Button row */
        const btnRow = document.createElement('div');
        btnRow.className = `${p}flex ${p}gap-2 ${p}mt-3 ${p}justify-end`;

        const cancelBtn = document.createElement('button');
        cancelBtn.className = [
            `${p}px-3`, `${p}py-1`, `${p}text-sm`, `${p}rounded`,
            `${p}border`, `${p}border-gray-300`, `${p}bg-white`,
            `${p}cursor-pointer`, `${p}hover:bg-gray-100`,
        ].join(' ');
        cancelBtn.textContent = this.options.labelCancel;
        cancelBtn.addEventListener('click', () => {
            this.syncCheckboxes(); /* revert unsaved changes */
            this.hidePanel();
        });

        const saveBtn = document.createElement('button');
        saveBtn.className = [
            `${p}px-3`, `${p}py-1`, `${p}text-sm`, `${p}rounded`,
            `${p}bg-blue-500`, `${p}text-white`, `${p}cursor-pointer`,
            `${p}hover:bg-blue-600`,
        ].join(' ');
        saveBtn.textContent = this.options.labelSave;
        saveBtn.addEventListener('click', () => {
            this.applyFromCheckboxes();
            this.hidePanel();
        });

        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(saveBtn);
        this.panelEl.appendChild(btnRow);
    }

    private createCheckboxRow(key: string, label: string, checked: boolean): HTMLLabelElement {
        const p = this.options.cssPrefix;

        const labelEl = document.createElement('label');
        labelEl.className = `${p}flex ${p}items-center ${p}gap-2 ${p}text-sm ${p}cursor-pointer ${p}py-0.5`;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = checked;
        if (key !== '__all') {
            checkbox.dataset.colKey = key;
        }

        const text = document.createElement('span');
        text.textContent = label;

        labelEl.appendChild(checkbox);
        labelEl.appendChild(text);
        return labelEl;
    }

    /** Sync checkbox states with current column visibility */
    private syncCheckboxes(): void {
        if (!this.panelEl) return;
        const checkboxes = this.panelEl.querySelectorAll<HTMLInputElement>('input[data-col-key]');
        checkboxes.forEach(cb => {
            const col = this.columns.find(c => c.key === cb.dataset.colKey);
            if (col) cb.checked = col.visible !== false;
        });

        /* Update "select all" */
        const allCb = this.panelEl.querySelector<HTMLInputElement>('input:not([data-col-key])');
        if (allCb) {
            allCb.checked = this.columns.every(c => c.visible !== false);
        }
    }

    /** Read checkbox states and apply to columns */
    private applyFromCheckboxes(): void {
        if (!this.panelEl) return;
        const checkboxes = this.panelEl.querySelectorAll<HTMLInputElement>('input[data-col-key]');
        checkboxes.forEach(cb => {
            const col = this.columns.find(c => c.key === cb.dataset.colKey);
            if (col) col.visible = cb.checked;
        });

        this.saveToStorage();
        this.options.onChange(this.getVisible());
    }

    /* ====================================================== */
    /*  Persistence (localStorage)                             */
    /* ====================================================== */

    private saveToStorage(): void {
        if (!this.options.storageKey) return;
        try {
            const data = this.columns.map(c => ({
                key: c.key,
                visible: c.visible !== false,
            }));
            localStorage.setItem(this.options.storageKey, JSON.stringify(data));
        } catch { /* localStorage unavailable */ }
    }

    private loadFromStorage(): void {
        if (!this.options.storageKey) return;
        try {
            const raw = localStorage.getItem(this.options.storageKey);
            if (!raw) return;

            const saved: Array<{ key: string; visible: boolean }> = JSON.parse(raw);

            /* Only apply if column count still matches (schema migration safety) */
            if (saved.length !== this.columns.length) return;

            saved.forEach(s => {
                const col = this.columns.find(c => c.key === s.key);
                if (col) col.visible = s.visible;
            });
        } catch { /* corrupted or unavailable */ }
    }

    private clearStorage(): void {
        if (!this.options.storageKey) return;
        try {
            localStorage.removeItem(this.options.storageKey);
        } catch { /* ignore */ }
    }
}
