/**
 * Main Builder Controller
 */
import { Registry } from './registry.js';
import { Inspector } from './inspector.js';
import { RenderEngine } from './render.js';
import { HistoryManager } from './history.js';
import { DragManager } from './dragdrop.js';
import { Navigator } from './navigator.js';
import { ContextMenu } from './contextmenu.js';
import { ExportManager } from './export.js';
import { Utils } from './utils.js';
import { Responsive } from './responsive.js';

// Global App State
const App = {
    pageId: null,
    data: { widgets: [], settings: {} },
    selected: null,
    history: new HistoryManager(),
    clipboard: null, // For copy/paste
    
    init() {
        const params = new URLSearchParams(window.location.search);
        this.pageId = params.get('page');
        
        // Init Modules
        Registry.init();
        Inspector.init();
        DragManager.init();
        Navigator.init();
        ContextMenu.init();
        
        // Load Page
        if (this.pageId && window.Pages) {
            const page = window.Pages.getById(this.pageId);
            if (page) {
                // Ensure data structures exist
                this.data.widgets = page.widgets || [];
                this.data.settings = page.settings || {};
                
                const titleEl = document.getElementById('page-title');
                if(titleEl) titleEl.textContent = `Editing: ${page.title}`;
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
        const canvas = document.getElementById('canvas');
        if (!canvas) return;
        
        canvas.innerHTML = ''; // Clear current view
        
        // Render Widgets recursively using the RenderEngine
        this.data.widgets.forEach(widget => {
            const el = RenderEngine.createWidgetElement(widget);
            canvas.appendChild(el);
        });

        // Sync Navigator
        Navigator.render(this.data.widgets);
    },

    selectWidget(id) {
        this.selected = id;
        
        // Highlight in UI
        document.querySelectorAll('.ce-widget').forEach(el => el.classList.remove('selected'));
        const el = document.getElementById(id);
        if (el) el.classList.add('selected');

        // Open Inspector
        Inspector.open(id);
        
        // Sync Navigator Highlight
        Navigator.highlight(id);
    },

    updateWidget(id, path, value) {
        const widget = Utils.findWidget(id, this.data.widgets);
        if (!widget) return;

        // Update Data Model
        Utils.setObjPath(widget, path, value);
        
        // Optimized Render: Update styles directly if possible, else full re-render
        if (path.startsWith('settings.style') || path.startsWith('settings.advanced')) {
            const el = document.getElementById(id);
            if (el) RenderEngine.applyStyles(el, widget);
        } else {
            this.render(); // Content changes usually affect layout, so re-render
        }
    },

    addWidget(type, targetParentId = null, index = null) {
        const newWidget = Registry.createInstance(type);
        
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
    },

    deleteWidget(id) {
        if(Utils.deleteWidgetFromTree(id, this.data.widgets)) {
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
        const btn = document.getElementById('btn-save');
        btn.textContent = "SAVING...";
        
        if (window.Pages && window.Pages.update(this.pageId, { widgets: this.data.widgets })) {
            setTimeout(() => {
                btn.textContent = "UPDATE";
                btn.classList.remove('active'); // Remove 'unsaved changes' indicator if you have one
            }, 800);
        } else {
            btn.textContent = "ERROR";
        }
    },

    bindEvents() {
        // Top Bar Actions
        document.getElementById('btn-save').onclick = () => this.save();
        document.getElementById('btn-undo').onclick = () => this.history.undo();
        document.getElementById('btn-redo').onclick = () => this.history.redo();
        document.getElementById('btn-back').onclick = () => window.location.href = 'dashboard.html';
        
        // Panels
        document.getElementById('btn-navigator').onclick = () => Navigator.toggle();
        document.getElementById('btn-export').onclick = () => ExportManager.download(this.data);
        document.getElementById('btn-preview').onclick = () => ExportManager.preview(this.data);
        document.querySelectorAll('.btn-panel-grid').forEach(el => {el.onclick = () => Inspector.close();});
        

        // Responsive Toggles (Using Responsive Module)
        document.querySelectorAll('[data-device]').forEach(btn => {
            btn.onclick = (e) => {
                Responsive.setMode(btn.dataset.device);
            };
        });

        // Background Click (Deselect)
        // We use 'stage' as the main wrapper based on your HTML structure
        const stage = document.getElementById('stage');
        if (stage) {
            stage.addEventListener('click', (e) => {
                // Only deselect if clicking the gray area or the canvas frame, not a widget
                if (e.target.id === 'stage' || e.target.id === 'canvas-frame' || e.target.id === 'canvas') {
                    this.selected = null;
                    Inspector.close();
                    document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
                }
            });
        }
    }
};

window.App = App;
App.init();