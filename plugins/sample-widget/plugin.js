/**
 * SAMPLE PLUGIN
 * Adds a "Notice Box" widget and logs saves via hooks.
 */

export default {
    name: "Sample Notice Widget",
    version: "1.0.0",

    init(api) {
        const { hooks, widgets } = api;

        // 1. Register a new Widget
        widgets.register({
            type: 'notice-box',
            title: 'Notice Box',
            defaults: {
                message: 'This is an important notice!',
                type: 'info' // info, warning, error
            },
            
            // Define how it renders in the Canvas
            render: (data) => {
                const el = document.createElement('div');
                // Basic Styling
                el.style.padding = '15px';
                el.style.margin = '10px 0';
                el.style.borderRadius = '5px';
                el.style.fontFamily = 'sans-serif';
                
                // Content
                const msg = data.settings.message || 'Default Notice';
                const type = data.settings.type || 'info';

                // Type-based styling
                if (type === 'error') {
                    el.style.backgroundColor = '#ffebee';
                    el.style.border = '1px solid #ef5350';
                    el.style.color = '#c62828';
                } else if (type === 'warning') {
                    el.style.backgroundColor = '#fff3e0';
                    el.style.border = '1px solid #ff9800';
                    el.style.color = '#ef6c00';
                } else {
                    el.style.backgroundColor = '#e3f2fd';
                    el.style.border = '1px solid #2196f3';
                    el.style.color = '#1565c0';
                }

                el.innerHTML = `<strong>${type.toUpperCase()}:</strong> ${msg}`;
                return el;
            }
        });

        // 2. Add a Hook (Action)
        hooks.addAction('save_success', (pageId) => {
            api.notify(`Plugin says: Page ${pageId} saved successfully!`);
        });

        // 3. Add a Filter
        // Append a signature to the notice text automatically on save (just as an example)
        hooks.addFilter('save_data', (widgets) => {
            console.log("Plugin is inspecting data before save...");
            return widgets; 
        });
        
        console.log("Sample Plugin Initialized");
    }
};