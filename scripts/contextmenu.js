/**
 * Context Menu
 */
export const ContextMenu = {
    menu: null,
    targetId: null,

    init() {
        this.menu = document.getElementById('context-menu');
        
        // Hide on click elsewhere
        document.addEventListener('click', () => {
            this.menu.style.display = 'none';
        });

        this.buildMenu();
    },

    buildMenu() {
        const items = [
            { label: 'Duplicate', icon: 'fa-copy', action: 'duplicate' },
            { label: 'Delete', icon: 'fa-trash', action: 'delete' }
        ];

        this.menu.innerHTML = '';
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'ctx-item';
            div.innerHTML = `<span><i class="fas ${item.icon}"></i> ${item.label}</span>`;
            div.onclick = () => this.exec(item.action);
            this.menu.appendChild(div);
        });
    },

    show(e, id) {
        e.preventDefault();
        this.targetId = id;
        this.menu.style.display = 'block';
        this.menu.style.left = e.pageX + 'px';
        this.menu.style.top = e.pageY + 'px';
    },

    exec(action) {
        if (action === 'delete') window.App.deleteWidget(this.targetId);
        if (action === 'duplicate') window.App.duplicateWidget(this.targetId);
    }
};