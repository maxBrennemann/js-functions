/**
 * ============================================================
 *  EventEmitter — Typed event bus for DataTable
 * ============================================================
 *
 * Lightweight pub/sub. Supports `.on()`, `.off()`, `.once()`, `.emit()`.
 */

import type { TableEventMap, TableEventCallback } from './types';

export class EventEmitter {
    private _listeners = new Map<string, Set<Function>>();

    /**
     * Subscribe to an event.
     */
    on<K extends keyof TableEventMap>(event: K, callback: TableEventCallback<K>): this {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event)!.add(callback);
        return this;
    }

    /**
     * Subscribe to an event, but only fire once.
     */
    once<K extends keyof TableEventMap>(event: K, callback: TableEventCallback<K>): this {
        const wrapper = (detail: TableEventMap[K]) => {
            this.off(event, wrapper as TableEventCallback<K>);
            callback(detail);
        };
        return this.on(event, wrapper as TableEventCallback<K>);
    }

    /**
     * Unsubscribe from an event.
     */
    off<K extends keyof TableEventMap>(event: K, callback: TableEventCallback<K>): this {
        this._listeners.get(event)?.delete(callback);
        return this;
    }

    /**
     * Emit an event with payload.
     */
    protected emit<K extends keyof TableEventMap>(event: K, detail: TableEventMap[K]): void {
        this._listeners.get(event)?.forEach(fn => {
            try {
                fn(detail);
            } catch (err) {
                console.error(`[DataTable] Error in "${event}" handler:`, err);
            }
        });
    }

    /**
     * Remove all listeners, optionally for a specific event.
     */
    removeAllListeners(event?: keyof TableEventMap): this {
        if (event) {
            this._listeners.delete(event);
        } else {
            this._listeners.clear();
        }
        return this;
    }
}
