/**
 * Dashboard Module - Main Logic
 * Handles data rendering and interactions for the dashboard.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Dashboard
    initDashboard();
});

function initDashboard() {
    // 1. Load mock data
    const dashboardData = getMockData();

    // 2. Render UI components
    renderStats(dashboardData.stats);
    renderRecentPages(dashboardData.recentPages);

    // 3. Setup Event Listeners
    setupEventListeners();
}

/**
 * Returns mock data for the dashboard.
 * In a real app, this would fetch from an API or Firebase.
 */
function getMockData() {
    return {
        stats: {
            totalPages: 12,
            lastEdited: "Landing Page V2"
        },
        recentPages: [
            { id: 1, title: "Home Page", lastEdited: "2 hours ago", status: "Published" },
            { id: 2, title: "About Us", lastEdited: "Yesterday", status: "Published" },
            { id: 3, title: "Contact Form", lastEdited: "2 days ago", status: "Draft" },
            { id: 4, title: "Landing Page V2", lastEdited: "3 days ago", status: "Draft" },
            { id: 5, title: "Portfolio 2024", lastEdited: "1 week ago", status: "Published" }
        ]
    };
}

/**
 * Renders the Quick Stats section
 */
function renderStats(stats) {
    const statsContainer = document.getElementById('stats-container');
    
    const statsHTML = `
        <div class="stat-card blue">
            <div class="stat-icon">
                <i class="fa-solid fa-file-lines"></i>
            </div>
            <div class="stat-info">
                <h3>Total Pages</h3>
                <p>${stats.totalPages}</p>
            </div>
        </div>
        <div class="stat-card green">
            <div class="stat-icon">
                <i class="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div class="stat-info">
                <h3>Last Edited</h3>
                <p style="font-size: 1.1rem; line-height: 1.5;">${stats.lastEdited}</p>
            </div>
        </div>
    `;

    statsContainer.innerHTML = statsHTML;
}

/**
 * Renders the Recent Pages list
 */
function renderRecentPages(pages) {
    const pagesContainer = document.getElementById('pages-container');
    
    if (!pages || pages.length === 0) {
        pagesContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">No pages found. Create one to get started!</div>';
        return;
    }

    const pagesHTML = pages.map(page => `
        <div class="page-item">
            <div class="page-info">
                <span class="page-title">${page.title}</span>
                <span class="page-meta">
                    Edited ${page.lastEdited} &bull; 
                    <span style="color: ${page.status === 'Published' ? '#2ecc71' : '#f39c12'}">${page.status}</span>
                </span>
            </div>
            <div class="page-actions">
                <button class="btn-secondary" onclick="editPage(${page.id})">
                    <i class="fa-solid fa-pen"></i> Edit
                </button>
            </div>
        </div>
    `).join('');

    pagesContainer.innerHTML = pagesHTML;
}

/**
 * Navigation and Interaction Handlers
 */
function setupEventListeners() {
    // Create New Page Button
    const createBtn = document.getElementById('create-new-btn');
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            console.log("Navigating to Builder...");
            // As per requirements, navigate to builder.html
            window.location.href = 'builder.html';
        });
    }

    // Mobile Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent immediate closing
            sidebar.classList.toggle('active');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && 
                !sidebar.contains(e.target) && 
                !sidebarToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
    }
}

/**
 * Handle Edit Action
 * @param {number} id - The ID of the page to edit
 */
function editPage(id) {
    console.log(`Editing page ID: ${id}`);
    // Future integration: Navigate to builder with ID, e.g., builder.html?id=1
    window.location.href = `builder.html?page_id=${id}`;
}