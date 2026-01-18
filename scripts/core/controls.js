/**
 * CONTROLS MANAGER
 * Renders Elementor-style controls (inputs) for widgets.
 */

export const ControlsManager = {
    
    // Registry of available control types
    types: {
        
        /**
         * Text Input
         */
        text: (control, value, onChange) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'control-group';
            
            const label = document.createElement('label');
            label.innerText = control.label;
            
            const input = document.createElement('input');
            input.type = 'text';
            input.value = value || control.default || '';
            input.placeholder = control.placeholder || '';
            
            input.oninput = (e) => onChange(control.name, e.target.value);
            
            wrapper.appendChild(label);
            wrapper.appendChild(input);
            return wrapper;
        },

        /**
         * Color Picker
         */
        color: (control, value, onChange) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'control-group';
            
            const label = document.createElement('label');
            label.innerText = control.label;
            
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';

            const input = document.createElement('input');
            input.type = 'color';
            input.value = value || control.default || '#000000';
            
            const textDisplay = document.createElement('span');
            textDisplay.innerText = input.value;
            textDisplay.style.marginLeft = '10px';
            textDisplay.style.fontSize = '12px';

            input.oninput = (e) => {
                onChange(control.name, e.target.value);
                textDisplay.innerText = e.target.value;
            };

            div.appendChild(input);
            div.appendChild(textDisplay);
            wrapper.appendChild(label);
            wrapper.appendChild(div);
            return wrapper;
        },

        /**
         * Select Dropdown
         */
        select: (control, value, onChange) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'control-group';
            
            const label = document.createElement('label');
            label.innerText = control.label;
            
            const select = document.createElement('select');
            
            if (control.options) {
                Object.entries(control.options).forEach(([optVal, optLabel]) => {
                    const option = document.createElement('option');
                    option.value = optVal;
                    option.innerText = optLabel;
                    if (optVal === (value || control.default)) option.selected = true;
                    select.appendChild(option);
                });
            }

            select.onchange = (e) => onChange(control.name, e.target.value);
            
            wrapper.appendChild(label);
            wrapper.appendChild(select);
            return wrapper;
        },

        /**
         * Slider (Range)
         */
        slider: (control, value, onChange) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'control-group';

            const topRow = document.createElement('div');
            topRow.style.display = 'flex';
            topRow.style.justifyContent = 'space-between';
            
            const label = document.createElement('label');
            label.innerText = control.label;
            
            const valDisplay = document.createElement('span');
            valDisplay.innerText = (value || control.default || 0) + (control.unit || 'px');
            valDisplay.style.fontSize = '11px';

            topRow.appendChild(label);
            topRow.appendChild(valDisplay);

            const input = document.createElement('input');
            input.type = 'range';
            input.min = control.min || 0;
            input.max = control.max || 100;
            input.step = control.step || 1;
            input.value = parseFloat(value) || parseFloat(control.default) || 0;
            input.style.width = '100%';

            input.oninput = (e) => {
                const val = e.target.value + (control.unit || 'px');
                valDisplay.innerText = val;
                onChange(control.name, val); // Return value with unit
            };

            wrapper.appendChild(topRow);
            wrapper.appendChild(input);
            return wrapper;
        }
    },

    /**
     * Render a list of controls
     * @param {Array} controlsList - Array of control definitions
     * @param {Object} currentSettings - Current values of the widget
     * @param {Function} onUpdate - Callback(key, value)
     */
    render(controlsList, currentSettings, onUpdate) {
        const container = document.createElement('div');
        container.className = 'controls-container';
        
        // Basic CSS for controls (injected here for simplicity)
        container.innerHTML = `
            <style>
                .controls-container .control-group { margin-bottom: 15px; }
                .controls-container label { display: block; font-size: 12px; margin-bottom: 5px; font-weight: 600; color: #555; }
                .controls-container input[type="text"], .controls-container select { width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; }
            </style>
        `;

        controlsList.forEach(control => {
            const renderer = this.types[control.type];
            if (renderer) {
                // Get value safely (supports nested paths like 'style.color' if flattened, 
                // but usually controls map to flat settings or specific groups. 
                // For simplicity, we assume flat settings keys here: settings[control.name])
                const val = currentSettings[control.name];
                
                const el = renderer(control, val, onUpdate);
                container.appendChild(el);
            } else {
                console.warn(`Unknown control type: ${control.type}`);
            }
        });

        return container;
    }
};