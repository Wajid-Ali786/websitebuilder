        /**
         * DASHBOARD MODULE
         * Handles data loading, navigation to builder, and UI interactions.
         */

        // 1. Mock Data (Ideally fetched from Firebase/Database)
        const mockPages = [
            { id: 101, title: "Home Page", status: "Published", lastModified: "2 hours ago" },
            { id: 102, title: "About Us", status: "Draft", lastModified: "5 hours ago" },
            { id: 103, title: "Services", status: "Published", lastModified: "1 day ago" },
            { id: 104, title: "Contact", status: "Published", lastModified: "2 days ago" },
            { id: 105, title: "Landing Page A", status: "Draft", lastModified: "1 week ago" }
        ];

        // 2. Initialization
        document.addEventListener('DOMContentLoaded', () => {
            initDashboard();
            setupEventListeners();
        });

        function initDashboard() {
            renderStats();
            renderPagesTable();
        }

        // 3. Render Functions
        function renderStats() {
            // Update stats based on mock data
            document.getElementById('stat-total-pages').textContent = mockPages.length;
            document.getElementById('stat-last-edited').textContent = mockPages[0].title;
        }

        function renderPagesTable() {
            const tbody = document.getElementById('pages-table-body');
            tbody.innerHTML = '';

            mockPages.forEach(page => {
                const tr = document.createElement('tr');
                const statusClass = page.status.toLowerCase() === 'published' ? 'status-published' : 'status-draft';
                
                tr.innerHTML = `
                    <td>
                        <div style="font-weight: 500;">${page.title}</div>
                        <div style="font-size: 0.75rem; color: #9ca3af;">ID: ${page.id}</div>
                    </td>
                    <td><span class="status-badge ${statusClass}">${page.status}</span></td>
                    <td>${page.lastModified}</td>
                    <td>
                        <button class="action-btn edit" onclick="navigateToBuilder(${page.id})" title="Edit in Builder">
                            <i class="fas fa-pen"></i> Edit
                        </button>
                        <button class="action-btn" title="Preview">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        // 4. Navigation Logic (Linking Modules)
        
        // Navigates to Builder Module with Page ID
        window.navigateToBuilder = (pageId) => {
            const url = `builder.html?page=${pageId}`;
            console.log(`[Dashboard] Navigating to Builder: ${url}`);
            
            // In a real multi-file environment, this would redirect:
            // window.location.href = url;
            
            // For this preview, we alert the user
            alert(`Simulating navigation to Builder Module.\nLoading Page ID: ${pageId}`);
        };

        // Navigates to Builder in "New Page" mode
        function createNewPage() {
            const url = `builder.html?mode=new`;
            console.log(`[Dashboard] Creating New Page: ${url}`);
            
            // In a real multi-file environment:
            // window.location.href = url;

            alert(`Simulating navigation to Builder Module.\nMode: Create New Page`);
        }

        // 5. UI Interaction
        function setupEventListeners() {
            // Mobile Menu Toggle
            const menuToggle = document.getElementById('menuToggle');
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.querySelector('.main-content');

            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });

            // Close sidebar when clicking outside on mobile
            mainContent.addEventListener('click', () => {
                if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                }
            });

            // Bind Create Button
            document.getElementById('createNewBtn').addEventListener('click', createNewPage);
        }

        // Handle Sidebar Navigation styling
        window.handleNav = (section) => {
            // Update UI active state
            document.querySelectorAll('.nav-item a').forEach(el => el.classList.remove('active'));
            event.currentTarget.classList.add('active');
            console.log(`[Dashboard] Switched to section: ${section}`);
        };
