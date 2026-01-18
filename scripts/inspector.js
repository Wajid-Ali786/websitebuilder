/**
 * Inspector Panel (Settings)
 * Handles Content, Style, and Advanced tabs with Accordions and Responsive inputs.
 */
import { Registry } from './registry.js';
import { Utils } from './utils.js';
import { Responsive } from './responsive.js';

export const Inspector = {
    currentWidgetId: null,
    currentTab: 'content',

    init() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(btn => {
            btn.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                this.currentTab = btn.dataset.tab;
                this.renderTab(this.currentTab);
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
        
        // Refresh current tab
        this.renderTab(this.currentTab);
    },

    refresh() {
        if (this.currentWidgetId) this.renderTab(this.currentTab);
    },

    close() {
        this.currentWidgetId = null;
        document.getElementById('panel-widgets').style.display = 'flex';
        document.getElementById('panel-inspector').style.display = 'none';
        document.getElementById('panel-header-title').textContent = 'Elements';
        
        // Clear visual selection
        const prev = document.querySelector('.selected');
        if(prev) prev.classList.remove('selected');
    },

    renderTab(tabName) {
        const container = document.getElementById('inspector-controls');
        container.innerHTML = '';
        
        const widget = Utils.findWidget(this.currentWidgetId, window.App.data.widgets);
        if (!widget) return;

        const def = Registry.definitions[widget.type];
        let sections = [];

        // 1. DEFINE SECTIONS (Groups)
        if (tabName === 'advanced') {
            // Global Advanced Controls
            sections = [
                {
                    group: 'Layout',
                    controls: [
                        { label: 'Margin', key: 'margin', type: 'text', path: 'settings.advanced' },
                        { label: 'Padding', key: 'padding', type: 'text', path: 'settings.advanced' },
                        { label: 'Width', key: 'width', type: 'select', options: ['auto', '100%', '50%', 'inline-block'], path: 'settings.advanced' },
                        { label: 'Z-Index', key: 'zIndex', type: 'text', path: 'settings.advanced' },
                    ]
                },
                {
                    group: 'Positioning',
                    controls: [
                        { label: 'Position', key: 'position', type: 'select', options: ['static', 'relative', 'absolute', 'fixed'], path: 'settings.advanced' },
                        { label: 'Top', key: 'top', type: 'text', path: 'settings.advanced' },
                        { label: 'Left', key: 'left', type: 'text', path: 'settings.advanced' },
                    ]
                },
                {
                    group: 'Custom CSS',
                    controls: [
                        { label: 'CSS ID', key: 'id', type: 'text', path: 'settings.advanced' },
                        { label: 'CSS Classes', key: 'classes', type: 'text', path: 'settings.advanced' },
                    ]
                }
            ];
        } else if (tabName === 'style') {
            sections = (def.inspector && def.inspector.style) || [];
            // Ensure implicit path
            sections.forEach(s => s.controls.forEach(c => c.path = c.path || 'settings.style'));
        } else {
            sections = (def.inspector && def.inspector.content) || [];
            // Ensure implicit path
            sections.forEach(s => s.controls.forEach(c => c.path = c.path || 'content'));
        }

        if (!sections || sections.length === 0) {
            container.innerHTML = '<div style="padding:20px; color:#999; text-align:center;">No options available</div>';
            return;
        }

        // 2. RENDER ACCORDIONS
        sections.forEach((sectionData, index) => {
            // Create Accordion Shell
            const accordion = document.createElement('div');
            accordion.className = 'accordion';
            if(index === 0) accordion.classList.add('active'); // Open first by default

            // Header
            const header = document.createElement('div');
            header.className = 'accordion-header';
            header.innerHTML = `<span>${sectionData.group || 'General'}</span> <i class="fas fa-chevron-down"></i>`;
            header.onclick = () => {
                accordion.classList.toggle('active');
            };

            // Body
            const body = document.createElement('div');
            body.className = 'accordion-body';

            // Controls inside body
            sectionData.controls.forEach(ctrl => {
                const wrapper = document.createElement('div');
                wrapper.className = 'control-group';
                
                // Responsive Icon Indicator
                // Content tab usually isn't responsive, but Style/Advanced are.
                const isResponsiveTab = tabName !== 'content';
                const iconHtml = isResponsiveTab 
                    ? `<i class="fas ${Responsive.getIcon()}" style="float:right;color:#ccc;font-size:10px;margin-top:3px;" title="Editing ${Responsive.mode}"></i>` 
                    : '';

                wrapper.innerHTML = `<label class="control-label">${ctrl.label} ${iconHtml}</label>`;
                
                // Determine Correct Key (Handle Mobile/Tablet suffixes)
                const baseKey = ctrl.key;
                const storageKey = isResponsiveTab ? Responsive.getTargetKey(baseKey) : baseKey;
                const fullPath = `${ctrl.path}.${storageKey}`;
                
                // Get Current Value from Widget
                // We want the raw stored value for the input, not the computed fallback
                const obj = Utils.getObjPath(widget, ctrl.path);
                const storedValue = obj ? obj[storageKey] : '';

                // Create Input
                const input = this.createInput(ctrl, storedValue);
                
                // Input Event (Live Update)
                input.addEventListener('input', (e) => {
                    window.App.updateWidget(this.currentWidgetId, fullPath, e.target.value);
                });
                
                // Change Event (History)
                input.addEventListener('change', () => {
                    window.App.history.push(window.App.data);
                });

                wrapper.appendChild(input);
                body.appendChild(wrapper);
            });

            accordion.appendChild(header);
            accordion.appendChild(body);
            container.appendChild(accordion);
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
                // Capitalize first letter
                o.text = opt.charAt(0).toUpperCase() + opt.slice(1);
                if (opt === value) o.selected = true;
                input.appendChild(o);
            });
            return input; 
        } else if (ctrl.type === 'color') {
            input = document.createElement('input');
            input.type = 'color';
            // Styling the color input to look good
            input.style.width = '100%';
            input.style.height = '35px';
            input.style.cursor = 'pointer';
            input.style.border = '1px solid #ddd';
            input.style.padding = '2px';
            input.style.borderRadius = '3px';
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'control-input';
        }
        
        input.value = value || '';
        return input;
    }
};