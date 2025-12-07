/**
 * Navigator Panel (Structure Tree)
 * Elementor-style collapsible tree view with drag-and-drop sorting support.
 */
import { Registry } from './registry.js';
import { Utils } from './utils.js';

export const Navigator = {
    // Stores which nodes are expanded (set of IDs)
    expandedNodes: new Set(),

    init() {
        const closeBtn = document.getElementById('close-navigator');
        if (closeBtn) closeBtn.onclick = () => this.toggle();
        
        // Draggable panel logic
        const panel = document.getElementById('navigator');
        if (panel) this.makeDraggable(panel);
    },

    toggle() {
        const el = document.getElementById('navigator');
        if (!el) return;
        
        const isVisible = el.style.display === 'flex';
        el.style.display = isVisible ? 'none' : 'flex';
        
        if (!isVisible) {
            this.render(window.App.data.widgets);
        }
    },

    /**
     * Renders the full tree
     */
    render(widgets) {
        const treeContainer = document.getElementById('navigator-tree');
        if (!treeContainer) return;
        
        treeContainer.innerHTML = ''; // Clear
        
        // Build recursively
        widgets.forEach(widget => {
            const branch = this.createBranch(widget);
            treeContainer.appendChild(branch);
        });
    },

    /**
     * Creates a branch (Header + Children Container)
     */
    createBranch(widget) {
        const def = Registry.definitions[widget.type];
        const hasChildren = widget.children && widget.children.length > 0;
        const isExpanded = this.expandedNodes.has(widget.id);
        const isSelected = window.App.selected === widget.id;

        // 1. Branch Wrapper
        const branch = document.createElement('div');
        branch.className = `nav-branch ${isExpanded ? 'expanded' : ''}`;
        branch.dataset.id = widget.id; // Helper for context menu

        // 2. Header Row
        const header = document.createElement('div');
        header.className = `nav-header ${isSelected ? 'active' : ''}`;
        
        // Arrow (Toggle)
        const arrow = document.createElement('div');
        arrow.className = `nav-arrow ${hasChildren ? '' : 'empty'}`;
        arrow.innerHTML = '<i class="fas fa-caret-right"></i>';
        arrow.onclick = (e) => {
            e.stopPropagation();
            if (hasChildren) {
                this.toggleExpand(widget.id, branch);
            }
        };

        // Icon & Label
        const icon = document.createElement('div');
        icon.className = 'nav-icon';
        icon.innerHTML = `<i class="fas ${def.icon}"></i>`;

        const label = document.createElement('div');
        label.className = 'nav-label';
        label.innerText = def.label; // Could use widget content text/name if available

        // Visibility Toggle
        const eye = document.createElement('div');
        eye.className = 'nav-eye';
        eye.innerHTML = '<i class="fas fa-eye"></i>';
        eye.title = 'Toggle Visibility';
        eye.onclick = (e) => {
            e.stopPropagation();
            this.toggleVisibility(widget.id, eye);
        };

        // Assemble Header
        header.appendChild(arrow);
        header.appendChild(icon);
        header.appendChild(label);
        header.appendChild(eye);

        // Click to Select
        header.onclick = (e) => {
            // Support multi-select logic later if needed
            window.App.selectWidget(widget.id);
        };
        
        // Right Click (Context Menu)
        header.oncontextmenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Select it visually first
            window.App.selectWidget(widget.id);
            // Trigger Context Menu (imported dynamically to avoid cycle if needed, or via global)
            import('./contextmenu.js').then(mod => mod.ContextMenu.show(e, 'navigator', widget.id));
        };

        branch.appendChild(header);

        // 3. Children Container
        if (hasChildren) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'nav-children';
            
            widget.children.forEach(child => {
                const childBranch = this.createBranch(child);
                childrenContainer.appendChild(childBranch);
            });
            
            branch.appendChild(childrenContainer);
        }

        return branch;
    },

    toggleExpand(id, branchEl) {
        if (this.expandedNodes.has(id)) {
            this.expandedNodes.delete(id);
            branchEl.classList.remove('expanded');
        } else {
            this.expandedNodes.add(id);
            branchEl.classList.add('expanded');
        }
    },

    toggleVisibility(id, iconEl) {
        const el = document.getElementById(id);
        if (el) {
            const current = el.style.display;
            if (current === 'none') {
                el.style.display = ''; // Restore
                iconEl.classList.remove('hidden');
                iconEl.innerHTML = '<i class="fas fa-eye"></i>';
            } else {
                el.style.display = 'none';
                iconEl.classList.add('hidden');
                iconEl.innerHTML = '<i class="fas fa-eye-slash"></i>';
            }
        }
    },

    highlight(id) {
        // If navigator is open, re-render to show active state
        const el = document.getElementById('navigator');
        if (el && el.style.display !== 'none') {
            this.render(window.App.data.widgets);
            
            // Auto-expand parents to show selected item
            // (Optional enhancement: traverse parents and add to expandedNodes)
        }
    },

    makeDraggable(elmnt) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = elmnt.querySelector('.navegater-mover');
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