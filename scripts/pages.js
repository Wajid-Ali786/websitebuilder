/**
 * PAGES STORAGE MODULE
 * Handles CRUD operations for pages using localStorage.
 * Ready to be swapped with Firebase Firestore.
 */

const DB_KEY = 'sitebuilder_pages';

const Pages = {
    // 1. Get All Pages (For Dashboard List)
    getAll: () => {
        const data = localStorage.getItem(DB_KEY);
        return data ? JSON.parse(data) : [];
    },

    // 2. Get Single Page (For Builder Load)
    getById: (id) => {
        const pages = Pages.getAll();
        return pages.find(p => p.id === id) || null;
    },

    // 3. Create New Page
    create: (title = 'Untitled Page') => {
        const pages = Pages.getAll();
        const newPage = {
            id: 'page_' + Date.now(),
            title: title,
            status: 'Draft',
            lastModified: new Date().toLocaleString(),
            widgets: [] // Empty canvas
        };
        pages.push(newPage);
        localStorage.setItem(DB_KEY, JSON.stringify(pages));
        return newPage;
    },

    // 4. Update Page (For Builder Save)
    update: (id, updates) => {
        const pages = Pages.getAll();
        const index = pages.findIndex(p => p.id === id);
        if (index !== -1) {
            pages[index] = { 
                ...pages[index], 
                ...updates, 
                lastModified: new Date().toLocaleString() 
            };
            localStorage.setItem(DB_KEY, JSON.stringify(pages));
            return true;
        }
        return false;
    },

    // 5. Delete Page
    delete: (id) => {
        const pages = Pages.getAll();
        const filtered = pages.filter(p => p.id !== id);
        localStorage.setItem(DB_KEY, JSON.stringify(filtered));
    },

    // 6. Duplicate Page
    duplicate: (id) => {
        const original = Pages.getById(id);
        if (original) {
            const pages = Pages.getAll();
            const copy = {
                ...original,
                id: 'page_' + Date.now(),
                title: original.title + ' (Copy)',
                lastModified: new Date().toLocaleString()
            };
            pages.push(copy);
            localStorage.setItem(DB_KEY, JSON.stringify(pages));
            return copy;
        }
        return null;
    }
};

// Expose to window for inline HTML demo purposes
window.Pages = Pages;