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

// Global App State
const App = {
    pageId: null,
    data: { widgets: [], settings: {} },
    selected: null,
    history: new HistoryManager(),
    
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
                this.data.widgets = page.widgets || [];
                this.data.settings = page.settings || {};
                document.getElementById('page-title').textContent = `Editing: ${page.title}`;
            } else {
                alert("Page not found");
            }
        }
        
        this.render();
        this.history.push(this.data); // Initial State
        this.bindEvents();
    },

    render() {
        const canvas = document.getElementById('canvas');
        canvas.innerHTML = ''; // Clear
        
        // Render Widgets recursively
        this.data.widgets.forEach(widget => {
            const el = RenderEngine.createWidgetElement(widget);
            canvas.appendChild(el);
        });

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
        
        // Sync Navigator
        Navigator.highlight(id);
    },

    updateWidget(id, path, value) {
        const widget = Utils.findWidget(id, this.data.widgets);
        if (!widget) return;

        // Path update: 'content.text' or 'settings.style.color'
        Utils.setObjPath(widget, path, value);
        
        // Re-render only modified widget if possible, or full render for layout changes
        // For MVP, full render is safer but slower. 
        // Optimized: Update DOM style directly for style changes
        if (path.startsWith('settings.style')) {
            const el = document.getElementById(id);
            if (el) RenderEngine.applyStyles(el, widget);
        } else {
            this.render(); // Content change usually requires re-render
        }
        
        // Debounce history save? For now, explicit actions save history.
        // Input changes trigger history on 'change' event in Inspector.
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
            // Root
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
        if (window.Pages.update(this.pageId, { widgets: this.data.widgets })) {
            setTimeout(() => btn.textContent = "UPDATE", 800);
        } else {
            btn.textContent = "ERROR";
        }
    },

    bindEvents() {
        // Top Bar
        document.getElementById('btn-save').onclick = () => this.save();
        document.getElementById('btn-undo').onclick = () => this.history.undo();
        document.getElementById('btn-redo').onclick = () => this.history.redo();
        document.getElementById('btn-back').onclick = () => window.location.href = 'dashboard.html';
        document.getElementById('btn-navigator').onclick = () => Navigator.toggle();
        document.getElementById('btn-export').onclick = () => ExportManager.download(this.data);
        document.getElementById('btn-preview').onclick = () => ExportManager.preview(this.data);

        // Sidebar Toggles
        document.getElementById('btn-panel-grid').onclick = () => Inspector.close();

        // Responsive Toggles
        document.querySelectorAll('[data-device]').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('[data-device]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('canvas').className = `mode-${btn.dataset.device}`;
            };
        });

        // Click Canvas to deselect
        document.getElementById('canvas-wrapper').addEventListener('click', (e) => {
            if (e.target.id === 'canvas-wrapper' || e.target.id === 'canvas') {
                this.selected = null;
                Inspector.close();
                document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
            }
        });
    }
};

window.App = App;
App.init();