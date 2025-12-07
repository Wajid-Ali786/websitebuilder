/**
 * History Manager (Redo | undo)
 */
import { Utils } from './utils.js';

export class HistoryManager {
    constructor() {
        this.stack = [];
        this.index = -1;
        this.limit = 20;
    }

    push(state) {
        // If we are in middle of stack, cut off future
        if (this.index < this.stack.length - 1) {
            this.stack = this.stack.slice(0, this.index + 1);
        }

        // Deep clone state
        const snap = Utils.deepClone(state);
        
        this.stack.push(snap);
        if (this.stack.length > this.limit) this.stack.shift();
        else this.index++;
        
        console.log('History saved. Index:', this.index);
    }

    undo() {
        if (this.index > 0) {
            this.index--;
            this.restore();
        }
    }

    redo() {
        if (this.index < this.stack.length - 1) {
            this.index++;
            this.restore();
        }
    }

    restore() {
        const state = this.stack[this.index];
        if (state) {
            // Restore Global Data
            window.App.data = Utils.deepClone(state);
            window.App.render();
            // Reselect if valid
            if (window.App.selected && Utils.findWidget(window.App.selected, window.App.data.widgets)) {
                window.App.selectWidget(window.App.selected);
            } else {
                // If deleted item was selected
                import('./inspector.js').then(m => m.Inspector.close());
            }
        }
    }
}