/**
 * Widget Registry & Factories
 */
export const Registry = {
    definitions: {},

    init() {
        // 1. Container
        this.register('container', {
            label: 'Container', icon: 'fa-box', category: 'Layout',
            defaultContent: { minWidth: '' },
            defaultStyle: { 
                display: 'flex', flexDirection: 'column', padding: '20px', 
                minHeight: '50px', backgroundColor: 'transparent', gap: '10px' 
            },
            isContainer: true,
            inspector: {
                content: [
                    {
                        group: 'Layout',
                        controls: [
                            { label: 'Min Width', key: 'minWidth', type: 'text' }
                        ]
                    }
                ],
                style: [
                    {
                        group: 'Flexbox',
                        controls: [
                            { label: 'Direction', key: 'flexDirection', type: 'select', options: ['column', 'row', 'column-reverse', 'row-reverse'] },
                            { label: 'Justify', key: 'justifyContent', type: 'select', options: ['flex-start','center','flex-end','space-between','space-around'] },
                            { label: 'Align Items', key: 'alignItems', type: 'select', options: ['stretch','flex-start','center','flex-end'] },
                            { label: 'Gap', key: 'gap', type: 'text' }
                        ]
                    },
                    {
                        group: 'Background',
                        controls: [
                            { label: 'Color', key: 'backgroundColor', type: 'color' }
                        ]
                    },
                    {
                        group: 'Dimensions',
                        controls: [
                            { label: 'Min Height', key: 'minHeight', type: 'text' },
                            { label: 'Width', key: 'width', type: 'text' }
                        ]
                    }
                ]
            }
        });

        // 2. Heading
        this.register('heading', {
            label: 'Heading', icon: 'fa-heading', category: 'Basic',
            defaultContent: { text: 'Add Your Heading', tag: 'h2' },
            defaultStyle: { color: '#333', textAlign: 'left', fontSize: '32px', marginBottom: '10px' },
            renderHtml: (data) => `<${data.content.tag}>${data.content.text}</${data.content.tag}>`,
            inspector: {
                content: [
                    {
                        group: 'Title',
                        controls: [
                            { label: 'Text', key: 'text', type: 'textarea' },
                            { label: 'HTML Tag', key: 'tag', type: 'select', options: ['h1','h2','h3','h4','div'] }
                        ]
                    }
                ],
                style: [
                    {
                        group: 'Typography',
                        controls: [
                            { label: 'Color', key: 'color', type: 'color' },
                            { label: 'Size', key: 'fontSize', type: 'text' },
                            { label: 'Align', key: 'textAlign', type: 'select', options: ['left','center','right'] }
                        ]
                    }
                ]
            }
        });

        // 3. Text Editor
        this.register('text', {
            label: 'Text Editor', icon: 'fa-align-left', category: 'Basic',
            defaultContent: { text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
            defaultStyle: { color: '#666', textAlign: 'left', fontSize: '16px', lineHeight: '1.6' },
            renderHtml: (data) => `<div>${data.content.text}</div>`,
            inspector: {
                content: [
                    {
                        group: 'Editor',
                        controls: [{ label: 'Content', key: 'text', type: 'textarea' }]
                    }
                ],
                style: [
                    {
                        group: 'Typography',
                        controls: [
                            { label: 'Color', key: 'color', type: 'color' },
                            { label: 'Size', key: 'fontSize', type: 'text' }
                        ]
                    }
                ]
            }
        });

        // 4. Button
        this.register('button', {
            label: 'Button', icon: 'fa-mouse-pointer', category: 'Basic',
            defaultContent: { text: 'Click Here', link: '#' },
            defaultStyle: { 
                backgroundColor: '#9b59b6', color: '#fff', padding: '10px 20px', 
                borderRadius: '4px', display: 'inline-block', textDecoration: 'none' 
            },
            renderHtml: (data) => `<a href="${data.content.link}">${data.content.text}</a>`,
            inspector: {
                content: [
                    {
                        group: 'Button',
                        controls: [
                            { label: 'Text', key: 'text', type: 'text' },
                            { label: 'Link', key: 'link', type: 'text' }
                        ]
                    }
                ],
                style: [
                    {
                        group: 'Button Style',
                        controls: [
                            { label: 'Background', key: 'backgroundColor', type: 'color' },
                            { label: 'Text Color', key: 'color', type: 'color' },
                            { label: 'Radius', key: 'borderRadius', type: 'text' }
                        ]
                    }
                ]
            }
        });

        // 5. Image
        this.register('image', {
            label: 'Image', icon: 'fa-image', category: 'Basic',
            defaultContent: { src: 'https://placehold.co/50x50' },
            defaultStyle: { width: '100%', height: 'auto', borderRadius: '0px' },
            renderHtml: (data) => `<img src="${data.content.src}" alt="img">`,
            inspector: {
                content: [
                    {
                        group: 'Image',
                        controls: [{ label: 'Image URL', key: 'src', type: 'text' }]
                    }
                ],
                style: [
                    {
                        group: 'Dimensions',
                        controls: [
                            { label: 'Width', key: 'width', type: 'text' },
                            { label: 'Radius', key: 'borderRadius', type: 'text' }
                        ]
                    }
                ]
            }
        });

        // Render Sidebar
        this.renderLibrary();
    },

    register(type, def) {
        this.definitions[type] = def;
    },

    createInstance(type) {
        const def = this.definitions[type];
        return {
            id: 'el_' + Date.now() + Math.random().toString(36).substr(2, 4),
            type: type,
            content: JSON.parse(JSON.stringify(def.defaultContent || {})),
            settings: {
                style: JSON.parse(JSON.stringify(def.defaultStyle || {})),
                advanced: { margin: '0', padding: '0', classes: '' }
            },
            children: def.isContainer ? [] : undefined
        };
    },

    renderLibrary() {
        const grid = document.getElementById('widget-grid');
        // Reset grid styles to allow accordion structure
        grid.style.display = 'block'; 
        grid.style.padding = '0';
        grid.className = ''; // Remove existing grid class
        grid.innerHTML = '';

        // Group widgets by category
        const categories = { 'Layout': [], 'Basic': [], 'General': [] };
        
        Object.keys(this.definitions).forEach(type => {
            const def = this.definitions[type];
            const cat = def.category || 'General';
            if(!categories[cat]) categories[cat] = [];
            
            const item = document.createElement('div');
            item.className = 'widget-item';
            item.draggable = true;
            item.innerHTML = `<i class="fas ${def.icon}"></i><span>${def.label}</span>`;
            
            item.ondragstart = (e) => {
                e.dataTransfer.setData('type', type);
                e.dataTransfer.effectAllowed = 'copy';
            };
            item.onclick = () => window.App.addWidget(type);
            
            categories[cat].push(item);
        });

        // Render Accordions
        Object.entries(categories).forEach(([name, items]) => {
            if(items.length === 0) return;

            const section = document.createElement('div');
            section.className = 'widget-category open'; // Open by default
            
            const header = document.createElement('div');
            header.className = 'category-header';
            header.innerHTML = `${name} <i class="fas fa-chevron-down"></i>`;
            header.onclick = () => {
                section.classList.toggle('open');
                const icon = header.querySelector('i');
                icon.style.transform = section.classList.contains('open') ? 'rotate(0deg)' : 'rotate(-90deg)';
            };

            const body = document.createElement('div');
            body.className = 'category-body widget-grid'; // Re-apply grid class here
            items.forEach(i => body.appendChild(i));

            section.appendChild(header);
            section.appendChild(body);
            grid.appendChild(section);
        });
    }
};