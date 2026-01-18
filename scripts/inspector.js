/**
 * Inspector Panel (Settings)
 * Handles Content, Style, and Advanced tabs with Accordions and Responsive inputs.
 * MODIFIED: Integrated ControlsManager for Plugin Widgets with Responsive Support.
 * UPDATED: Added advanced Elementor-like styling and enhanced input controls.
 */
import { Registry } from "./registry.js";
import { Utils } from "./utils.js";
import { Responsive } from "./responsive.js";

// --- NEW CORE IMPORTS ---
import { WidgetRegistry } from "./core/widgets.js";
import { ControlsManager } from "./core/controls.js";

export const Inspector = {
  currentWidgetId: null,
  currentTab: "content",

  init() {
    // 1. Setup Tab Switching
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach((btn) => {
      btn.onclick = () => {
        tabs.forEach((t) => t.classList.remove("active"));
        btn.classList.add("active");
        this.currentTab = btn.dataset.tab;
        this.renderTab(this.currentTab);
      };
    });

    // 2. Inject Advanced Inspector Styles
    this.injectStyles();
  },

  injectStyles() {
    if (document.getElementById("inspector-styles")) return;
    const style = document.createElement("style");
    style.id = "inspector-styles";
    style.innerHTML = `
            /* Container & Scroll */
            #panel-inspector { background: #f7f7f7; height: 100%; overflow-y: auto; scrollbar-width: thin; }
            #panel-inspector::-webkit-scrollbar { width: 6px; }
            #panel-inspector::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }

            /* Accordions */
            .accordion { border-bottom: 1px solid #e0e0e0; background: #fff; margin-bottom: 0; }
            .accordion-header { padding: 14px 20px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-weight: 600; color: #444; font-size: 13px; user-select: none; transition: background 0.2s; }
            .accordion-header:hover { background: #fbfbfb; color: #000; }
            .accordion-header i { font-size: 11px; color: #888; transition: transform 0.3s ease; }
            .accordion.active .accordion-header i { transform: rotate(180deg); color: #0073aa; }
            
            .accordion-body { display: none; padding: 20px; background: #fff; border-top: 1px solid #f0f0f0; }
            .accordion.active .accordion-body { display: block; animation: fadeIn 0.3s; }

            /* Controls */
            .control-group { margin-bottom: 18px; position: relative; }
            .control-group:last-child { margin-bottom: 0; }
            .control-label { display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 500; color: #555; margin-bottom: 8px; }
            
            /* Inputs */
            .control-input { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px; color: #333; background: #fff; transition: all 0.2s; box-sizing: border-box; height: 34px; }
            .control-input:focus { border-color: #0073aa; box-shadow: 0 0 0 1px #0073aa; outline: none; }
            textarea.control-input { resize: vertical; min-height: 80px; height: auto; line-height: 1.4; font-family: inherit; }
            
            /* Select Custom Arrow */
            select.control-input { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23555%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 30px; cursor: pointer; }

            /* Color Picker Composite */
            .color-control-wrapper { display: flex; gap: 8px; }
            .color-preview-box { width: 34px; height: 34px; flex-shrink: 0; border: 1px solid #ddd; border-radius: 3px; position: relative; overflow: hidden; background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAH0lEQVQYV2N89+7dfwYkYGRkZBBfVRQeRTA/qiA+RQASuQ31C+369AAAAABJRU5ErkJggg=='); }
            .color-preview-box input[type="color"] { position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; padding: 0; margin: 0; cursor: pointer; opacity: 0; }
            .color-preview-visual { width: 100%; height: 100%; pointer-events: none; border: 2px solid #fff; box-sizing: border-box; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1); }
            
            /* Responsive Hint */
            .responsive-hint { font-size: 11px; color: #2271b1; background: #f0f6fc; padding: 10px; border-radius: 4px; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; border: 1px solid #cce5ff; }
            
            @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        `;
    document.head.appendChild(style);
  },

  open(id) {
    this.currentWidgetId = id;
    document.getElementById("panel-widgets").style.display = "none";
    document.getElementById("panel-inspector").style.display = "flex";

    const widget = Utils.findWidget(id, window.App.data.widgets);

    // --- Hybrid Title Lookup ---
    let label = "Element";
    if (WidgetRegistry.has(widget.type)) {
      label = WidgetRegistry.get(widget.type).title;
    } else if (Registry.definitions[widget.type]) {
      label = Registry.definitions[widget.type].label;
    }

    document.getElementById("panel-header-title").textContent = `Edit ${label}`;

    // Refresh current tab
    this.renderTab(this.currentTab);
  },

  refresh() {
    if (this.currentWidgetId) this.renderTab(this.currentTab);
  },

  close() {
    this.currentWidgetId = null;
    document.getElementById("panel-widgets").style.display = "flex";
    document.getElementById("panel-inspector").style.display = "none";
    document.getElementById("panel-header-title").textContent = "Elements";

    // Clear visual selection
    const prev = document.querySelector(".selected");
    if (prev) prev.classList.remove("selected");
  },

  renderTab(tabName) {
    const container = document.getElementById("inspector-controls");
    container.innerHTML = "";

    const widget = Utils.findWidget(
      this.currentWidgetId,
      window.App.data.widgets,
    );
    if (!widget) return;

    // --- Handle Custom Plugin Widgets ---
    if (WidgetRegistry.has(widget.type)) {
      // 1. Content Tab: Delegate to ControlsManager
      if (tabName === "content") {
        const def = WidgetRegistry.get(widget.type);
        if (def.controls && def.controls.length > 0) {
          // --- RESPONSIVE LOGIC FOR PLUGINS ---
          const modeSettings = {};
          def.controls.forEach((c) => {
            const key = c.name;
            const storageKey = Responsive.getTargetKey(key);
            modeSettings[key] =
              widget.settings[storageKey] !== undefined
                ? widget.settings[storageKey]
                : widget.settings[key] || "";
          });

          // Add visual indicator if in responsive mode
          if (Responsive.mode !== "desktop") {
            const hint = document.createElement("div");
            hint.className = "responsive-hint";
            hint.innerHTML = `<i class="fas ${Responsive.getIcon()}"></i> Editing for <strong>${Responsive.mode.toUpperCase()}</strong>`;
            container.appendChild(hint);
          }

          const controlsEl = ControlsManager.render(
            def.controls,
            modeSettings,
            (key, value) => {
              const targetKey = Responsive.getTargetKey(key);
              window.App.updateWidget(
                this.currentWidgetId,
                "settings." + targetKey,
                value,
              );
            },
          );
          container.appendChild(controlsEl);
        } else {
          container.innerHTML =
            '<div style="padding:20px; color:#999; text-align:center;">No controls available</div>';
        }
        return; // Stop here for Content tab
      }

      // 2. Style Tab: Not yet supported for plugins
      if (tabName === "style") {
        container.innerHTML =
          '<div style="padding:20px; color:#999; text-align:center;">Custom styles via Content tab</div>';
        return;
      }
    }

    // --- Existing Logic for Standard Widgets (or Advanced Tab) ---
    let sections = [];
    const def = Registry.definitions[widget.type];

    // 1. DEFINE SECTIONS (Groups)
    if (tabName === "advanced") {
      sections = [
        {
          group: "Layout",
          controls: [
            {
              label: "Margin",
              key: "margin",
              type: "text",
              path: "settings.advanced",
            },
            {
              label: "Padding",
              key: "padding",
              type: "text",
              path: "settings.advanced",
            },
            {
              label: "Width",
              key: "width",
              type: "select",
              options: ["auto", "100%", "50%", "inline-block"],
              path: "settings.advanced",
            },
            {
              label: "Z-Index",
              key: "zIndex",
              type: "text",
              path: "settings.advanced",
            },
          ],
        },
        {
          group: "Positioning",
          controls: [
            {
              label: "Position",
              key: "position",
              type: "select",
              options: ["static", "relative", "absolute", "fixed"],
              path: "settings.advanced",
            },
            {
              label: "Top",
              key: "top",
              type: "text",
              path: "settings.advanced",
            },
            {
              label: "Left",
              key: "left",
              type: "text",
              path: "settings.advanced",
            },
          ],
        },
        {
          group: "Custom CSS",
          controls: [
            {
              label: "CSS ID",
              key: "id",
              type: "text",
              path: "settings.advanced",
            },
            {
              label: "CSS Classes",
              key: "classes",
              type: "text",
              path: "settings.advanced",
            },
          ],
        },
      ];
    } else if (def && tabName === "style") {
      sections = (def.inspector && def.inspector.style) || [];
      sections.forEach((s) =>
        s.controls.forEach((c) => (c.path = c.path || "settings.style")),
      );
    } else if (def) {
      sections = (def.inspector && def.inspector.content) || [];
      sections.forEach((s) =>
        s.controls.forEach((c) => (c.path = c.path || "content")),
      );
    }

    if (!sections || sections.length === 0) {
      if (container.innerHTML === "") {
        container.innerHTML =
          '<div style="padding:20px; color:#999; text-align:center;">No options available</div>';
      }
      return;
    }

    // 2. RENDER ACCORDIONS (Standard Logic)
    sections.forEach((sectionData, index) => {
      const accordion = document.createElement("div");
      accordion.className = "accordion";
      if (index === 0) accordion.classList.add("active");

      // Header
      const header = document.createElement("div");
      header.className = "accordion-header";
      header.innerHTML = `<span>${sectionData.group || "General"}</span> <i class="fas fa-chevron-down"></i>`;
      header.onclick = () => {
        accordion.classList.toggle("active");
      };

      // Body
      const body = document.createElement("div");
      body.className = "accordion-body";

      // Controls
      sectionData.controls.forEach((ctrl) => {
        const wrapper = document.createElement("div");
        wrapper.className = "control-group";

        // Responsive Icon Indicator
        const isResponsiveTab = tabName !== "content";
        const iconHtml = isResponsiveTab
          ? `<i class="fas ${Responsive.getIcon()}" style="float:right;color:#ccc;font-size:10px;margin-top:3px;margin-left:5px" title="Editing ${Responsive.mode}"></i>`
          : "";

        wrapper.innerHTML = `<label class="control-label"><span>${ctrl.label}</span> ${iconHtml}</label>`;

        // Determine Correct Key
        const baseKey = ctrl.key;
        const storageKey = isResponsiveTab
          ? Responsive.getTargetKey(baseKey)
          : baseKey;
        const fullPath = `${ctrl.path}.${storageKey}`;

        // Get Current Value
        const obj = Utils.getObjPath(widget, ctrl.path);
        const storedValue = obj ? obj[storageKey] : "";

        // Create Input
        const inputWrapper = this.createInput(ctrl, storedValue, (newVal) => {
          window.App.updateWidget(this.currentWidgetId, fullPath, newVal);
          window.App.history.push(window.App.data);
        });

        wrapper.appendChild(inputWrapper);
        body.appendChild(wrapper);
      });

      accordion.appendChild(header);
      accordion.appendChild(body);
      container.appendChild(accordion);
    });
  },

  /**
   * Creates a polished input element based on type
   * Returns a wrapper element or the input itself
   */
  createInput(ctrl, value, onChange) {
    value = value || "";
    let input;

    // 1. TEXTAREA
    if (ctrl.type === "textarea") {
      input = document.createElement("textarea");
      input.className = "control-input";
      input.value = value;
      input.oninput = (e) => onChange(e.target.value);
      return input;
    }

    // 2. SELECT DROPDOWN
    else if (ctrl.type === "select") {
      input = document.createElement("select");
      input.className = "control-input";
      ctrl.options.forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt;
        o.text = opt.charAt(0).toUpperCase() + opt.slice(1);
        if (opt === value) o.selected = true;
        input.appendChild(o);
      });
      input.onchange = (e) => onChange(e.target.value);
      return input;
    }

    // 3. COLOR PICKER (Advanced Composite)
    else if (ctrl.type === "color") {
      const wrapper = document.createElement("div");
      wrapper.className = "color-control-wrapper";

      // Preview Box & Hidden Input
      const box = document.createElement("div");
      box.className = "color-preview-box";

      const colorInput = document.createElement("input");
      colorInput.type = "color";
      colorInput.value = value.startsWith("#") ? value : "#000000";

      const visual = document.createElement("div");
      visual.className = "color-preview-visual";
      visual.style.backgroundColor = value;

      box.appendChild(colorInput);
      box.appendChild(visual);

      // Text Input
      const textInput = document.createElement("input");
      textInput.type = "text";
      textInput.className = "control-input";
      textInput.value = value;
      textInput.placeholder = "#ffffff";

      // Sync Logic
      colorInput.oninput = (e) => {
        const val = e.target.value;
        visual.style.backgroundColor = val;
        textInput.value = val;
        onChange(val);
      };

      textInput.oninput = (e) => {
        const val = e.target.value;
        visual.style.backgroundColor = val;
        // Only update picker if valid hex
        if (/^#[0-9A-F]{6}$/i.test(val)) {
          colorInput.value = val;
        }
        onChange(val);
      };

      wrapper.appendChild(box);
      wrapper.appendChild(textInput);
      return wrapper;
    }

    // 4. STANDARD TEXT INPUT
    else {
      input = document.createElement("input");
      input.type = "text";
      input.className = "control-input";
      input.value = value;
      input.oninput = (e) => onChange(e.target.value);
      return input;
    }
  },
};
