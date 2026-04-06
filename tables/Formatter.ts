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

import type { TableRow, FormatFn } from './types';

export class Formatter {
    private formats = new Map<string, FormatFn>();

    constructor(locale: string = 'de-DE', currency: string = 'EUR') {
        this.registerBuiltins(locale, currency);
    }

    /* ------------------------------------------------------ */
    /*  Public API                                             */
    /* ------------------------------------------------------ */

    /**
     * Register a named format function.
     * Overwrites existing formats with the same name.
     */
    register(name: string, fn: FormatFn): this {
        this.formats.set(name, fn);
        return this;
    }

    /**
     * Check if a format is registered.
     */
    has(name: string): boolean {
        return this.formats.has(name);
    }

    /**
     * Format a value.
     *
     * @param value    - The raw cell value
     * @param format   - A registered format name OR a custom function
     * @param row      - The full row data (passed to custom functions)
     */
    format(value: any, format?: string | FormatFn, row?: TableRow): string | HTMLElement {
        if (value == null) return '';

        if (!format) return String(value);

        /* Direct function */
        if (typeof format === 'function') {
            return format(value, row);
        }

        /* Registered name */
        const fn = this.formats.get(format);
        if (fn) return fn(value, row);

        /* Fallback */
        console.warn(`[Formatter] Unknown format: "${format}". Returning raw value.`);
        return String(value);
    }

    /**
     * Get list of all registered format names.
     */
    getRegistered(): string[] {
        return Array.from(this.formats.keys());
    }

    /* ------------------------------------------------------ */
    /*  Built-in Formats                                       */
    /* ------------------------------------------------------ */

    private registerBuiltins(locale: string, currency: string): void {
        /* ---- Date (date only) ---- */
        this.register('date', (value: any) => {
            const d = new Date(value);
            if (isNaN(d.getTime())) return '';
            return d.toLocaleDateString(locale);
        });

        /* ---- DateTime (date + time HH:mm) ---- */
        this.register('datetime', (value: any) => {
            const d = new Date(value);
            if (isNaN(d.getTime())) return '';
            const dateStr = d.toLocaleDateString(locale);
            const timeStr = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
            return `${dateStr} ${timeStr}`;
        });

        /* ---- Currency ---- */
        this.register('currency', (value: any) => {
            const num = typeof value === 'string' ? parseFloat(value) : value;
            if (isNaN(num)) return '';
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency,
            }).format(num);
        });

        /* ---- Currency (cents → euros) ---- */
        this.register('currency-cents', (value: any) => {
            const num = typeof value === 'string' ? parseFloat(value) : value;
            if (isNaN(num)) return '';
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency,
            }).format(num / 100);
        });

        /* ---- Percent (expects 0–100 input) ---- */
        this.register('percent', (value: any) => {
            const num = typeof value === 'string' ? parseFloat(value) : value;
            if (isNaN(num)) return '';
            return new Intl.NumberFormat(locale, {
                style: 'percent',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }).format(num / 100);
        });

        /* ---- Percent (expects 0–1 input) ---- */
        this.register('percent-decimal', (value: any) => {
            const num = typeof value === 'string' ? parseFloat(value) : value;
            if (isNaN(num)) return '';
            return new Intl.NumberFormat(locale, {
                style: 'percent',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }).format(num);
        });

        /* ---- Seconds → HH:MM:SS ---- */
        this.register('seconds', (value: any) => {
            const total = typeof value === 'string' ? parseInt(value, 10) : value;
            if (isNaN(total) || total < 0) return '';
            const h = Math.floor(total / 3600);
            const m = Math.floor((total % 3600) / 60);
            const s = total % 60;
            return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
        });

        /* ---- Duration (seconds → MM:SS, no hours) ---- */
        this.register('duration', (value: any) => {
            const total = typeof value === 'string' ? parseInt(value, 10) : value;
            if (isNaN(total) || total < 0) return '';
            const m = Math.floor(total / 60);
            const s = total % 60;
            return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        });

        /* ---- German phone number ---- */
        this.register('phone', (value: any) => {
            if (!value) return '';
            const str = String(value);
            if (str.startsWith('49')) {
                return '+49 ' + str.slice(2);
            }
            return str;
        });

        /* ---- Boolean → Ja/Nein ---- */
        this.register('boolean', (value: any) => {
            return value === true || value === 1 || value === '1' ? 'Ja' : 'Nein';
        });

        /* ---- Number ---- */
        this.register('number', (value: any) => {
            const num = typeof value === 'string' ? parseFloat(value) : value;
            if (isNaN(num)) return '';
            return new Intl.NumberFormat(locale).format(num);
        });
    }
}
