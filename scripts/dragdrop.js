/**
 * Drag and Drop Manager
 */
import { Utils } from './utils.js';

export const DragManager = {
    draggedType: null,
    draggedId: null,
    placeholder: null,

    init() {
        const canvas = document.getElementById('canvas');
        
        // Setup Placeholder
        this.placeholder = document.createElement('div');
        this.placeholder.className = 'drop-line';

        // Canvas Events (Root Drop Zone)
        canvas.addEventListener('dragover', (e) => this.onDragOver(e));
        canvas.addEventListener('drop', (e) => this.onDrop(e));
        
        // Delegate for widget dragstart (sorting)
        canvas.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('ce-widget') || e.target.classList.contains('widget-handle')) {
                // Ensure we get the widget ID
                const widgetEl = e.target.closest('.ce-widget');
                this.draggedId = widgetEl.id;
                this.draggedType = null;
                e.dataTransfer.effectAllowed = 'move';
                e.stopPropagation();
                
                // Add ghost styling
                setTimeout(() => widgetEl.classList.add('ghost-widget'), 0);
            }
        });

        canvas.addEventListener('dragend', (e) => {
            const el = document.querySelector('.ghost-widget');
            if(el) el.classList.remove('ghost-widget');
            if(this.placeholder.parentNode) this.placeholder.parentNode.removeChild(this.placeholder);
        });
    },

    onDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Find closest drop target (Container or Root)
        // Simple logic: insert placeholder based on mouse Y
        const target = e.target.closest('.ce-container') || document.getElementById('canvas');
        
        // Get insertion index
        const afterElement = this.getDragAfterElement(target, e.clientY);
        
        if (afterElement) {
            target.insertBefore(this.placeholder, afterElement);
        } else {
            target.appendChild(this.placeholder);
        }
    },

    onDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Determine parent ID (null if root)
        const dropContainer = this.placeholder.parentNode;
        let parentId = null;
        if (dropContainer.id !== 'canvas') {
            parentId = dropContainer.closest('.ce-widget').id;
        }

        // Determine Index
        const index = Array.from(dropContainer.children).indexOf(this.placeholder);
        
        // Cleanup
        if(this.placeholder.parentNode) this.placeholder.parentNode.removeChild(this.placeholder);

        // Action
        if (e.dataTransfer.getData('type')) {
            // New Widget from Library
            const type = e.dataTransfer.getData('type');
            window.App.addWidget(type, parentId, index);
        } else if (this.draggedId) {
            // Move Existing
            const widget = Utils.findWidget(this.draggedId, window.App.data.widgets);
            if(widget) {
                // Remove from old pos
                Utils.deleteWidgetFromTree(this.draggedId, window.App.data.widgets);
                
                // Add to new pos
                const newWidget = widget; // Reuse object
                
                if (parentId) {
                    const parent = Utils.findWidget(parentId, window.App.data.widgets);
                    if(parent && parent.children) parent.children.splice(index, 0, newWidget);
                } else {
                    window.App.data.widgets.splice(index, 0, newWidget);
                }
                
                window.App.render();
                window.App.selectWidget(this.draggedId);
                window.App.history.push(window.App.data);
            }
        }
        
        this.draggedId = null;
    },

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.ce-widget:not(.ghost-widget)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
};