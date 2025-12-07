/**
 * Responsive Manager
 * Handles device modes and style inheritance (Desktop > Tablet > Mobile).
 */
export const Responsive = {
    mode: 'desktop', // 'desktop', 'tablet', 'mobile'

    setMode(mode) {
        this.mode = mode;
        // Update Canvas Class
        const canvas = document.getElementById('canvas');
        if(canvas) {
            canvas.className = mode === 'desktop' ? '' : `mode-${mode}`;
        }
        
        // Update Buttons UI
        document.querySelectorAll('[data-device]').forEach(btn => {
            if(btn.dataset.device === mode) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        // Trigger Re-render to show device-specific styles
        if(window.App) {
            window.App.render();
            // Re-open inspector to update input values for new mode
            if(window.App.selected) {
                import('./inspector.js').then(m => m.Inspector.refresh());
            }
        }
    },

    /**
     * Resolves the value for the current device.
     * Fallback logic: Mobile -> Tablet -> Desktop (Default)
     */
    getStyleValue(styleObj, key) {
        if (!styleObj) return '';

        // 1. Check current mode specific value
        if (this.mode === 'mobile') {
            if (styleObj[`${key}_mobile`] !== undefined && styleObj[`${key}_mobile`] !== "") 
                return styleObj[`${key}_mobile`];
            // Fallback to tablet
            if (styleObj[`${key}_tablet`] !== undefined && styleObj[`${key}_tablet`] !== "") 
                return styleObj[`${key}_tablet`];
        }

        if (this.mode === 'tablet') {
            if (styleObj[`${key}_tablet`] !== undefined && styleObj[`${key}_tablet`] !== "") 
                return styleObj[`${key}_tablet`];
        }

        // 2. Fallback to Desktop (Default key)
        return styleObj[key];
    },

    /**
     * Gets the key name for saving (e.g. "width" vs "width_mobile")
     */
    getTargetKey(key) {
        if (this.mode === 'desktop') return key;
        return `${key}_${this.mode}`;
    },

    /**
     * Returns icon for current mode to show in Inspector
     */
    getIcon() {
        if (this.mode === 'mobile') return 'fa-mobile-alt';
        if (this.mode === 'tablet') return 'fa-tablet-alt';
        return 'fa-desktop';
    }
};