
        /* --- dashboard.js --- */
        
        // 1. Initialize
        document.addEventListener('DOMContentLoaded', renderPages);

        // 2. Render Page List
        function renderPages() {
            const pages = Pages.getAll();
            const grid = document.getElementById('pages-grid');
            grid.innerHTML = '';

            if (pages.length === 0) {
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #888;">No pages found. Create one to get started!</div>';
                return;
            }

            pages.forEach(page => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="card-preview">
                        <i class="fas fa-image fa-2x"></i>
                    </div>
                    <div class="card-body">
                        <div class="card-title">${page.title}</div>
                        <div class="card-meta">Last edited: ${page.lastModified}</div>
                        <div class="card-actions">
                            <button class="action-btn" onclick="openEditor('${page.id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="action-btn" onclick="handleDuplicate('${page.id}')">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button class="action-btn delete" onclick="handleDelete('${page.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        // 3. User Actions
        function handleCreatePage() {
            const title = prompt("Enter page title:", "My New Page");
            if (title) {
                const newPage = Pages.create(title);
                // Redirect to Builder
                window.location.href = `builder.html?page=${newPage.id}`;
            }
        }

        function openEditor(id) {
            window.location.href = `builder.html?page=${id}`;
        }

        function handleDelete(id) {
            if (confirm("Are you sure you want to delete this page?")) {
                Pages.delete(id);
                renderPages(); // Refresh list
            }
        }

        function handleDuplicate(id) {
            Pages.duplicate(id);
            renderPages(); // Refresh list
        }
    