export interface BindingFunctionMap {
    [key: string]: (e: Event) => void;
}

export class BindingManager {
    private constructor();

    fnNames: BindingFunctionMap;

    private boundElements: WeakMap<Element, Set<string>>;

    variables: Record<string, string>;

    addBindings(fnNames: BindingFunctionMap): void;

    getVariable(id: string): string | undefined;
}

export const bindingManager: BindingManager;

export function addBindings(fnNames: BindingFunctionMap): void;

export function getVariable(id: string): string | undefined;
