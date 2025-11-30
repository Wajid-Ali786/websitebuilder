export const Utils = {
    // Generate UUID
    uid() {
        return 'el_' + Date.now() + Math.random().toString(36).substr(2, 5);
    },

    // Get deeply nested property
    getObjPath(obj, path) {
        return path.split('.').reduce((o, i) => o ? o[i] : null, obj);
    },

    // Set deeply nested property
    setObjPath(obj, path, value) {
        const parts = path.split('.');
        const last = parts.pop();
        const target = parts.reduce((o, i) => o[i], obj);
        if (target) target[last] = value;
    },

    // Find widget in tree
    findWidget(id, list) {
        for (let w of list) {
            if (w.id === id) return w;
            if (w.children) {
                const found = this.findWidget(id, w.children);
                if (found) return found;
            }
        }
        return null;
    },

    // Find parent array containing the widget
    findParentArray(id, list) {
        for (let w of list) {
            if (w.id === id) return { array: list, item: w };
            if (w.children) {
                const found = this.findParentArray(id, w.children);
                if (found) return found;
            }
        }
        return null;
    },

    // Remove widget from tree
    deleteWidgetFromTree(id, list) {
        const idx = list.findIndex(w => w.id === id);
        if (idx !== -1) {
            list.splice(idx, 1);
            return true;
        }
        for (let w of list) {
            if (w.children) {
                if (this.deleteWidgetFromTree(id, w.children)) return true;
            }
        }
        return false;
    },

    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    regenerateIds(w) {
        w.id = this.uid();
        if (w.children) w.children.forEach(c => this.regenerateIds(c));
    }
};