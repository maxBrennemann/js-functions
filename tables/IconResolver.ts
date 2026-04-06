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

export type IconResolverFn = (name: string, size?: number) => string | null;

export interface IconOptions {
    /** Icon width/height in px (default: 15) */
    size?: number;

    /** CSS class(es) applied to SVG elements */
    className?: string;

    /** Fill color for built-in icons (default: 'white') */
    fill?: string;
}

export class IconResolver {
    private customIcons = new Map<string, string>();
    private resolverFn: IconResolverFn | null = null;
    private defaultOptions: Required<IconOptions>;

    constructor(options: IconOptions = {}) {
        this.defaultOptions = {
            size: options.size ?? 15,
            className: options.className ?? 'inline',
            fill: options.fill ?? 'white',
        };

        this.registerBuiltins();
    }

    /* ====================================================== */
    /*  Public API                                             */
    /* ====================================================== */

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
    resolve(icon: string, options?: IconOptions): string {
        const opts = { ...this.defaultOptions, ...options };

        /* 1. Raw SVG pass-through */
        if (icon.trim().startsWith('<svg') || icon.trim().startsWith('<path')) {
            return icon;
        }

        /* 2. Custom registered icon */
        const custom = this.customIcons.get(icon);
        if (custom) return this.wrapSvg(custom, opts);

        /* 3. External resolver (Lucide etc.) */
        if (this.resolverFn) {
            const resolved = this.resolverFn(icon, opts.size);
            if (resolved) return resolved;
        }

        /* 4. Built-in icons */
        const builtin = this.customIcons.get(`__builtin_${icon}`);
        if (builtin) return this.wrapSvg(builtin, opts);

        /* 5. Fallback */
        return `<span style="width:${opts.size}px;height:${opts.size}px;display:inline-flex;align-items:center;justify-content:center;font-size:10px;" title="${icon}">●</span>`;
    }

    /**
     * Register a custom icon by name.
     * Pass either a full SVG string or just the inner <path> content.
     */
    register(name: string, svg: string): this {
        this.customIcons.set(name, svg);
        return this;
    }

    /**
     * Register multiple icons at once.
     */
    registerAll(icons: Record<string, string>): this {
        Object.entries(icons).forEach(([name, svg]) => this.register(name, svg));
        return this;
    }

    /**
     * Set an external resolver function (e.g., for Lucide integration).
     */
    setResolver(fn: IconResolverFn): this {
        this.resolverFn = fn;
        return this;
    }

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
    useLucide(lucideModule: any): this {
        this.setResolver((name: string, size?: number) => {
            const s = size ?? this.defaultOptions.size;

            /* lucide uses PascalCase internally: 'pencil' → 'Pencil', 'trash-2' → 'Trash2' */
            const pascalName = name
                .split('-')
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join('');

            /* lucide.icons is a Record<string, IconNode> in lucide */
            if (lucideModule.icons && lucideModule.icons[pascalName]) {
                /* Use createElement if available (lucide >= 0.300) */
                if (typeof lucideModule.createElement === 'function') {
                    const el = lucideModule.createElement(lucideModule.icons[pascalName]);
                    el.setAttribute('width', String(s));
                    el.setAttribute('height', String(s));
                    el.classList.add(this.defaultOptions.className);
                    const wrapper = document.createElement('div');
                    wrapper.appendChild(el);
                    return wrapper.innerHTML;
                }

                /* Fallback: construct SVG manually from icon data */
                const iconData = lucideModule.icons[pascalName];
                if (Array.isArray(iconData)) {
                    const paths = iconData
                        .map((node: any) => {
                            if (Array.isArray(node) && node[0]) {
                                const [tag, attrs] = node;
                                const attrStr = Object.entries(attrs || {})
                                    .map(([k, v]) => `${k}="${v}"`)
                                    .join(' ');
                                return `<${tag} ${attrStr}/>`;
                            }
                            return '';
                        })
                        .join('');

                    return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${this.defaultOptions.className}">${paths}</svg>`;
                }
            }

            return null;
        });

        return this;
    }

    /**
     * Integrate with lucide-static (pre-built SVG strings).
     *
     * Usage:
     *   import { Pencil, Trash2 } from 'lucide-static';
     *   icons.registerAll({ edit: Pencil, delete: Trash2 });
     */

    /* ====================================================== */
    /*  Built-in Icons                                         */
    /* ====================================================== */

    private registerBuiltins(): void {
        const builtins: Record<string, string> = {
            edit: 'M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z',
            delete: 'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z',
            save: 'M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z',
            add: 'M20 14H14V20H10V14H4V10H10V4H14V10H20V14Z',
            check: 'M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z',
            move: 'M13,6V11H18V7.75L22.25,12L18,16.25V13H13V18H16.25L12,22.25L7.75,18H11V13H6V16.25L1.75,12L6,7.75V11H11V6H7.75L12,1.75L16.25,6H13Z',
            'chevron-down': 'M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z',
            'chevron-up': 'M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z',
            'sort-asc': 'M19 17H22L18 21L14 17H17V3H19M2 17H12V19H2M6 5V7H2V5M2 11H9V13H2V11Z',
            'sort-desc': 'M19 7H22L18 3L14 7H17V21H19M2 17H12V19H2M6 5V7H2V5M2 11H9V13H2V11Z',
            'sort-none': 'M18 21L14 17H17V7H14L18 3L22 7H19V17H22M2 19V17H12V19M2 13V11H9V13M2 7V5H6V7H2Z',
            eye: 'M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z',
            link: 'M18 16H14V18H18V20L21 17L18 14V16M11 4C8.8 4 7 5.8 7 8S8.8 12 11 12 15 10.2 15 8 13.2 4 11 4M11 14C6.6 14 3 15.8 3 18V20H12.5C12.2 19.2 12 18.4 12 17.5C12 16.3 12.3 15.2 12.9 14.1C12.3 14.1 11.7 14 11 14',
            settings: 'M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.04 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.04 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z',
        };

        Object.entries(builtins).forEach(([name, pathData]) => {
            this.customIcons.set(`__builtin_${name}`, pathData);
        });
    }

    /**
     * Wrap a path data string into a full SVG element.
     */
    private wrapSvg(pathOrSvg: string, opts: Required<IconOptions>): string {
        /* Already a full SVG */
        if (pathOrSvg.trim().startsWith('<svg')) {
            return pathOrSvg;
        }

        /* Path data → wrap in SVG */
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width:${opts.size}px;height:${opts.size}px" class="${opts.className}"><path d="${pathOrSvg}" fill="${opts.fill}"/></svg>`;
    }
}
