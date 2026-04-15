// tables/EventEmitter.ts
var EventEmitter = class {
  _listeners = /* @__PURE__ */ new Map();
  /**
   * Subscribe to an event.
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, /* @__PURE__ */ new Set());
    }
    this._listeners.get(event).add(callback);
    return this;
  }
  /**
   * Subscribe to an event, but only fire once.
   */
  once(event, callback) {
    const wrapper = (detail) => {
      this.off(event, wrapper);
      callback(detail);
    };
    return this.on(event, wrapper);
  }
  /**
   * Unsubscribe from an event.
   */
  off(event, callback) {
    this._listeners.get(event)?.delete(callback);
    return this;
  }
  /**
   * Emit an event with payload.
   */
  emit(event, detail) {
    this._listeners.get(event)?.forEach((fn) => {
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
  removeAllListeners(event) {
    if (event) {
      this._listeners.delete(event);
    } else {
      this._listeners.clear();
    }
    return this;
  }
};

// tables/Formatter.ts
var Formatter = class {
  formats = /* @__PURE__ */ new Map();
  constructor(locale = "de-DE", currency = "EUR") {
    this.registerBuiltins(locale, currency);
  }
  /* ------------------------------------------------------ */
  /*  Public API                                             */
  /* ------------------------------------------------------ */
  /**
   * Register a named format function.
   * Overwrites existing formats with the same name.
   */
  register(name, fn) {
    this.formats.set(name, fn);
    return this;
  }
  /**
   * Check if a format is registered.
   */
  has(name) {
    return this.formats.has(name);
  }
  /**
   * Format a value.
   *
   * @param value    - The raw cell value
   * @param format   - A registered format name OR a custom function
   * @param row      - The full row data (passed to custom functions)
   */
  format(value, format, row) {
    if (value == null) return "";
    if (!format) return String(value);
    if (typeof format === "function") {
      return format(value, row);
    }
    const fn = this.formats.get(format);
    if (fn) return fn(value, row);
    console.warn(`[Formatter] Unknown format: "${format}". Returning raw value.`);
    return String(value);
  }
  /**
   * Get list of all registered format names.
   */
  getRegistered() {
    return Array.from(this.formats.keys());
  }
  /* ------------------------------------------------------ */
  /*  Built-in Formats                                       */
  /* ------------------------------------------------------ */
  registerBuiltins(locale, currency) {
    this.register("date", (value) => {
      const d = new Date(value);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString(locale);
    });
    this.register("datetime", (value) => {
      const d = new Date(value);
      if (isNaN(d.getTime())) return "";
      const dateStr = d.toLocaleDateString(locale);
      const timeStr = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
      return `${dateStr} ${timeStr}`;
    });
    this.register("currency", (value) => {
      const num = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(num)) return "";
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency
      }).format(num);
    });
    this.register("currency-cents", (value) => {
      const num = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(num)) return "";
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency
      }).format(num / 100);
    });
    this.register("percent", (value) => {
      const num = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(num)) return "";
      return new Intl.NumberFormat(locale, {
        style: "percent",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(num / 100);
    });
    this.register("percent-decimal", (value) => {
      const num = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(num)) return "";
      return new Intl.NumberFormat(locale, {
        style: "percent",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(num);
    });
    this.register("seconds", (value) => {
      const total = typeof value === "string" ? parseInt(value, 10) : value;
      if (isNaN(total) || total < 0) return "";
      const h = Math.floor(total / 3600);
      const m = Math.floor(total % 3600 / 60);
      const s = total % 60;
      return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
    });
    this.register("duration", (value) => {
      const total = typeof value === "string" ? parseInt(value, 10) : value;
      if (isNaN(total) || total < 0) return "";
      const m = Math.floor(total / 60);
      const s = total % 60;
      return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    });
    this.register("phone", (value) => {
      if (!value) return "";
      const str = String(value);
      if (str.startsWith("49")) {
        return "+49 " + str.slice(2);
      }
      return str;
    });
    this.register("boolean", (value) => {
      return value === true || value === 1 || value === "1" ? "Ja" : "Nein";
    });
    this.register("number", (value) => {
      const num = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(num)) return "";
      return new Intl.NumberFormat(locale).format(num);
    });
  }
};

// tables/Sorter.ts
var Sorter = class {
  state;
  onSortCallback;
  customComparers = /* @__PURE__ */ new Map();
  constructor(defaultSort, onSort) {
    this.state = defaultSort ?? null;
    this.onSortCallback = onSort;
  }
  /* ------------------------------------------------------ */
  /*  Public API                                             */
  /* ------------------------------------------------------ */
  /**
   * Get current sort state.
   */
  getState() {
    return this.state ? { ...this.state } : null;
  }
  /**
   * Set sort state without sorting data.
   */
  setState(state) {
    this.state = state;
  }
  /**
   * Register a custom comparer for a specific column.
   */
  registerComparer(column, fn) {
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
  sort(data, column) {
    if (this.state?.column === column) {
      this.state.direction = this.state.direction === "asc" ? "desc" : "asc";
    } else {
      this.state = { column, direction: "asc" };
    }
    if (this.onSortCallback) {
      this.onSortCallback(this.state.column, this.state.direction);
      return data;
    }
    return this.sortData(data, this.state.column, this.state.direction);
  }
  /**
   * Sort data without changing state (e.g., for initial render with defaultSort).
   */
  applyCurrentSort(data) {
    if (!this.state) return data;
    if (this.onSortCallback) return data;
    return this.sortData(data, this.state.column, this.state.direction);
  }
  /* ------------------------------------------------------ */
  /*  Internal                                               */
  /* ------------------------------------------------------ */
  sortData(data, column, direction) {
    const customComparer = this.customComparers.get(column);
    return [...data].sort((a, b) => {
      const valA = a[column];
      const valB = b[column];
      let result;
      if (customComparer) {
        result = customComparer(valA, valB, direction);
      } else {
        result = this.compare(valA, valB);
      }
      return direction === "asc" ? result : -result;
    });
  }
  /**
   * Smart comparison: handles null, numbers, dates, strings.
   */
  compare(a, b) {
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    const numA = Number(a);
    const numB = Number(b);
    if (!isNaN(numA) && !isNaN(numB) && a !== "" && b !== "") {
      return numA - numB;
    }
    if (typeof a === "string" && typeof b === "string") {
      const dateA = Date.parse(a);
      const dateB = Date.parse(b);
      if (!isNaN(dateA) && !isNaN(dateB) && this.looksLikeDate(a) && this.looksLikeDate(b)) {
        return dateA - dateB;
      }
    }
    return String(a).localeCompare(String(b), void 0, { numeric: true, sensitivity: "base" });
  }
  /**
   * Heuristic: does a string look like a date?
   * Avoids false positives for plain numbers that Date.parse() accepts.
   */
  looksLikeDate(str) {
    return /\d{4}-\d{2}-\d{2}/.test(str) || /\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4}/.test(str);
  }
};

// tables/ColumnManager.ts
var ColumnManager = class {
  columns;
  options;
  panelEl = null;
  constructor(columns, options = {}) {
    this.columns = columns.map((c) => ({ ...c, visible: c.visible !== false }));
    this.options = {
      storageKey: options.storageKey ?? "",
      onChange: options.onChange ?? (() => {
      }),
      cssPrefix: options.cssPrefix ?? "tw:",
      labelSave: options.labelSave ?? "Speichern",
      labelCancel: options.labelCancel ?? "Abbrechen",
      labelSelectAll: options.labelSelectAll ?? "Alle ausw\xE4hlen",
      panelTitle: options.panelTitle ?? "Spalten konfigurieren"
    };
    this.loadFromStorage();
  }
  /* ====================================================== */
  /*  Public API                                             */
  /* ====================================================== */
  /**
   * Get all columns (visible + hidden).
   */
  getAll() {
    return [...this.columns];
  }
  /**
   * Get only visible columns, in order.
   */
  getVisible() {
    return this.columns.filter((c) => c.visible !== false);
  }
  /**
   * Get only hidden columns.
   */
  getHidden() {
    return this.columns.filter((c) => c.visible === false);
  }
  /**
   * Set visibility for a specific column.
   */
  setVisibility(key, visible) {
    const col = this.columns.find((c) => c.key === key);
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
  toggle(key) {
    const col = this.columns.find((c) => c.key === key);
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
  showAll() {
    this.columns.forEach((c) => c.visible = true);
    this.saveToStorage();
    this.options.onChange(this.getVisible());
    return this;
  }
  /**
   * Reorder columns. Pass an array of keys in the desired order.
   * Keys not in the array are appended at the end.
   */
  reorder(keyOrder) {
    const ordered = [];
    const remaining = [...this.columns];
    keyOrder.forEach((key) => {
      const idx = remaining.findIndex((c) => c.key === key);
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
  reset(initialColumns) {
    this.columns = initialColumns.map((c) => ({ ...c, visible: c.visible !== false }));
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
  mountPanel(container, trigger) {
    const el = typeof container === "string" ? document.querySelector(container) : container;
    if (!el) {
      console.warn(`[ColumnManager] Panel container not found: ${container}`);
      return this;
    }
    this.panelEl = el;
    this.renderPanel();
    if (trigger) {
      const triggerEl = typeof trigger === "string" ? document.querySelector(trigger) : trigger;
      triggerEl?.addEventListener("click", () => this.showPanel());
    }
    return this;
  }
  /** Show the panel */
  showPanel() {
    if (!this.panelEl) return;
    const p = this.options.cssPrefix;
    this.panelEl.classList.remove(`${p}hidden`);
    this.panelEl.classList.add(`${p}flex`);
    this.syncCheckboxes();
  }
  /** Hide the panel */
  hidePanel() {
    if (!this.panelEl) return;
    const p = this.options.cssPrefix;
    this.panelEl.classList.remove(`${p}flex`);
    this.panelEl.classList.add(`${p}hidden`);
  }
  renderPanel() {
    if (!this.panelEl) return;
    const p = this.options.cssPrefix;
    this.panelEl.innerHTML = "";
    this.panelEl.className = [
      `${p}hidden`,
      `${p}flex-col`,
      `${p}gap-2`,
      `${p}p-4`,
      `${p}bg-white`,
      `${p}border`,
      `${p}border-gray-300`,
      `${p}rounded-lg`,
      `${p}shadow-md`,
      `${p}max-w-xs`
    ].join(" ");
    const title = document.createElement("h3");
    title.className = `${p}font-semibold ${p}text-sm ${p}mb-2`;
    title.textContent = this.options.panelTitle;
    this.panelEl.appendChild(title);
    const allLabel = this.createCheckboxRow("__all", this.options.labelSelectAll, true);
    const allCheckbox = allLabel.querySelector("input");
    allCheckbox.addEventListener("change", () => {
      const checkboxes = this.panelEl.querySelectorAll("input[data-col-key]");
      checkboxes.forEach((cb) => {
        cb.checked = allCheckbox.checked;
      });
    });
    this.panelEl.appendChild(allLabel);
    const hr = document.createElement("hr");
    hr.className = `${p}border-gray-200 ${p}my-1`;
    this.panelEl.appendChild(hr);
    this.columns.forEach((col) => {
      const label = this.createCheckboxRow(col.key, col.label, col.visible !== false);
      this.panelEl.appendChild(label);
    });
    const btnRow = document.createElement("div");
    btnRow.className = `${p}flex ${p}gap-2 ${p}mt-3 ${p}justify-end`;
    const cancelBtn = document.createElement("button");
    cancelBtn.className = [
      `${p}px-3`,
      `${p}py-1`,
      `${p}text-sm`,
      `${p}rounded`,
      `${p}border`,
      `${p}border-gray-300`,
      `${p}bg-white`,
      `${p}cursor-pointer`,
      `${p}hover:bg-gray-100`
    ].join(" ");
    cancelBtn.textContent = this.options.labelCancel;
    cancelBtn.addEventListener("click", () => {
      this.syncCheckboxes();
      this.hidePanel();
    });
    const saveBtn = document.createElement("button");
    saveBtn.className = [
      `${p}px-3`,
      `${p}py-1`,
      `${p}text-sm`,
      `${p}rounded`,
      `${p}bg-blue-500`,
      `${p}text-white`,
      `${p}cursor-pointer`,
      `${p}hover:bg-blue-600`
    ].join(" ");
    saveBtn.textContent = this.options.labelSave;
    saveBtn.addEventListener("click", () => {
      this.applyFromCheckboxes();
      this.hidePanel();
    });
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(saveBtn);
    this.panelEl.appendChild(btnRow);
  }
  createCheckboxRow(key, label, checked) {
    const p = this.options.cssPrefix;
    const labelEl = document.createElement("label");
    labelEl.className = `${p}flex ${p}items-center ${p}gap-2 ${p}text-sm ${p}cursor-pointer ${p}py-0.5`;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = checked;
    if (key !== "__all") {
      checkbox.dataset.colKey = key;
    }
    const text = document.createElement("span");
    text.textContent = label;
    labelEl.appendChild(checkbox);
    labelEl.appendChild(text);
    return labelEl;
  }
  /** Sync checkbox states with current column visibility */
  syncCheckboxes() {
    if (!this.panelEl) return;
    const checkboxes = this.panelEl.querySelectorAll("input[data-col-key]");
    checkboxes.forEach((cb) => {
      const col = this.columns.find((c) => c.key === cb.dataset.colKey);
      if (col) cb.checked = col.visible !== false;
    });
    const allCb = this.panelEl.querySelector("input:not([data-col-key])");
    if (allCb) {
      allCb.checked = this.columns.every((c) => c.visible !== false);
    }
  }
  /** Read checkbox states and apply to columns */
  applyFromCheckboxes() {
    if (!this.panelEl) return;
    const checkboxes = this.panelEl.querySelectorAll("input[data-col-key]");
    checkboxes.forEach((cb) => {
      const col = this.columns.find((c) => c.key === cb.dataset.colKey);
      if (col) col.visible = cb.checked;
    });
    this.saveToStorage();
    this.options.onChange(this.getVisible());
  }
  /* ====================================================== */
  /*  Persistence (localStorage)                             */
  /* ====================================================== */
  saveToStorage() {
    if (!this.options.storageKey) return;
    try {
      const data = this.columns.map((c) => ({
        key: c.key,
        visible: c.visible !== false
      }));
      localStorage.setItem(this.options.storageKey, JSON.stringify(data));
    } catch {
    }
  }
  loadFromStorage() {
    if (!this.options.storageKey) return;
    try {
      const raw = localStorage.getItem(this.options.storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.length !== this.columns.length) return;
      saved.forEach((s) => {
        const col = this.columns.find((c) => c.key === s.key);
        if (col) col.visible = s.visible;
      });
    } catch {
    }
  }
  clearStorage() {
    if (!this.options.storageKey) return;
    try {
      localStorage.removeItem(this.options.storageKey);
    } catch {
    }
  }
};

// tables/IconResolver.ts
var IconResolver = class {
  customIcons = /* @__PURE__ */ new Map();
  resolverFn = null;
  defaultOptions;
  constructor(options = {}) {
    this.defaultOptions = {
      size: options.size ?? 15,
      className: options.className ?? "inline",
      fill: options.fill ?? "white"
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
  resolve(icon, options) {
    const opts = { ...this.defaultOptions, ...options };
    if (icon.trim().startsWith("<svg") || icon.trim().startsWith("<path")) {
      return icon;
    }
    const custom = this.customIcons.get(icon);
    if (custom) return this.wrapSvg(custom, opts);
    if (this.resolverFn) {
      const resolved = this.resolverFn(icon, opts.size);
      if (resolved) return resolved;
    }
    const builtin = this.customIcons.get(`__builtin_${icon}`);
    if (builtin) return this.wrapSvg(builtin, opts);
    return `<span style="width:${opts.size}px;height:${opts.size}px;display:inline-flex;align-items:center;justify-content:center;font-size:10px;" title="${icon}">\u25CF</span>`;
  }
  /**
   * Register a custom icon by name.
   * Pass either a full SVG string or just the inner <path> content.
   */
  register(name, svg) {
    this.customIcons.set(name, svg);
    return this;
  }
  /**
   * Register multiple icons at once.
   */
  registerAll(icons) {
    Object.entries(icons).forEach(([name, svg]) => this.register(name, svg));
    return this;
  }
  /**
   * Set an external resolver function (e.g., for Lucide integration).
   */
  setResolver(fn) {
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
  useLucide(lucideModule) {
    this.setResolver((name, size) => {
      const s = size ?? this.defaultOptions.size;
      const pascalName = name.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
      if (lucideModule.icons && lucideModule.icons[pascalName]) {
        if (typeof lucideModule.createElement === "function") {
          const el = lucideModule.createElement(lucideModule.icons[pascalName]);
          el.setAttribute("width", String(s));
          el.setAttribute("height", String(s));
          el.classList.add(this.defaultOptions.className);
          const wrapper = document.createElement("div");
          wrapper.appendChild(el);
          return wrapper.innerHTML;
        }
        const iconData = lucideModule.icons[pascalName];
        if (Array.isArray(iconData)) {
          const paths = iconData.map((node) => {
            if (Array.isArray(node) && node[0]) {
              const [tag, attrs] = node;
              const attrStr = Object.entries(attrs || {}).map(([k, v]) => `${k}="${v}"`).join(" ");
              return `<${tag} ${attrStr}/>`;
            }
            return "";
          }).join("");
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
  registerBuiltins() {
    const builtins = {
      edit: "M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z",
      delete: "M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z",
      save: "M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z",
      add: "M20 14H14V20H10V14H4V10H10V4H14V10H20V14Z",
      check: "M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z",
      move: "M13,6V11H18V7.75L22.25,12L18,16.25V13H13V18H16.25L12,22.25L7.75,18H11V13H6V16.25L1.75,12L6,7.75V11H11V6H7.75L12,1.75L16.25,6H13Z",
      "chevron-down": "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
      "chevron-up": "M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z",
      "sort-asc": "M19 17H22L18 21L14 17H17V3H19M2 17H12V19H2M6 5V7H2V5M2 11H9V13H2V11Z",
      "sort-desc": "M19 7H22L18 3L14 7H17V21H19M2 17H12V19H2M6 5V7H2V5M2 11H9V13H2V11Z",
      "sort-none": "M18 21L14 17H17V7H14L18 3L22 7H19V17H22M2 19V17H12V19M2 13V11H9V13M2 7V5H6V7H2Z",
      eye: "M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z",
      link: "M18 16H14V18H18V20L21 17L18 14V16M11 4C8.8 4 7 5.8 7 8S8.8 12 11 12 15 10.2 15 8 13.2 4 11 4M11 14C6.6 14 3 15.8 3 18V20H12.5C12.2 19.2 12 18.4 12 17.5C12 16.3 12.3 15.2 12.9 14.1C12.3 14.1 11.7 14 11 14",
      settings: "M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.04 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.04 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"
    };
    Object.entries(builtins).forEach(([name, pathData]) => {
      this.customIcons.set(`__builtin_${name}`, pathData);
    });
  }
  /**
   * Wrap a path data string into a full SVG element.
   */
  wrapSvg(pathOrSvg, opts) {
    if (pathOrSvg.trim().startsWith("<svg")) {
      return pathOrSvg;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width:${opts.size}px;height:${opts.size}px" class="${opts.className}"><path d="${pathOrSvg}" fill="${opts.fill}"/></svg>`;
  }
};

// tables/DataTable.ts
var DEFAULT_STYLES = {
  headerBg: "bg-[#83a9cd]",
  footerBg: "bg-[#d3dce3]",
  rowEven: "bg-gray-100",
  rowOdd: "bg-gray-200",
  rowHover: "hover:bg-gray-300"
};
var DataTable = class extends EventEmitter {
  config;
  data = [];
  sortedData = [];
  tableEl;
  theadEl;
  tbodyEl;
  tfootEl = null;
  containerEl = null;
  formatter;
  sorter;
  columnManager;
  icons;
  styles;
  constructor(config) {
    super();
    this.config = {
      sortable: true,
      footer: false,
      stripedRows: true,
      cssPrefix: "tw:",
      primaryKey: "id",
      emptyMessage: "Keine Daten verf\xFCgbar.",
      ...config
    };
    this.formatter = new Formatter();
    this.sorter = new Sorter(config.defaultSort, config.onSort);
    this.icons = new IconResolver();
    this.columnManager = new ColumnManager(config.columns, {
      storageKey: config.persistColumns,
      cssPrefix: this.config.cssPrefix,
      onChange: (cols) => {
        this.render();
        this.emit("columns:change", { columns: cols });
      }
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
  mount(container) {
    const el = typeof container === "string" ? document.querySelector(container) : container;
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
  setData(data) {
    this.data = [...data];
    this.sortedData = this.sorter.applyCurrentSort(this.data);
    this.render();
    this.emit("data:change", { data: this.data });
    return this;
  }
  /**
   * Get current data (unsorted).
   */
  getData() {
    return [...this.data];
  }
  /**
   * Add a single row and re-render.
   */
  addRow(row) {
    this.data.push(row);
    this.sortedData = this.sorter.applyCurrentSort(this.data);
    this.render();
    this.emit("data:change", { data: this.data });
    return this;
  }
  /**
   * Update a row by primary key and re-render.
   */
  updateRow(key, updates) {
    const pk = this.config.primaryKey;
    const idx = this.data.findIndex((r) => r[pk] === key);
    if (idx === -1) {
      console.warn(`[DataTable] Row with ${pk}=${key} not found.`);
      return this;
    }
    this.data[idx] = { ...this.data[idx], ...updates };
    this.sortedData = this.sorter.applyCurrentSort(this.data);
    this.render();
    this.emit("data:change", { data: this.data });
    return this;
  }
  /**
   * Remove a row by primary key and re-render.
   */
  removeRow(key) {
    const pk = this.config.primaryKey;
    this.data = this.data.filter((r) => r[pk] !== key);
    this.sortedData = this.sorter.applyCurrentSort(this.data);
    this.render();
    this.emit("data:change", { data: this.data });
    return this;
  }
  /**
   * Update column visibility at runtime.
   */
  setColumnVisibility(key, visible) {
    this.columnManager.setVisibility(key, visible);
    return this;
  }
  /**
   * Get visible columns.
   */
  getVisibleColumns() {
    return this.columnManager.getVisible();
  }
  /**
   * Completely destroy the table and clean up.
   */
  destroy() {
    this.removeAllListeners();
    if (this.tableEl && this.containerEl) {
      this.containerEl.removeChild(this.tableEl);
    }
  }
  /**
   * Force a full re-render.
   */
  refresh() {
    this.render();
    return this;
  }
  /* ====================================================== */
  /*  Rendering                                              */
  /* ====================================================== */
  createTableElement() {
    this.tableEl = document.createElement("table");
    this.theadEl = document.createElement("thead");
    this.tbodyEl = document.createElement("tbody");
    const p = this.config.cssPrefix;
    this.tableEl.className = `${p}w-full ${p}border-collapse ${this.config.tableClassName ?? ""}`.trim();
    this.tableEl.appendChild(this.theadEl);
    this.tableEl.appendChild(this.tbodyEl);
  }
  render() {
    const visibleCols = this.getVisibleColumns();
    this.renderHeader(visibleCols);
    this.renderBody(visibleCols);
    if (this.tfootEl) {
      this.tableEl.removeChild(this.tfootEl);
      this.tfootEl = null;
    }
    if (this.config.footer) {
      this.renderFooter(visibleCols);
    }
    this.emit("render:complete", { rowCount: this.sortedData.length });
  }
  /* ---- Header ---- */
  renderHeader(columns) {
    const p = this.config.cssPrefix;
    this.theadEl.innerHTML = "";
    const tr = document.createElement("tr");
    const hasActions = (this.config.actions?.length ?? 0) > 0;
    const allCols = hasActions ? [...columns, { key: "__actions", label: "Aktionen", sortable: false }] : columns;
    allCols.forEach((col, idx) => {
      const th = document.createElement("th");
      th.className = [
        `${p}text-black`,
        `${p}font-semibold`,
        `${p}text-left`,
        `${p}px-2`,
        `${p}py-2`,
        `${p}text-[12px]`,
        `${p}${this.styles.headerBg}`,
        col.headerClassName ?? ""
      ].filter(Boolean).join(" ");
      th.dataset.key = col.key;
      th.textContent = col.label;
      if (idx === 0) th.classList.add(`${p}rounded-tl-lg`);
      if (idx === allCols.length - 1) th.classList.add(`${p}rounded-tr-lg`);
      if (this.config.sortable && col.sortable !== false && col.key !== "__actions") {
        th.style.cursor = "pointer";
        th.appendChild(this.createSortIndicator(col.key));
        th.addEventListener("click", () => this.handleSort(col.key));
      }
      tr.appendChild(th);
    });
    this.theadEl.appendChild(tr);
  }
  /* ---- Body ---- */
  renderBody(columns) {
    const p = this.config.cssPrefix;
    this.tbodyEl.innerHTML = "";
    if (this.sortedData.length === 0) {
      const tr = document.createElement("tr");
      tr.className = `${p}bg-gray-100`;
      const td = document.createElement("td");
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
      const tr = document.createElement("tr");
      const rowBg = this.config.stripedRows ? idx % 2 === 0 ? this.styles.rowEven : this.styles.rowOdd : this.styles.rowEven;
      tr.className = `${p}${rowBg} ${p}${this.styles.rowHover}`;
      const pk = this.config.primaryKey;
      if (row[pk] != null) {
        tr.dataset.id = String(row[pk]);
      }
      columns.forEach((col) => {
        const td = document.createElement("td");
        td.className = `${p}p-2 ${col.className ?? ""}`.trim();
        const rawValue = row[col.key];
        if (col.render) {
          const result = col.render(rawValue, row, td);
          if (result instanceof HTMLElement) {
            td.appendChild(result);
          } else if (typeof result === "string") {
            td.textContent = result;
          }
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
      if (hasActions) {
        tr.appendChild(this.createActionCell(row, tr));
      }
      tr.addEventListener("click", (e) => {
        this.emit("row:click", { row, element: tr, event: e });
      });
      tr.addEventListener("dblclick", (e) => {
        this.emit("row:dblclick", { row, element: tr, event: e });
      });
      this.tbodyEl.appendChild(tr);
    });
    if (!this.config.footer && this.tbodyEl.lastElementChild) {
      this.applyBottomRounding(this.tbodyEl.lastElementChild);
    }
  }
  /* ---- Footer ---- */
  renderFooter(columns) {
    const p = this.config.cssPrefix;
    this.tfootEl = document.createElement("tfoot");
    const tr = document.createElement("tr");
    const hasActions = (this.config.actions?.length ?? 0) > 0;
    const allCols = hasActions ? [...columns, { key: "__actions", label: "" }] : columns;
    allCols.forEach((col, idx) => {
      const td = document.createElement("td");
      td.className = [
        `${p}text-black`,
        `${p}font-semibold`,
        `${p}text-left`,
        `${p}px-2`,
        `${p}py-2`,
        `${p}text-[12px]`,
        `${p}${this.styles.footerBg}`
      ].join(" ");
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
  handleSort(column) {
    this.sortedData = this.sorter.sort(this.data, column);
    const state = this.sorter.getState();
    this.render();
    this.emit("sort:change", { column: state.column, direction: state.direction });
  }
  createSortIndicator(column) {
    const span = document.createElement("span");
    span.className = "sort-indicator";
    span.style.marginLeft = "4px";
    span.style.fontSize = "10px";
    span.style.opacity = "0.5";
    const state = this.sorter.getState();
    if (state?.column === column) {
      span.textContent = state.direction === "asc" ? "\u25B2" : "\u25BC";
      span.style.opacity = "1";
    } else {
      span.textContent = "\u21C5";
    }
    return span;
  }
  /* ====================================================== */
  /*  Actions                                                */
  /* ====================================================== */
  createActionCell(row, tr) {
    const p = this.config.cssPrefix;
    const td = document.createElement("td");
    td.className = `${p}p-2`;
    const wrapper = document.createElement("div");
    wrapper.className = `${p}flex ${p}gap-1`;
    (this.config.actions ?? []).forEach((action) => {
      if (action.visible && !action.visible(row)) return;
      const btn = document.createElement("button");
      btn.className = [
        `${p}inline-flex`,
        `${p}items-center`,
        `${p}justify-center`,
        `${p}p-1`,
        `${p}rounded-md`,
        `${p}cursor-pointer`,
        `${p}border-0`,
        action.className ?? ""
      ].filter(Boolean).join(" ");
      btn.title = action.label ?? action.name;
      btn.innerHTML = this.resolveIcon(action.icon);
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (action.confirm) {
          const msg = typeof action.confirm === "string" ? action.confirm : `Aktion "${action.name}" wirklich ausf\xFChren?`;
          if (!confirm(msg)) return;
        }
        action.onClick(row, tr, e);
        this.emit("row:action", { action: action.name, row, element: tr });
      });
      wrapper.appendChild(btn);
    });
    td.appendChild(wrapper);
    return td;
  }
  /**
   * Resolve icon via IconResolver.
   */
  resolveIcon(icon) {
    return this.icons.resolve(icon);
  }
  /* ====================================================== */
  /*  Summary Computation                                    */
  /* ====================================================== */
  computeSummary(col) {
    const values = this.data.map((row) => row[col.key]);
    if (typeof col.summary === "function") {
      return col.summary(values, this.data);
    }
    const numericValues = values.map((v) => typeof v === "string" ? parseFloat(v) : v).filter((v) => typeof v === "number" && !isNaN(v));
    switch (col.summary) {
      case "sum": {
        const sum = numericValues.reduce((acc, v) => acc + v, 0);
        if (col.format && typeof col.format === "string") {
          const formatted = this.formatter.format(sum, col.format);
          return typeof formatted === "string" ? formatted : String(sum);
        }
        return sum;
      }
      case "count":
        return values.filter((v) => v != null && v !== "").length;
      case "avg": {
        if (numericValues.length === 0) return 0;
        const avg = numericValues.reduce((acc, v) => acc + v, 0) / numericValues.length;
        if (col.format && typeof col.format === "string") {
          const formatted = this.formatter.format(avg, col.format);
          return typeof formatted === "string" ? formatted : String(avg);
        }
        return Math.round(avg * 100) / 100;
      }
      default:
        return "";
    }
  }
  /* ====================================================== */
  /*  Helpers                                                */
  /* ====================================================== */
  applyBottomRounding(tr) {
    const p = this.config.cssPrefix;
    const cells = tr.children;
    if (cells.length > 0) {
      cells[0].classList.add(`${p}rounded-bl-lg`);
      cells[cells.length - 1].classList.add(`${p}rounded-br-lg`);
    }
  }
};

export { ColumnManager, DataTable, EventEmitter, Formatter, IconResolver, Sorter };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map