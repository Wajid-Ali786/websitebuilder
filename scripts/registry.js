/**
 * Widget Registry & Factories
 */
export const Registry = {
    definitions: {},

    init() {
        // Register Core Widgets
        
        // 1. Container
        this.register('container', {
            label: 'Container', icon: 'fa-box',
            defaultContent: {},
            defaultStyle: { 
                display: 'flex', flexDirection: 'column', padding: '20px', 
                minHeight: '100px', backgroundColor: 'transparent', gap: '10px' 
            },
            isContainer: true,
            inspector: {
                style: [
                    { label: 'Direction', key: 'flexDirection', type: 'select', options: ['column', 'row'] },
                    { label: 'Justify', key: 'justifyContent', type: 'select', options: ['flex-start','center','flex-end','space-between'] },
                    { label: 'Align', key: 'alignItems', type: 'select', options: ['flex-start','center','flex-end'] },
                    { label: 'Gap', key: 'gap', type: 'text' },
                    { label: 'Background', key: 'backgroundColor', type: 'color' },
                    { label: 'Min Height', key: 'minHeight', type: 'text' }
                ]
            }
        });

        // 2. Heading
        this.register('heading', {
            label: 'Heading', icon: 'fa-heading',
            defaultContent: { text: 'Add Your Heading', tag: 'h2' },
            defaultStyle: { color: '#333', textAlign: 'left', fontSize: '32px', marginBottom: '10px' },
            renderHtml: (data) => `<${data.content.tag}>${data.content.text}</${data.content.tag}>`,
            inspector: {
                content: [
                    { label: 'Text', key: 'text', type: 'textarea' },
                    { label: 'Tag', key: 'tag', type: 'select', options: ['h1','h2','h3','h4','div'] }
                ],
                style: [
                    { label: 'Color', key: 'color', type: 'color' },
                    { label: 'Align', key: 'textAlign', type: 'select', options: ['left','center','right'] },
                    { label: 'Size', key: 'fontSize', type: 'text' }
                ]
            }
        });

        // 3. Text Editor
        this.register('text', {
            label: 'Text Editor', icon: 'fa-align-left',
            defaultContent: { text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
            defaultStyle: { color: '#666', textAlign: 'left', fontSize: '16px', lineHeight: '1.6' },
            renderHtml: (data) => `<div>${data.content.text}</div>`,
            inspector: {
                content: [ { label: 'Content', key: 'text', type: 'textarea' } ],
                style: [
                    { label: 'Color', key: 'color', type: 'color' },
                    { label: 'Size', key: 'fontSize', type: 'text' }
                ]
            }
        });

        // 4. Button
        this.register('button', {
            label: 'Button', icon: 'fa-mouse-pointer',
            defaultContent: { text: 'Click Here', link: '#' },
            defaultStyle: { 
                backgroundColor: '#9b59b6', color: '#fff', padding: '10px 20px', 
                borderRadius: '4px', display: 'inline-block', textDecoration: 'none' 
            },
            renderHtml: (data) => `<a href="${data.content.link}">${data.content.text}</a>`,
            inspector: {
                content: [
                    { label: 'Text', key: 'text', type: 'text' },
                    { label: 'Link', key: 'link', type: 'text' }
                ],
                style: [
                    { label: 'Background', key: 'backgroundColor', type: 'color' },
                    { label: 'Text Color', key: 'color', type: 'color' },
                    { label: 'Radius', key: 'borderRadius', type: 'text' }
                ]
            }
        });

        // 5. Image
        this.register('image', {
            label: 'Image', icon: 'fa-image',
            defaultContent: { src: 'https://via.placeholder.com/600x300' },
            defaultStyle: { width: '100%', height: 'auto', borderRadius: '0px' },
            renderHtml: (data) => `<img src="${data.content.src}" alt="img">`,
            inspector: {
                content: [ { label: 'Image URL', key: 'src', type: 'text' } ],
                style: [
                    { label: 'Width', key: 'width', type: 'text' },
                    { label: 'Radius', key: 'borderRadius', type: 'text' }
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
        grid.innerHTML = '';
        Object.keys(this.definitions).forEach(type => {
            const def = this.definitions[type];
            const item = document.createElement('div');
            item.className = 'widget-item';
            item.draggable = true;
            item.innerHTML = `<i class="fas ${def.icon}"></i><span>${def.label}</span>`;
            
            // Drag Start
            item.ondragstart = (e) => {
                e.dataTransfer.setData('type', type);
                e.dataTransfer.effectAllowed = 'copy';
            };
            
            // Click to add
            item.onclick = () => window.App.addWidget(type);
            
            grid.appendChild(item);
        });
    }
};