/**
 * Navigator Panel (Structure Tree)
 * Elementor-style collapsible tree view with drag-and-drop sorting support.
 */
import { Registry } from './registry.js';
import { Utils } from './utils.js';

export const Navigator = {
    // Stores which nodes are expanded (set of IDs)
    expandedNodes: new Set(),
    draggedId: null,

    init() {
        const closeBtn = document.getElementById('close-navigator');
        if (closeBtn) closeBtn.onclick = () => this.toggle();
        
        // Draggable panel logic (Move the window)
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
        branch.dataset.id = widget.id; 

        // 2. Header Row
        const header = document.createElement('div');
        header.className = `nav-header ${isSelected ? 'active' : ''}`;
        header.draggable = true; // Enable Dragging for Item
        
        // Drag Events
        this.bindDragEvents(header, widget);

        // Arrow (Toggle)
        const arrow = document.createElement('div');
        arrow.className = `nav-arrow ${hasChildren || def.isContainer ? '' : 'empty'}`; // Show arrow for empty containers too if needed, or check hasChildren
        // Logic fix: Only show arrow if it HAS children or IS a container (so you can drop into it and expand later)
        // Elementor shows arrow for sections even if empty? Usually only if populated. 
        // Keeping strictly for hasChildren for visual cleaniness, but adding drop logic below.
        if (def.isContainer && !hasChildren) arrow.classList.add('empty'); // Placeholder space
        if (!def.isContainer) arrow.classList.add('empty');

        arrow.innerHTML = hasChildren ? '<i class="fas fa-caret-right"></i>' : '';
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
        label.innerText = def.label; 

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
            window.App.selectWidget(widget.id);
        };
        
        // Right Click
        header.oncontextmenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.App.selectWidget(widget.id);
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

    // --- Drag & Drop Logic for Tree ---
    bindDragEvents(el, widget) {
        el.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            this.draggedId = widget.id;
            el.classList.add('nav-dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', widget.id); // Required for FF
        });

        el.addEventListener('dragend', (e) => {
            el.classList.remove('nav-dragging');
            this.draggedId = null;
            document.querySelectorAll('.nav-drag-over-top, .nav-drag-over-bottom, .nav-drag-over-inside').forEach(node => {
                node.classList.remove('nav-drag-over-top', 'nav-drag-over-bottom', 'nav-drag-over-inside');
            });
        });

        el.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.draggedId === widget.id) return; // Can't drop on self

            e.stopPropagation();
            
            // Calculate Drop Position
            const rect = el.getBoundingClientRect();
            const relY = e.clientY - rect.top;
            const height = rect.height;
            
            // Reset classes
            el.classList.remove('nav-drag-over-top', 'nav-drag-over-bottom', 'nav-drag-over-inside');

            const def = Registry.definitions[widget.type];
            
            // Logic: Top 25% = Before, Bottom 25% = After, Middle 50% = Inside (if container)
            // If not container, Split 50/50 Top/Bottom
            
            if (def.isContainer) {
                if (relY < height * 0.25) el.classList.add('nav-drag-over-top');
                else if (relY > height * 0.75) el.classList.add('nav-drag-over-bottom');
                else el.classList.add('nav-drag-over-inside');
            } else {
                if (relY < height * 0.5) el.classList.add('nav-drag-over-top');
                else el.classList.add('nav-drag-over-bottom');
            }
        });

        el.addEventListener('dragleave', (e) => {
            el.classList.remove('nav-drag-over-top', 'nav-drag-over-bottom', 'nav-drag-over-inside');
        });

        el.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.draggedId === widget.id) return;

            // Determine Action
            let position = 'after';
            if (el.classList.contains('nav-drag-over-top')) position = 'before';
            if (el.classList.contains('nav-drag-over-inside')) position = 'inside';

            this.moveWidget(this.draggedId, widget.id, position);
            
            // Cleanup
            el.classList.remove('nav-drag-over-top', 'nav-drag-over-bottom', 'nav-drag-over-inside');
        });
    },

    moveWidget(movedId, targetId, position) {
        const App = window.App;
        
        // 1. Find Moved Widget & Remove from old location
        const movedCtx = Utils.findParentArray(movedId, App.data.widgets);
        if (!movedCtx) return;
        
        const movedWidget = movedCtx.array.find(w => w.id === movedId);
        
        // Prevent moving parent into child
        if (this.isDescendant(movedWidget, targetId)) {
            alert("Cannot move a parent into its own child.");
            return;
        }

        // Remove from old
        const oldIdx = movedCtx.array.indexOf(movedWidget);
        movedCtx.array.splice(oldIdx, 1);

        // 2. Find Target & Insert
        if (position === 'inside') {
            const targetWidget = Utils.findWidget(targetId, App.data.widgets);
            if (targetWidget && targetWidget.children) {
                targetWidget.children.push(movedWidget);
                // Auto expand target
                this.expandedNodes.add(targetId);
            } else {
                // Fallback if not container (shouldn't happen due to UI logic)
                movedCtx.array.splice(oldIdx, 0, movedWidget); 
            }
        } else {
            // Before or After
            // We need to find the array containing the target
            // If targetId is root, we might not find "parent widget", but findParentArray handles root list too
            const targetCtx = Utils.findParentArray(targetId, App.data.widgets);
            if (targetCtx) {
                let targetIdx = targetCtx.array.findIndex(w => w.id === targetId);
                if (position === 'after') targetIdx++;
                targetCtx.array.splice(targetIdx, 0, movedWidget);
            }
        }

        // 3. Update UI
        App.render(); // Refreshes Canvas
        this.render(App.data.widgets); // Refreshes Tree
        App.history.push(App.data);
    },

    isDescendant(parent, childId) {
        if (!parent.children) return false;
        for (let child of parent.children) {
            if (child.id === childId) return true;
            if (this.isDescendant(child, childId)) return true;
        }
        return false;
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
                el.style.display = ''; 
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
        const el = document.getElementById('navigator');
        if (el && el.style.display !== 'none') {
            this.render(window.App.data.widgets);
        }
    },

    makeDraggable(elmnt) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        // Use user's specific class structure
        const header = elmnt.querySelector('.navegater-mover');
        if (header) {
            header.onmousedown = dragMouseDown;
        } else {
            // Fallback to header if mover class missing
            if(elmnt.querySelector('.fp-header')) elmnt.querySelector('.fp-header').onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            // Don't drag panel if clicking buttons/icons inside header
            if (
             e.target.closest('.nav-header') ||   
              e.target.closest('.nav-icon') ||  
             e.target.closest('.nav-label') ||  
             e.target.closest('.nav-arrow') ||  
             e.target.closest('.nav-eye')        
            ) return;
            
            if(e.target.closest('button') || e.target.closest('.navigator-collapse')) return;
            
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