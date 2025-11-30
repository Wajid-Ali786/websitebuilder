/**
 * Inspector Panel (Settings)
 */
import { Registry } from './registry.js';
import { Utils } from './utils.js';

export const Inspector = {
    currentWidgetId: null,

    init() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(btn => {
            btn.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                this.renderTab(btn.dataset.tab);
            };
        });
    },

    open(id) {
        this.currentWidgetId = id;
        document.getElementById('panel-widgets').style.display = 'none';
        document.getElementById('panel-inspector').style.display = 'flex';
        
        const widget = Utils.findWidget(id, window.App.data.widgets);
        const def = Registry.definitions[widget.type];
        document.getElementById('panel-header-title').textContent = `Edit ${def.label}`;
        
        // Default to Content tab
        document.querySelector('[data-tab="content"]').click();
    },

    close() {
        this.currentWidgetId = null;
        document.getElementById('panel-widgets').style.display = 'flex';
        document.getElementById('panel-inspector').style.display = 'none';
        document.getElementById('panel-header-title').textContent = 'Elements';
        
        // Clear selection visual
        const prev = document.querySelector('.selected');
        if(prev) prev.classList.remove('selected');
    },

    renderTab(tabName) {
        const container = document.getElementById('inspector-controls');
        container.innerHTML = '';
        
        const widget = Utils.findWidget(this.currentWidgetId, window.App.data.widgets);
        if (!widget) return;

        const def = Registry.definitions[widget.type];
        let controls = [];

        if (tabName === 'advanced') {
            controls = [
                { label: 'Margin', key: 'margin', type: 'text', path: 'settings.advanced' },
                { label: 'Padding', key: 'padding', type: 'text', path: 'settings.advanced' },
                { label: 'CSS Classes', key: 'classes', type: 'text', path: 'settings.advanced' }
            ];
        } else if (tabName === 'style') {
            controls = (def.inspector && def.inspector.style) || [];
            controls.forEach(c => c.path = 'settings.style'); // Add implicit path
        } else {
            controls = (def.inspector && def.inspector.content) || [];
            controls.forEach(c => c.path = 'content'); // Add implicit path
        }

        if (controls.length === 0) {
            container.innerHTML = '<div style="padding:20px; color:#999; text-align:center;">No options available</div>';
            return;
        }

        controls.forEach(ctrl => {
            const wrapper = document.createElement('div');
            wrapper.className = 'control-group';
            wrapper.innerHTML = `<label class="control-label">${ctrl.label}</label>`;
            
            const fullPath = `${ctrl.path}.${ctrl.key}`;
            const value = Utils.getObjPath(widget, fullPath);

            const input = this.createInput(ctrl, value);
            
            input.addEventListener('input', (e) => {
                window.App.updateWidget(this.currentWidgetId, fullPath, e.target.value);
            });
            
            // Push history on change (blur)
            input.addEventListener('change', () => {
                window.App.history.push(window.App.data);
            });

            wrapper.appendChild(input);
            container.appendChild(wrapper);
        });
    },

    createInput(ctrl, value) {
        let input;
        
        if (ctrl.type === 'textarea') {
            input = document.createElement('textarea');
            input.className = 'control-input';
            input.rows = 4;
        } else if (ctrl.type === 'select') {
            input = document.createElement('select');
            input.className = 'control-input';
            ctrl.options.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt;
                o.text = opt; // Capitalize ideally
                if (opt === value) o.selected = true;
                input.appendChild(o);
            });
            return input; // Return early
        } else if (ctrl.type === 'color') {
            input = document.createElement('input');
            input.type = 'color';
            input.style.width = '100%';
            input.style.height = '40px';
            input.style.cursor = 'pointer';
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'control-input';
        }
        
        input.value = value || '';
        return input;
    }
};