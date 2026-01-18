/**
 * Main Builder Controller
 * MODIFIED: Integrated Extension Architecture (Hooks, Plugins, Widgets)
 */
import { Registry } from "./registry.js";
import { Inspector } from "./inspector.js";
import { RenderEngine } from "./render.js";
import { HistoryManager } from "./history.js";
import { DragManager } from "./dragdrop.js";
import { Navigator } from "./navigator.js";
import { ContextMenu } from "./contextmenu.js";
import { ExportManager } from "./export.js";
import { Utils } from "./utils.js";
import { Responsive } from "./responsive.js";

// --- NEW CORE IMPORTS ---
import { Hooks } from "./core/hooks.js";
import { PluginManager } from "./core/plugins.js";
import { WidgetRegistry } from "./core/widgets.js";

// Global App State
const App = {
  pageId: null,
  data: { widgets: [], settings: {} },
  selected: null,
  history: new HistoryManager(),
  clipboard: null, // For copy/paste

  // --- NEW: Safe API for Plugins ---
  getBuilderAPI() {
    return {
      hooks: Hooks,
      widgets: WidgetRegistry,
      utils: Utils,
      // Expose read-only state or specific methods
      getCurrentPage: () => ({ ...this.data }),
      notify: (msg) => console.log(`[System]: ${msg}`), // Replace with UI toaster if avail
      refresh: () => this.render(),
    };
  },

  async init() {
    const params = new URLSearchParams(window.location.search);
    this.pageId = params.get("page");

    // Init Modules
    Registry.init();
    Inspector.init();
    DragManager.init();
    Navigator.init();
    ContextMenu.init();

    // --- NEW: Initialize Plugins ---
    // We pass the API so plugins can register widgets/hooks immediately
    await PluginManager.init(this.getBuilderAPI());

    Hooks.doAction("init", this); // Hook for plugins to run after core init

    // Load Page
    if (this.pageId && window.Pages) {
      const page = window.Pages.getById(this.pageId);
      if (page) {
        // Ensure data structures exist
        this.data.widgets = page.widgets || [];
        this.data.settings = page.settings || {};

        const titleEl = document.getElementById("page-title");
        if (titleEl) titleEl.textContent = `Editing: ${page.title}`;
      } else {
        console.error("Page not found in storage");
      }
    }

    // Initial Render
    this.render();
    this.history.push(this.data); // Save initial state
    this.bindEvents();
  },

  render() {
    Hooks.doAction("before_render", this.data);

    const canvas = document.getElementById("canvas");
    if (!canvas) return;

    canvas.innerHTML = ""; // Clear current view

    // Render Widgets recursively
    this.data.widgets.forEach((widget) => {
      let el;

      // --- NEW: Hybrid Rendering ---
      // 1. Try Custom Widget Registry
      if (WidgetRegistry.has(widget.type)) {
        el = WidgetRegistry.render(widget);
      }
      // 2. Fallback to built-in RenderEngine
      else {
        el = RenderEngine.createWidgetElement(widget);
      }

      if (el) canvas.appendChild(el);
    });

    // Sync Navigator
    Navigator.render(this.data.widgets);

    Hooks.doAction("after_render", this.data);
  },

  selectWidget(id) {
    this.selected = id;

    // Highlight in UI
    document
      .querySelectorAll(".ce-widget")
      .forEach((el) => el.classList.remove("selected"));
    const el = document.getElementById(id);
    if (el) el.classList.add("selected");

    // Open Inspector
    Inspector.open(id);

    // Sync Navigator Highlight
    Navigator.highlight(id);

    Hooks.doAction("widget_selected", id);
  },

  updateWidget(id, path, value) {
    // --- NEW: Filter value before updating ---
    value = Hooks.applyFilters("update_widget_value", value, { id, path });

    const widget = Utils.findWidget(id, this.data.widgets);
    if (!widget) return;

    // Update Data Model
    Utils.setObjPath(widget, path, value);

    // Optimized Render: Update styles directly if possible, else full re-render
    if (
      path.startsWith("settings.style") ||
      path.startsWith("settings.advanced")
    ) {
      const el = document.getElementById(id);
      // Note: If it's a custom widget, RenderEngine might not know how to style it
      // unless applyStyles is generic. If generic, this is fine.
      if (el) RenderEngine.applyStyles(el, widget);
    } else {
      this.render(); // Content changes usually affect layout, so re-render
    }

    Hooks.doAction("widget_updated", widget);
  },

  addWidget(type, targetParentId = null, index = null) {
    let newWidget;

    // --- NEW: Hybrid Creation ---
    if (WidgetRegistry.has(type)) {
      newWidget = WidgetRegistry.createInstance(type);
    } else {
      newWidget = Registry.createInstance(type);
    }

    if (!newWidget) return;

    if (targetParentId) {
      const parent = Utils.findWidget(targetParentId, this.data.widgets);
      if (parent && parent.children) {
        if (index !== null) parent.children.splice(index, 0, newWidget);
        else parent.children.push(newWidget);
      }
    } else {
      // Add to Root
      if (index !== null) this.data.widgets.splice(index, 0, newWidget);
      else this.data.widgets.push(newWidget);
    }

    this.render();
    this.selectWidget(newWidget.id);
    this.history.push(this.data);

    Hooks.doAction("widget_added", newWidget);
  },

  deleteWidget(id) {
    Hooks.doAction("before_delete_widget", id);
    if (Utils.deleteWidgetFromTree(id, this.data.widgets)) {
      this.selected = null;
      Inspector.close();
      this.render();
      this.history.push(this.data);
    }
  },

  duplicateWidget(id) {
    const widget = Utils.findWidget(id, this.data.widgets);
    if (widget) {
      const clone = Utils.deepClone(widget);
      Utils.regenerateIds(clone);

      // Find parent array to insert after
      const parentContext = Utils.findParentArray(id, this.data.widgets);
      if (parentContext) {
        const idx = parentContext.array.indexOf(parentContext.item);
        parentContext.array.splice(idx + 1, 0, clone);
        this.render();
        this.history.push(this.data);
      }
    }
  },

  save() {
    const btn = document.getElementById("btn-save");
    btn.textContent = "SAVING...";

    // --- NEW: Allow plugins to modify data before save ---
    const dataToSave = Hooks.applyFilters("save_data", this.data.widgets);

    if (
      window.Pages &&
      window.Pages.update(this.pageId, { widgets: dataToSave })
    ) {
      Hooks.doAction("save_success", this.pageId);
      setTimeout(() => {
        btn.textContent = "UPDATE";
        btn.classList.remove("active"); // Remove 'unsaved changes' indicator if you have one
      }, 800);
    } else {
      btn.textContent = "ERROR";
      Hooks.doAction("save_error", this.pageId);
    }
  },

  bindEvents() {
    // Top Bar Actions
    document.getElementById("btn-save").onclick = () => this.save();
    document.getElementById("btn-undo").onclick = () => this.history.undo();
    document.getElementById("btn-redo").onclick = () => this.history.redo();
    document.getElementById("btn-back").onclick = () =>
      (window.location.href = "dashboard.html");

    // Panels
    document.getElementById("btn-navigator").onclick = () => Navigator.toggle();
    document.getElementById("btn-export").onclick = () =>
      ExportManager.download(this.data);
    document.getElementById("btn-preview").onclick = () =>
      ExportManager.preview(this.data);
    document.querySelectorAll(".btn-panel-grid").forEach((el) => {
      el.onclick = () => Inspector.close();
    });

    // Responsive Toggles (Using Responsive Module)
    document.querySelectorAll("[data-device]").forEach((btn) => {
      btn.onclick = (e) => {
        Responsive.setMode(btn.dataset.device);
      };
    });

    // Background Click (Deselect)
    // We use 'stage' as the main wrapper based on your HTML structure
    const stage = document.getElementById("stage");
    if (stage) {
      stage.addEventListener("click", (e) => {
        // Only deselect if clicking the gray area or the canvas frame, not a widget
        if (
          e.target.id === "stage" ||
          e.target.id === "canvas-frame" ||
          e.target.id === "canvas"
        ) {
          this.selected = null;
          Inspector.close();
          document
            .querySelectorAll(".selected")
            .forEach((el) => el.classList.remove("selected"));
        }
      });
    }
  },
};

window.App = App;
App.init();
