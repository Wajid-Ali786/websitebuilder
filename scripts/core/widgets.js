/**
 * WIDGET REGISTRY
 * Manages custom widgets added by plugins.
 */

export const WidgetRegistry = {
    definitions: new Map(),

    /**
     * Register a new widget type
     * @param {object} def { type, title, icon, render, defaults }
     */
    register(def) {
        if (!def.type || !def.render) {
            console.error("Widget definition missing 'type' or 'render' function");
            return;
        }
        this.definitions.set(def.type, def);
        console.log(`Widget registered: ${def.type}`);
    },

    /**
     * Check if a widget type is custom/registered
     * @param {string} type 
     */
    has(type) {
        return this.definitions.has(type);
    },

    /**
     * Get widget definition
     */
    get(type) {
        return this.definitions.get(type);
    },

    /**
     * Create default data instance for a custom widget
     * @param {string} type 
     */
    createInstance(type) {
        const def = this.get(type);
        if (!def) return null;

        return {
            id: 'widget_' + Date.now(),
            type: type,
            settings: { ...def.defaults },
            children: [] // Support nesting if needed
        };
    },

    /**
     * Render a custom widget
     * @param {object} widgetData 
     * @returns {HTMLElement}
     */
    render(widgetData) {
        const def = this.get(widgetData.type);
        if (!def) {
            const err = document.createElement('div');
            err.innerText = `Unknown widget: ${widgetData.type}`;
            err.style.color = 'red';
            return err;
        }

        try {
            // Create wrapper to maintain builder consistency (selection, dnd)
            const wrapper = document.createElement('div');
            wrapper.id = widgetData.id;
            wrapper.classList.add('ce-widget', `widget-${widgetData.type}`);
            wrapper.dataset.type = widgetData.type;
            // Existing builder logic likely relies on this
            
            // Delegate content rendering to the plugin
            const content = def.render(widgetData);
            
            if (content instanceof HTMLElement) {
                wrapper.appendChild(content);
            } else if (typeof content === 'string') {
                wrapper.innerHTML = content;
            }

            return wrapper;
        } catch (e) {
            console.error(`Render error for ${widgetData.type}:`, e);
            return document.createElement('div');
        }
    },
    
    /**
     * Returns list for the UI Inspector/Inserter
     */
    getAll() {
        return Array.from(this.definitions.values());
    }
};