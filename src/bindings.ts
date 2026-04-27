export type BindingFunctionMap = Record<string, (e: Event) => void>;

class BindingManagerImpl {
    fnNames: BindingFunctionMap = {};
    boundElements = new WeakMap<Element, Set<string>>();
    variables: Record<string, string> = {};

    constructor() {
        this._bindToggle();
    }

    addBindings(fnNames: BindingFunctionMap): void {
        this.fnNames = { ...this.fnNames, ...fnNames };

        document.querySelectorAll('[data-binding]').forEach(el => this._addBinding(el));
        document.querySelectorAll('[data-variable]').forEach(el => {
            if (el.id) {
                this.variables[el.id] = (el as HTMLInputElement).value || el.innerHTML;
            }
        });
        document.querySelectorAll('[data-write]').forEach(el => this._addWriteBinding(el));
        document.querySelectorAll('[data-input]').forEach(el => this._addInputBinding(el));
        document.querySelectorAll('[data-drop]').forEach(el => this._addDropBinding(el));
        document.querySelectorAll('[data-dragover]').forEach(el => this._addDragoverBinding(el));
    }

    getVariable(id: string): string | undefined {
        return this.variables[id];
    }

    private _addBinding(el: Element): void {
        if (this._isAlreadyBound(el, "click")) return;

        const funName = el instanceof HTMLElement && el.dataset.fun
            ? `click_${el.dataset.fun}`
            : el.id ? `click_${el.id}` : null;

        if (!funName) return;

        el.addEventListener("click", e => {
            const fn = this.fnNames[funName];
            if (typeof fn === "function") fn(e);
            else console.warn(`Click handler not defined for "${funName}"`);
        });

        this._markAsBound(el, "click");
    }

    private _addWriteBinding(el: Element): void {
        if (this._isAlreadyBound(el, "write")) return;

        const ds = el instanceof HTMLElement ? el.dataset : null;
        const funName = ds?.fun ? `write_${ds.fun}` : `write_${el.id}`;

        el.addEventListener("change", e => {
            const fn = this.fnNames[funName];
            if (typeof fn === "function") fn(e);
            else console.warn(`Write handler not defined for "${funName}"`);
        });

        this._markAsBound(el, "write");
    }

    private _addInputBinding(el: Element): void {
        if (this._isAlreadyBound(el, "input")) return;

        const ds = el instanceof HTMLElement ? el.dataset : null;
        const funName = ds?.fun ? `input_${ds.fun}` : `input_${el.id}`;

        el.addEventListener("input", e => {
            const fn = this.fnNames[funName];
            if (typeof fn === "function") fn(e);
            else console.warn(`Input handler not defined for "${funName}"`);
        });

        this._markAsBound(el, "input");
    }

    private _addDropBinding(el: Element): void {
        if (this._isAlreadyBound(el, "drop")) return;

        const ds = el instanceof HTMLElement ? el.dataset : null;
        const funName = ds?.fun ? `drop_${ds.fun}` : `drop_${el.id}`;

        el.addEventListener("drop", e => {
            const fn = this.fnNames[funName];
            if (typeof fn === "function") fn(e);
            else console.warn(`Drop handler not defined for "${funName}"`);
        });

        this._markAsBound(el, "drop");
    }

    private _addDragoverBinding(el: Element): void {
        if (this._isAlreadyBound(el, "dragover")) return;

        const ds = el instanceof HTMLElement ? el.dataset : null;
        const funName = ds?.fun ? `dragover_${ds.fun}` : `dragover_${el.id}`;

        el.addEventListener("dragover", e => {
            const fn = this.fnNames[funName];
            if (typeof fn === "function") fn(e);
            else console.warn(`Dragover handler not defined for "${funName}"`);
        });

        this._markAsBound(el, "dragover");
    }

    private _bindToggle(): void {
        document.querySelectorAll('[data-toggle]').forEach(el => {
            if (this.boundElements.has(el)) return;

            el.addEventListener("click", () => {
                const target = (el as HTMLElement).dataset.target;
                if (!target) return;
                document.querySelectorAll(target).forEach(element => {
                    element.classList.toggle("hidden");
                });
            });
        });
    }

    private _isAlreadyBound(el: Element, event: string): boolean {
        return this.boundElements.get(el)?.has(event) ?? false;
    }

    private _markAsBound(el: Element, event: string): void {
        if (!this.boundElements.has(el)) {
            this.boundElements.set(el, new Set());
        }
        this.boundElements.get(el)!.add(event);
    }
}

const bindingManagerInstance = new BindingManagerImpl();

export const addBindings = (fnNames: BindingFunctionMap): void => bindingManagerInstance.addBindings(fnNames);
export const getVariable = (id: string): string | undefined => bindingManagerInstance.getVariable(id);
