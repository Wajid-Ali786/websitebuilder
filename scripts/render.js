/**
 * Rendering Engine
 */
import { Registry } from './registry.js';
import { Utils } from './utils.js';

export const RenderEngine = {
    
    createWidgetElement(widget) {
        const def = Registry.definitions[widget.type];
        if (!def) return document.createElement('div');

        // Wrapper
        const wrapper = document.createElement('div');
        wrapper.className = `ce-widget ${widget.type}`;
        wrapper.id = widget.id;
        wrapper.setAttribute('data-type', widget.type);
        
        if (window.App.selected === widget.id) wrapper.classList.add('selected');

        // Apply Styles
        this.applyStyles(wrapper, widget);

        // Content
        if (def.isContainer) {
            wrapper.classList.add('ce-container');
            if (!widget.children.length) wrapper.classList.add('empty');
            
            widget.children.forEach(child => {
                wrapper.appendChild(this.createWidgetElement(child));
            });
        } else {
            // Render inner HTML based on definition
            wrapper.innerHTML = def.renderHtml(widget);
            
            // Setup Inline Editing
            const editTarget = wrapper.firstElementChild; // Usually target is the first child
            if (editTarget && !def.isContainer) {
                this.setupInlineEdit(editTarget, widget);
            }
        }

        // Attach UI Handles
        this.attachHandles(wrapper, widget, def);

        return wrapper;
    },

    applyStyles(el, widget) {
        const style = widget.settings.style || {};
        const adv = widget.settings.advanced || {};
        
        // Define 'def' here to fix ReferenceError
        const def = Registry.definitions[widget.type];

        // Reset styles first to avoid ghosts
        el.style.cssText = ''; 

        // Apply standard styles
        Object.entries(style).forEach(([key, val]) => {
            el.style[key] = val;
        });

        // Apply advanced
        if(adv.margin) el.style.margin = adv.margin;
        if(adv.padding) el.style.padding = adv.padding;
        
        // Classes
        el.className = `ce-widget ${widget.type} ${adv.classes || ''}`;
        
        // Add necessary classes
        if(def && def.isContainer) el.classList.add('ce-container');
        if(window.App.selected === widget.id) el.classList.add('selected');
        if(widget.children && widget.children.length === 0) el.classList.add('empty');
    },

    setupInlineEdit(el, widget) {
        // Simple text editable for MVP
        if (widget.type === 'heading' || widget.type === 'text' || widget.type === 'button') {
            el.contentEditable = true;
            
            // Prevent drag when editing text
            el.onmousedown = (e) => e.stopPropagation();
            
            el.oninput = () => {
                widget.content.text = el.innerText;
            };
            el.onblur = () => {
                window.App.history.push(window.App.data);
            };
        }
    },

    attachHandles(wrapper, widget, def) {
        // Label Handle
        const handle = document.createElement('div');
        handle.className = 'widget-handle';
        handle.innerHTML = `<i class="fas ${def.icon}" style="margin-right:5px"></i> ${def.label}`;
        
        // Controls (Right side)
        const controls = document.createElement('div');
        controls.className = 'widget-controls';
        
        const dupBtn = document.createElement('div');
        dupBtn.className = 'wc-btn';
        dupBtn.innerHTML = '<i class="fas fa-copy"></i>';
        dupBtn.onclick = (e) => { e.stopPropagation(); window.App.duplicateWidget(widget.id); };

        const delBtn = document.createElement('div');
        delBtn.className = 'wc-btn delete';
        delBtn.innerHTML = '<i class="fas fa-times"></i>';
        delBtn.onclick = (e) => { e.stopPropagation(); window.App.deleteWidget(widget.id); };

        controls.appendChild(dupBtn);
        controls.appendChild(delBtn);

        wrapper.appendChild(handle);
        wrapper.appendChild(controls);

        // Click Selection
        wrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            window.App.selectWidget(widget.id);
        });
        
        // Context Menu
        wrapper.addEventListener('contextmenu', (e) => {
            import('./contextmenu.js').then(mod => mod.ContextMenu.show(e, widget.id));
        });
    }
};