/**
 * Navigator Panel
 */
import { Registry } from './registry.js';

export const Navigator = {
    init() {
        document.getElementById('close-navigator').onclick = () => this.toggle();
        this.makeDraggable(document.getElementById('navigator'));
    },

    toggle() {
        const el = document.getElementById('navigator');
        el.style.display = el.style.display === 'none' ? 'flex' : 'none';
        if(el.style.display === 'flex') this.render(window.App.data.widgets);
    },

    render(widgets) {
        const tree = document.getElementById('navigator-tree');
        tree.innerHTML = '';
        this.buildTreeHtml(widgets, tree, 0);
    },

    buildTreeHtml(widgets, container, depth) {
        widgets.forEach(w => {
            const def = Registry.definitions[w.type];
            const item = document.createElement('div');
            item.className = 'nav-item';
            if (w.id === window.App.selected) item.classList.add('active');
            item.style.paddingLeft = (10 + depth * 15) + 'px';
            item.innerHTML = `<i class="fas ${def.icon}"></i> ${def.label}`;
            
            item.onclick = () => window.App.selectWidget(w.id);
            
            container.appendChild(item);

            if (w.children && w.children.length > 0) {
                this.buildTreeHtml(w.children, container, depth + 1);
            }
        });
    },

    highlight(id) {
        // Simple re-render to update classes
        if(document.getElementById('navigator').style.display !== 'none') {
            this.render(window.App.data.widgets);
        }
    },

    makeDraggable(elmnt) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = elmnt.querySelector('.fp-header');
        if (header) {
            header.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
};