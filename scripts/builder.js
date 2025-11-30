
        /**
         * BUILDER MODULE
         * Handles the core logic: Widget Registry, Canvas Manipulation,
         * Settings Panel, and integration with external modules (Firebase/Export).
         */

        // --- 1. State Management ---
        const AppState = {
            widgets: [], // Array of widget objects on canvas
            selectedWidgetId: null,
            history: [],
            currentPageId: null,
            mode: 'edit'
        };

        // --- 2. Widget Registry ---
        // Defines available widgets and their properties
        const WidgetRegistry = {
            'heading': {
                name: 'Heading',
                icon: 'fa-heading',
                defaultData: { text: 'Add Your Heading Text Here', tag: 'h2' },
                render: (data) => `<${data.tag} style="${data.style || ''}">${data.text}</${data.tag}>`,
                controls: {
                    content: [
                        { label: 'Text', type: 'text', key: 'text' },
                        { label: 'HTML Tag', type: 'select', key: 'tag', options: ['h1', 'h2', 'h3', 'h4', 'div'] }
                    ],
                    style: [
                        { label: 'Color', type: 'color', key: 'color' },
                        { label: 'Alignment', type: 'select', key: 'textAlign', options: ['left', 'center', 'right'] }
                    ]
                }
            },
            'text': {
                name: 'Text Editor',
                icon: 'fa-paragraph',
                defaultData: { text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
                render: (data) => `<p style="${data.style || ''}">${data.text}</p>`,
                controls: {
                    content: [
                        { label: 'Content', type: 'textarea', key: 'text' }
                    ],
                    style: [
                        { label: 'Font Size (px)', type: 'number', key: 'fontSize' },
                        { label: 'Color', type: 'color', key: 'color' }
                    ]
                }
            },
            'button': {
                name: 'Button',
                icon: 'fa-mouse-pointer',
                defaultData: { text: 'Click Me', href: '#' },
                render: (data) => `<a href="${data.href}" class="btn-preview" style="display:inline-block; padding: 10px 20px; background: #0073aa; color: white; text-decoration: none; border-radius: 4px; ${data.style || ''}">${data.text}</a>`,
                controls: {
                    content: [
                        { label: 'Label', type: 'text', key: 'text' },
                        { label: 'Link', type: 'text', key: 'href' }
                    ],
                    style: [
                        { label: 'Background Color', type: 'color', key: 'backgroundColor' },
                        { label: 'Text Color', type: 'color', key: 'color' },
                        { label: 'Border Radius', type: 'number', key: 'borderRadius' }
                    ]
                }
            },
            'image': {
                name: 'Image',
                icon: 'fa-image',
                defaultData: { src: 'https://via.placeholder.com/400x200', alt: 'Placeholder' },
                render: (data) => `<img src="${data.src}" alt="${data.alt}" style="max-width: 100%; height: auto; ${data.style || ''}">`,
                controls: {
                    content: [
                        { label: 'Image URL', type: 'text', key: 'src' },
                        { label: 'Alt Text', type: 'text', key: 'alt' }
                    ],
                    style: [
                        { label: 'Width (%)', type: 'number', key: 'width' },
                        { label: 'Border Radius', type: 'number', key: 'borderRadius' }
                    ]
                }
            }
        };

        // --- 3. Initialization & Linking ---
        document.addEventListener('DOMContentLoaded', () => {
            initBuilder();
            loadPlugins(); // Placeholder for plugin system
        });

        function initBuilder() {
            // A. Read Query Params (Link from Dashboard)
            const queryParams = new URLSearchParams(window.location.search);
            AppState.currentPageId = queryParams.get('page');
            const mode = queryParams.get('mode');

            console.log(`[Builder] Initialized. Page: ${AppState.currentPageId}, Mode: ${mode}`);

            // B. Render Widget Sidebar
            renderWidgetSidebar();

            // C. Load Data (Mock)
            if (AppState.currentPageId && mode !== 'new') {
                loadPageData(AppState.currentPageId);
            } else {
                console.log("[Builder] New page mode. Canvas empty.");
            }

            // D. Setup Event Listeners
            document.getElementById('btn-save').addEventListener('click', savePage);
            document.getElementById('btn-export').addEventListener('click', exportPage);
        }

        // --- 4. Core Functions ---

        function renderWidgetSidebar() {
            const list = document.getElementById('widget-list');
            list.innerHTML = '';
            
            Object.keys(WidgetRegistry).forEach(type => {
                const widget = WidgetRegistry[type];
                const item = document.createElement('div');
                item.className = 'widget-item';
                item.innerHTML = `<i class="fas ${widget.icon}"></i><span>${widget.name}</span>`;
                // Simple click-to-add for this demo (easier than DnD for iframe previews)
                item.onclick = () => addWidgetToCanvas(type);
                list.appendChild(item);
            });
        }

        function addWidgetToCanvas(type, existingData = null) {
            const registryItem = WidgetRegistry[type];
            if (!registryItem) return;

            // Remove empty state message if exists
            const emptyMsg = document.querySelector('.empty-canvas-msg');
            if (emptyMsg) emptyMsg.remove();

            // Create Data Object
            const widgetId = 'widget_' + Date.now();
            const widgetData = existingData || { 
                id: widgetId, 
                type: type, 
                data: { ...registryItem.defaultData } // Clone default
            };

            // Store in State
            if (!existingData) AppState.widgets.push(widgetData);

            // Create DOM Element
            const wrapper = document.createElement('div');
            wrapper.className = 'builder-element';
            wrapper.id = widgetData.id;
            wrapper.dataset.widgetType = type;
            wrapper.onclick = (e) => {
                e.stopPropagation();
                selectWidget(widgetData.id);
            };

            // Action Handles (Edit/Delete)
            const actions = document.createElement('div');
            actions.className = 'element-actions';
            actions.innerHTML = `
                <div class="action-handle"><i class="fas fa-arrows-alt"></i></div>
                <div class="action-handle action-delete" onclick="deleteWidget('${widgetData.id}', event)"><i class="fas fa-trash"></i></div>
            `;
            
            // Content Container
            const content = document.createElement('div');
            content.className = 'element-content';
            content.innerHTML = registryItem.render(widgetData.data);

            wrapper.appendChild(actions);
            wrapper.appendChild(content);
            document.getElementById('canvas').appendChild(wrapper);

            // Auto-select new items
            if (!existingData) selectWidget(widgetData.id);
        }

        function selectWidget(id) {
            AppState.selectedWidgetId = id;
            
            // UI Selection Styling
            document.querySelectorAll('.builder-element').forEach(el => el.classList.remove('selected'));
            const el = document.getElementById(id);
            if(el) el.classList.add('selected');

            // Load Settings Panel
            renderSettingsPanel(id);
        }

        function deleteWidget(id, event) {
            if(event) event.stopPropagation();
            
            // Remove from DOM
            const el = document.getElementById(id);
            if(el) el.remove();

            // Remove from State
            AppState.widgets = AppState.widgets.filter(w => w.id !== id);
            
            // Clear settings
            if (AppState.selectedWidgetId === id) {
                AppState.selectedWidgetId = null;
                document.getElementById('settings-content').innerHTML = '<p style="color: #999; text-align: center; margin-top: 20px;">Select an element to edit settings.</p>';
            }
        }

        // --- 5. Settings Panel System ---

        function renderSettingsPanel(widgetId) {
            const widget = AppState.widgets.find(w => w.id === widgetId);
            if (!widget) return;

            const registryItem = WidgetRegistry[widget.type];
            const container = document.getElementById('settings-content');
            container.innerHTML = `<h3>Editing: ${registryItem.name}</h3><hr style="margin: 10px 0; border: 0; border-top: 1px solid #eee;">`;

            // Default to 'content' tab controls, but we'll loop all for now or create tab logic
            // For simplicity in this file, we render Content controls by default
            const controls = registryItem.controls.content || [];
            
            controls.forEach(ctrl => {
                const group = document.createElement('div');
                group.className = 'control-group';
                
                const label = document.createElement('label');
                label.className = 'control-label';
                label.textContent = ctrl.label;

                let input;
                if (ctrl.type === 'textarea') {
                    input = document.createElement('textarea');
                    input.rows = 4;
                } else if (ctrl.type === 'select') {
                    input = document.createElement('select');
                    ctrl.options.forEach(opt => {
                        const option = document.createElement('option');
                        option.value = opt;
                        option.textContent = opt;
                        if(widget.data[ctrl.key] === opt) option.selected = true;
                        input.appendChild(option);
                    });
                } else {
                    input = document.createElement('input');
                    input.type = ctrl.type;
                }
                
                input.className = 'control-input';
                if (ctrl.type !== 'select') input.value = widget.data[ctrl.key] || '';
                
                // Live Update Binding
                input.addEventListener('input', (e) => {
                    widget.data[ctrl.key] = e.target.value;
                    refreshWidgetDisplay(widget.id);
                });

                group.appendChild(label);
                group.appendChild(input);
                container.appendChild(group);
            });
        }

        function refreshWidgetDisplay(widgetId) {
            const widget = AppState.widgets.find(w => w.id === widgetId);
            const el = document.querySelector(`#${widgetId} .element-content`);
            const registryItem = WidgetRegistry[widget.type];
            if (el && registryItem) {
                el.innerHTML = registryItem.render(widget.data);
            }
        }

        // --- 6. Toolbar & External Integrations ---

        function setResponsiveMode(mode, btn) {
            const canvas = document.getElementById('canvas');
            canvas.className = ''; // reset
            if (mode !== 'desktop') canvas.classList.add(`${mode}-mode`);
            
            // Toggle Active Button
            document.querySelectorAll('.toolbar-group .btn-tool').forEach(b => b.classList.remove('active'));
            if(btn) btn.classList.add('active');
        }

        // Mock Firebase Integration
        function savePage() {
            const btn = document.getElementById('btn-save');
            const originalText = btn.textContent;
            btn.textContent = 'Saving...';
            
            setTimeout(() => {
                console.log("[Firebase] Page saved:", AppState.widgets);
                alert("Page saved successfully! (Check console for data structure)");
                btn.textContent = originalText;
            }, 800);
        }

        // Mock Export Integration
        function exportPage() {
            console.log("[Export] Genering HTML/CSS...");
            const html = document.getElementById('canvas').innerHTML;
            alert("Export triggered. HTML content logged to console.");
            console.log(html);
        }

        // Mock Data Loading (Dashboard Link)
        function loadPageData(pageId) {
            console.log(`[Firebase] Loading data for page ${pageId}...`);
            // Simulating an async fetch
            setTimeout(() => {
                // Mock existing data
                const mockData = [
                    { id: 'w1', type: 'heading', data: { text: 'Welcome to My Page', tag: 'h1', textAlign: 'center' } },
                    { id: 'w2', type: 'text', data: { text: 'This content was loaded dynamically from the "database" based on the URL ID.', fontSize: '16', color: '#666' } },
                    { id: 'w3', type: 'button', data: { text: 'Contact Us', href: '#contact', backgroundColor: '#333', color: '#fff', borderRadius: '50' } }
                ];

                // Clear empty state
                const emptyMsg = document.querySelector('.empty-canvas-msg');
                if (emptyMsg) emptyMsg.remove();

                // Rehydrate
                mockData.forEach(w => addWidgetToCanvas(w.type, w));
                AppState.widgets = mockData;
            }, 500);
        }

        // --- 7. Plugin System (Placeholder) ---
        function loadPlugins() {
            // This simulates where /scripts/plugins/loader.js would run
            console.log("[Plugins] System ready. No external plugins loaded.");
            
            // Example of how a plugin would register a new widget:
            /*
            WidgetRegistry['map'] = {
                name: 'Google Map',
                icon: 'fa-map-marker-alt',
                render: () => '<div>[Map Placeholder]</div>'
            };
            renderWidgetSidebar(); // Refresh UI
            */
        }
        
        // Settings Tab Switcher (Visual only for placeholder)
        window.switchTab = (tabName) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            event.target.classList.add('active');
            // In a real app, this would re-render the settings panel with specific controls
            console.log(`[Settings] Switched to ${tabName} tab`);
        };

    