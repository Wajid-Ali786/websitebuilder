/**
 * Rendering Engine
 */
import { Registry } from './registry.js';
import { Utils } from './utils.js';
import { Responsive } from './responsive.js';

export const RenderEngine = {
    
    createWidgetElement(widget) {
        const def = Registry.definitions[widget.type];
        if (!def) return document.createElement('div');

        // Wrapper
        const wrapper = document.createElement('div');
        wrapper.className = `ce-widget ${widget.type}`;
        wrapper.id = widget.id;
        wrapper.setAttribute('data-type', widget.type);
        
        // Restore selection state
        if (window.App.selected === widget.id) wrapper.classList.add('selected');

        // Apply Styles (Responsive aware)
        this.applyStyles(wrapper, widget);

        // Content
        if (def.isContainer) {
            wrapper.classList.add('ce-container');
            if (!widget.children || widget.children.length === 0) wrapper.classList.add('empty');
            
            if (widget.children) {
                widget.children.forEach(child => {
                    wrapper.appendChild(this.createWidgetElement(child));
                });
            }
        } else {
            // Render inner HTML based on definition
            wrapper.innerHTML = def.renderHtml(widget);
            
            // Setup Inline Editing (e.g. for Text/Heading)
            const editTarget = wrapper.firstElementChild; 
            if (editTarget && !def.isContainer) {
                this.setupInlineEdit(editTarget, widget);
            }
        }

        // Attach UI Handles (Drag handle, Delete button, etc)
        this.attachHandles(wrapper, widget, def);

        return wrapper;
    },

    applyStyles(el, widget) {
        const style = widget.settings.style || {};
        const adv = widget.settings.advanced || {};
        const def = Registry.definitions[widget.type]; // Defined here to avoid reference error

        // Reset styles first to avoid ghosts from previous renders
        el.style.cssText = ''; 

        // 1. Apply Standard Styles (Responsive Aware)
        Object.keys(style).forEach((key) => {
            // Filter out internal responsive keys (e.g. fontSize_mobile)
            // We only want to apply the resolved value to the base CSS property
            if (!key.includes('_mobile') && !key.includes('_tablet')) {
                const val = Responsive.getStyleValue(style, key);
                // Convert camelCase to kebab-case for CSS property check if needed, 
                // but el.style[camelCase] usually works in JS.
                if (val !== undefined && val !== '') {
                    el.style[key] = val;
                }
            }
        });

        // 2. Apply Advanced Styles (Responsive Aware)
        // Common advanced keys
        const advKeys = ['margin', 'padding', 'width', 'top', 'bottom', 'left', 'right', 'borderRadius'];
        advKeys.forEach(key => {
            const val = Responsive.getStyleValue(adv, key);
            if (val) el.style[key] = val;
        });

        // 3. Apply Non-Responsive Advanced (Static)
        if (adv.position) el.style.position = adv.position;
        if (adv.zIndex) el.style.zIndex = adv.zIndex;
        if (adv.display) el.style.display = adv.display;

        // 4. Classes
        el.className = `ce-widget ${widget.type} ${adv.classes || ''}`;
        
        // Re-apply internal classes
        if(def && def.isContainer) el.classList.add('ce-container');
        if(window.App.selected === widget.id) el.classList.add('selected');
        if(widget.children && widget.children.length === 0) el.classList.add('empty');
    },

    setupInlineEdit(el, widget) {
        const def = Registry.definitions[widget.type];
        // Only allow inline edit if definition says so or it's a known text type
        if (widget.type === 'heading' || widget.type === 'text' || widget.type === 'button') {
            el.contentEditable = true;
            
            // Prevent drag when clicking text to edit
            el.onmousedown = (e) => e.stopPropagation();
            
            el.oninput = () => {
                widget.content.text = el.innerText;
                // Note: In a full app, you might debounce saving history here
            };
            el.onblur = () => {
                window.App.history.push(window.App.data);
            };
        }
    },

    attachHandles(wrapper, widget, def) {
        // Label Handle (Top Left)
        const handle = document.createElement('div');
        handle.className = 'widget-handle';
        handle.innerHTML = `<i class="fas ${def.icon}" style="margin-right:5px"></i> ${def.label}`;
        
        // Controls (Top Right)
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
            import('./contextmenu.js').then(mod => mod.ContextMenu.show(e, 'widget', widget.id));
        });
    }
};