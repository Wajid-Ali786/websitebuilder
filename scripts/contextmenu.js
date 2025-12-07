/**
 * Context Menu (Right Click)
 * Handles custom context menus for Widgets, Canvas, Navigator, and Inspector.
 * Supports "Double Right-Click" to access browser default menu.
 */
import { Utils } from './utils.js';

export const ContextMenu = {
    menu: null,
    targetId: null,
    targetType: null,
    lastClickTime: 0,
    doubleClickThreshold: 300, // ms

    init() {
        this.menu = document.getElementById('context-menu');
        if (!this.menu) {
            // Create if missing (fallback)
            this.menu = document.createElement('div');
            this.menu.id = 'context-menu';
            this.menu.className = 'context-menu';
            document.body.appendChild(this.menu);
        }

        // Global Right-Click Handler
        document.addEventListener('contextmenu', (e) => this.handleGlobalContextMenu(e));

        // Hide on Left Click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#context-menu')) {
                this.hide();
            }
        });
        
        // Hide on Scroll
        window.addEventListener('scroll', () => this.hide(), true);
    },

    /**
     * Main Event Handler
     */
    handleGlobalContextMenu(e) {
        const now = Date.now();
        
        // 1. Double Right-Click Logic (Bypass to Browser Default)
        if (now - this.lastClickTime < this.doubleClickThreshold) {
            this.hide();
            this.lastClickTime = now;
            return; // Allow default behavior
        }
        this.lastClickTime = now;

        // 2. Identify Context
        let contextFound = false;
        
        // A. Widget in Canvas
        const widgetEl = e.target.closest('.ce-widget');
        if (widgetEl) {
            e.preventDefault();
            e.stopPropagation();
            
            // Check for Multi-Selection
            const App = window.App;
            const isMulti = App.selected && Array.isArray(App.selected) && App.selected.length > 1 && App.selected.includes(widgetEl.id);
            
            this.show(e, isMulti ? 'multi_widget' : 'widget', widgetEl.id);
            contextFound = true;
            return;
        }

        // B. Navigator Item
        const navItem = e.target.closest('.nav-item');
        if (navItem) {
            e.preventDefault();
            // Assuming navigator items have an onclick handler that sets selection, 
            // usually we track ID via index or attribute. 
            // For now, we show general navigator actions unless mapped.
            this.show(e, 'navigator', null); 
            contextFound = true;
            return;
        }

        // C. Canvas Background
        if (e.target.id === 'canvas' || e.target.id === 'canvas-frame' || e.target.id === 'stage') {
            e.preventDefault();
            this.show(e, 'canvas', null);
            contextFound = true;
            return;
        }

        // D. Sidebar / Inspector
        if (e.target.closest('#panel')) {
            e.preventDefault();
            this.show(e, 'inspector', null);
            contextFound = true;
            return;
        }
    },

    show(e, type, id) {
        this.targetId = id;
        this.targetType = type;
        
        const hasItems = this.buildMenu(type);
        if (!hasItems) return;

        this.menu.style.display = 'block';
        
        // Smart Positioning
        const menuWidth = 240;
        const menuHeight = this.menu.offsetHeight || 350;
        
        let x = e.pageX;
        let y = e.pageY;

        // Flip if close to edge
        if (x + menuWidth > window.innerWidth) x -= menuWidth;
        if (y + menuHeight > window.innerHeight) y -= menuHeight;

        this.menu.style.left = `${x}px`;
        this.menu.style.top = `${y}px`;
    },

    hide() {
        if (this.menu) this.menu.style.display = 'none';
    },

    /**
     * Menu Builder Logic
     */
    buildMenu(type) {
        let items = [];
        let headerActions = []; // Icons row

        const App = window.App;
        const hasClip = !!App.clipboard;

        switch(type) {
            case 'widget':
                // Widget Header Icons
                headerActions = [
                    { icon: 'fa-pen', action: 'edit', title: 'Edit' },
                    { icon: 'fa-copy', action: 'copy', title: 'Copy' },
                    { icon: 'fa-paste', action: 'paste', title: 'Paste', disabled: !hasClip },
                    { icon: 'fa-clone', action: 'duplicate', title: 'Duplicate' },
                    { icon: 'fa-trash', action: 'delete', title: 'Delete', danger: true }
                ];

                items = [
                    // Styling
                    { label: 'Paste Style', icon: 'fa-paint-brush', action: 'paste_style', disabled: !hasClip },
                    { label: 'Reset Style', icon: 'fa-eraser', action: 'reset_style' },
                    { type: 'sep' },
                    
                    // Layout / Movement
                    { label: 'Move Up', icon: 'fa-arrow-up', action: 'move_up' },
                    { label: 'Move Down', icon: 'fa-arrow-down', action: 'move_down' },
                    { type: 'sep' },
                    
                    // Insertion
                    { label: 'Add Container Before', icon: 'fa-plus-square', action: 'add_cont_before' },
                    { label: 'Add Container After', icon: 'fa-plus-square', action: 'add_cont_after' },
                    { type: 'sep' },
                    
                    // Hierarchy / Navigation
                    { label: 'Select Parent', icon: 'fa-level-up-alt', action: 'select_parent' },
                    { label: 'Show in Navigator', icon: 'fa-layer-group', action: 'toggle_nav_focus' },
                    { type: 'sep' },
                    
                    // Advanced
                    { label: 'Lock Widget', icon: 'fa-lock', action: 'lock_widget' },
                    { label: 'Save as Template', icon: 'fa-save', action: 'save_template' }
                ];
                break;

            case 'multi_widget':
                headerActions = [
                    { icon: 'fa-copy', action: 'copy_multi', title: 'Copy All' },
                    { icon: 'fa-trash', action: 'delete_multi', title: 'Delete All', danger: true }
                ];
                items = [
                    { label: 'Deselect All', icon: 'fa-times', action: 'deselect_all' },
                    { type: 'sep' },
                    { label: 'Group in Container', icon: 'fa-object-group', action: 'group_container' },
                    { label: 'Align Left', icon: 'fa-align-left', action: 'align_left' }, // Placeholder logic
                    { label: 'Align Center', icon: 'fa-align-center', action: 'align_center' }
                ];
                break;

            case 'canvas':
                headerActions = [
                    { icon: 'fa-paste', action: 'paste', title: 'Paste', disabled: !hasClip },
                    { icon: 'fa-eraser', action: 'clear_canvas', title: 'Clear All', danger: true }
                ];
                items = [
                    { label: 'Select All Widgets', icon: 'fa-check-double', action: 'select_all' },
                    { type: 'sep' },
                    { label: 'Add New Section', icon: 'fa-plus-circle', action: 'add_section' },
                    { label: 'Paste from Clipboard', icon: 'fa-clipboard', action: 'paste', disabled: !hasClip },
                    { type: 'sep' },
                    { label: 'Navigator', icon: 'fa-layer-group', action: 'toggle_nav' },
                    { label: 'Page Settings', icon: 'fa-cog', action: 'page_settings' }
                ];
                break;

            case 'navigator':
                items = [
                    { label: 'Expand All', icon: 'fa-expand-arrows-alt', action: 'expand_all' },
                    { label: 'Collapse All', icon: 'fa-compress-arrows-alt', action: 'collapse_all' },
                    { type: 'sep' },
                    { label: 'Refresh Tree', icon: 'fa-sync', action: 'refresh_nav' }
                ];
                break;

            case 'inspector':
                items = [
                    { label: 'Copy Styles', icon: 'fa-copy', action: 'copy_styles' },
                    { label: 'Reset All Styles', icon: 'fa-undo', action: 'reset_styles' },
                    { type: 'sep' },
                    { label: 'Close Panel', icon: 'fa-times', action: 'close_inspector' }
                ];
                break;
        }

        if (items.length === 0 && headerActions.length === 0) return false;

        this.menu.innerHTML = '';

        // 1. Render Header Icons
        if (headerActions.length > 0) {
            const header = document.createElement('div');
            header.style.cssText = 'display:flex; justify-content:space-around; padding:8px; border-bottom:1px solid #eee; background:#f9f9f9;';
            
            headerActions.forEach(act => {
                const btn = document.createElement('div');
                btn.title = act.title;
                btn.style.cssText = `cursor:${act.disabled?'default':'pointer'}; opacity:${act.disabled?0.4:1}; color:${act.danger?'#d32f2f':'#555'}; padding:6px; border-radius:4px; font-size:14px;`;
                btn.innerHTML = `<i class="fas ${act.icon}"></i>`;
                
                if (!act.disabled) {
                    btn.onmouseenter = () => btn.style.background = '#eee';
                    btn.onmouseleave = () => btn.style.background = 'transparent';
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        this.exec(act.action);
                        this.hide();
                    };
                }
                header.appendChild(btn);
            });
            this.menu.appendChild(header);
        }

        // 2. Render Items
        items.forEach(item => {
            if (item.type === 'sep') {
                const sep = document.createElement('div');
                sep.className = 'ctx-sep';
                this.menu.appendChild(sep);
            } else {
                const div = document.createElement('div');
                div.className = 'ctx-item';
                if(item.disabled) {
                    div.style.opacity = '0.5';
                    div.style.pointerEvents = 'none';
                }
                div.innerHTML = `<span><i class="fas ${item.icon}" style="width:20px; text-align:center; margin-right:10px; color:#777;"></i> ${item.label}</span>`;
                div.onclick = () => {
                    this.exec(item.action);
                    this.hide();
                };
                this.menu.appendChild(div);
            }
        });

        return true;
    },

    /**
     * Action Executor
     */
    exec(action) {
        const App = window.App;
        const targetId = this.targetId;
        
        // Helper: Find widget and its parent array
        const findCtx = (id) => Utils.findParentArray(id, App.data.widgets);

        switch(action) {
            // --- EDITING ---
            case 'edit':
                if (targetId) App.selectWidget(targetId);
                break;
            
            case 'duplicate':
                if (targetId) App.duplicateWidget(targetId);
                break;
            
            case 'delete':
                if (targetId) App.deleteWidget(targetId);
                break;
            
            case 'copy':
                if (targetId) {
                    const w = Utils.findWidget(targetId, App.data.widgets);
                    if(w) {
                        App.clipboard = JSON.parse(JSON.stringify(w));
                        // alert('Copied to clipboard'); // Optional feedback
                    }
                }
                break;

            case 'paste':
                if (App.clipboard) {
                    const clone = Utils.deepClone(App.clipboard);
                    Utils.regenerateIds(clone);
                    
                    // Paste logic: Inside container if selected, else after widget
                    let targetArr = App.data.widgets;
                    let idx = targetArr.length;

                    if (targetId) {
                        const targetW = Utils.findWidget(targetId, App.data.widgets);
                        // If pasting onto a container, append to children
                        if (targetW && targetW.children) {
                            targetArr = targetW.children;
                            idx = targetArr.length;
                        } else {
                            // Else paste after
                            const ctx = findCtx(targetId);
                            targetArr = ctx.array;
                            idx = ctx.array.indexOf(ctx.item) + 1;
                        }
                    }
                    
                    targetArr.splice(idx, 0, clone);
                    App.render();
                    App.history.push(App.data);
                }
                break;

            // --- STYLING ---
            case 'paste_style':
                if (App.clipboard && targetId) {
                    const target = Utils.findWidget(targetId, App.data.widgets);
                    const source = App.clipboard;
                    if(target && source.settings) {
                        // Merge styles carefully
                        target.settings.style = { ...target.settings.style, ...source.settings.style };
                        target.settings.advanced = { ...target.settings.advanced, ...source.settings.advanced };
                        App.render();
                        App.selectWidget(targetId); // Refresh inspector
                        App.history.push(App.data);
                    }
                }
                break;

            case 'reset_style':
                if (targetId) {
                    const target = Utils.findWidget(targetId, App.data.widgets);
                    import('./registry.js').then(mod => {
                        const def = mod.Registry.definitions[target.type];
                        target.settings.style = JSON.parse(JSON.stringify(def.defaultStyle || {}));
                        // Keep content, reset visual
                        App.render();
                        App.selectWidget(targetId);
                        App.history.push(App.data);
                    });
                }
                break;

            // --- MOVEMENT ---
            case 'move_up':
                if (targetId) {
                    const ctx = findCtx(targetId);
                    const idx = ctx.array.indexOf(ctx.item);
                    if (idx > 0) {
                        [ctx.array[idx], ctx.array[idx-1]] = [ctx.array[idx-1], ctx.array[idx]];
                        App.render();
                        App.history.push(App.data);
                    }
                }
                break;

            case 'move_down':
                if (targetId) {
                    const ctx = findCtx(targetId);
                    const idx = ctx.array.indexOf(ctx.item);
                    if (idx < ctx.array.length - 1) {
                        [ctx.array[idx], ctx.array[idx+1]] = [ctx.array[idx+1], ctx.array[idx]];
                        App.render();
                        App.history.push(App.data);
                    }
                }
                break;

            case 'select_parent':
                if (targetId) {
                    const ctx = findCtx(targetId);
                    // Search for owner of ctx.array
                    const findOwner = (list, arrRef) => {
                        for(let w of list) {
                            if(w.children === arrRef) return w;
                            if(w.children) {
                                const found = findOwner(w.children, arrRef);
                                if(found) return found;
                            }
                        }
                        return null;
                    };
                    const parent = findOwner(App.data.widgets, ctx.array);
                    if(parent) App.selectWidget(parent.id);
                }
                break;

            // --- STRUCTURE / LAYOUT ---
            case 'add_cont_before':
            case 'add_cont_after':
                if (targetId) {
                    import('./registry.js').then(mod => {
                        const newCont = mod.Registry.createInstance('container');
                        const ctx = findCtx(targetId);
                        const idx = ctx.array.indexOf(ctx.item);
                        const offset = action === 'add_cont_after' ? 1 : 0;
                        ctx.array.splice(idx + offset, 0, newCont);
                        App.render();
                        App.history.push(App.data);
                    });
                }
                break;
            
            case 'add_section':
                import('./registry.js').then(mod => {
                    const newCont = mod.Registry.createInstance('container');
                    newCont.settings.style.minHeight = '300px';
                    App.data.widgets.push(newCont);
                    App.render();
                    App.history.push(App.data);
                    setTimeout(() => document.getElementById('canvas').scrollTop = document.getElementById('canvas').scrollHeight, 100);
                });
                break;

            // --- UTILS / ADVANCED ---
            case 'lock_widget':
                // Requires renderer to respect this property
                const w = Utils.findWidget(targetId, App.data.widgets);
                if(w) {
                    w.settings.locked = !w.settings.locked;
                    App.render(); // Re-render to update UI (e.g. show lock icon)
                }
                break;

            case 'toggle_nav':
            case 'toggle_nav_focus':
                import('./navigator.js').then(m => {
                    // Force show navigator
                    const nav = document.getElementById('navigator');
                    nav.style.display = 'flex';
                    m.Navigator.render(App.data.widgets);
                    // Scroll to item in navigator if ID exists
                    if(targetId && action === 'toggle_nav_focus') {
                        // (Requires Navigator implementation to support scrolling to ID)
                    }
                });
                break;

            case 'clear_canvas':
                if(confirm('Are you sure you want to delete all content?')) {
                    App.data.widgets = [];
                    App.render();
                    App.history.push(App.data);
                }
                break;

            case 'select_all':
                // Simple implementation: Select root items visually? 
                // Actual multi-select logic in App is complex, usually just visual for now
                alert('Select All logic requires advanced multi-select state.');
                break;

            case 'save_template':
                alert('Saved as template (Placeholder)');
                break;

            case 'undo': App.history.undo(); break;
            case 'redo': App.history.redo(); break;
            
            case 'close_inspector':
                import('./inspector.js').then(m => m.Inspector.close());
                break;
        }
    }
};