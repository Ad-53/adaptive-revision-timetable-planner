// Profile Action Functions
const app = {
    // --- Persistent application state ---
    state: {
        isAuthenticated: false,
        currentView: 'profile',
        token: null,
        user: null,
        theme: 'light'
    },

    // --- Initialization ---
    init() {
        this.loadStoredState();
        this.initTheme();
        this.setupEventListeners();
        this.showView('profile');
        console.log('Profile initialized');
    },

    // Load saved application state from localStorage
    loadStoredState() {
        try {
            const savedState = localStorage.getItem('revisionAIState');
            if (!savedState) return;
            const parsed = JSON.parse(savedState);
            this.state = {
                ...this.state,
                ...parsed,
                examData: {
                    ...this.state.examData,
                    ...(parsed.examData || {})
                }
            };
        } catch (error) {
            console.warn('Unable to load saved state:', error);
        }
    },

    // Save important application state into localStorage
    saveState() {
        const stateToSave = {
            isAuthenticated: this.state.isAuthenticated,
            token: this.state.token,
            user: this.state.user,
            examData: this.state.examData
        };
        localStorage.setItem('revisionAIState', JSON.stringify(stateToSave));
    },

    // Build headers for backend requests
    getRequestHeaders() {
        const headers = {};
        if (this.state.token) {
            headers['Authorization'] = `Bearer ${this.state.token}`;
        }
        return headers;
    },

    // Get current user from backend /api/me endpoint
    async getCurrentUser() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/me`, {
                headers: this.getRequestHeaders()
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('Backend unavailable');
        }
        throw new Error('Unauthorized');
    },

    // Check if backend is available (health check)
    async checkBackendHealth() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
            return response.ok;
        } catch (error) {
            return false;
        }
    },

    // Display a specific view
    showView(viewName) {
        this.state.currentView = viewName;
        
        // Hide all views
        document.querySelectorAll('.view').forEach((view) => view.classList.add('hidden'));
        
        // Show target view
        const target = document.getElementById(`view-${viewName}`);
        if (target) {
            target.classList.remove('hidden');
        }

        // Update navigation active state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.view === viewName) {
                link.classList.add('active');
            }
        });
    },

    // Display the current user's email in the profile header
    async loadUserProfile() {
        try {
            const response = await this.getCurrentUser();
            if (response) {
                this.state.user = response;
                
                // Update profile display
                document.getElementById('profile-name').textContent = response.display_name || 'User';
                document.getElementById('profile-email').textContent = response.email;
                
                // Update avatar initials
                const nameParts = response.display_name?.split(' ') || response.email.split('@');
                document.getElementById('avatar-initials').textContent = 
                    (nameParts[0] || 'U').charAt(0).toUpperCase();
                
                // Update stats
                this.updateProfileStats(response);
                
                // Save state
                this.saveState();
            }
        } catch (error) {
            console.log('Unable to load user profile');
        }
    },

    // Update profile statistics display
    updateProfileStats(user) {
        const questionsAnswered = document.getElementById('total-questions');
        const avgScore = document.getElementById('avg-score');
        const memberSince = document.getElementById('member-since');

        if (questionsAnswered) {
            questionsAnswered.textContent = user.questions_answered || 0;
        }
        
        if (avgScore) {
            avgScore.textContent = `${user.avg_score || '--'}%`;
        }
        
        if (memberSince && user.created_at) {
            const date = new Date(user.created_at);
            memberSince.textContent = date.toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'long'
            });
        }
    },

    // Initialize or update the theme display
    initTheme() {
        const savedTheme = localStorage.getItem('revisionAITheme');
        this.state.theme = savedTheme === 'dark' ? 'dark' : 'light';
        this.applyTheme();
        
        const themeBtn = document.getElementById('theme-toggle-btn');
        if (themeBtn) {
            themeBtn.querySelector('.theme-icon').textContent = 
                this.state.theme === 'dark' ? '☀️' : '🌙';
        }
    },

    // Toggle between light and dark mode and persist the choice
    toggleTheme() {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('revisionAITheme', this.state.theme);
        this.applyTheme();
        
        const themeBtn = document.getElementById('theme-toggle-btn');
        if (themeBtn) {
            themeBtn.querySelector('.theme-icon').textContent = 
                this.state.theme === 'dark' ? '☀️' : '🌙';
        }
    },

    // Apply theme by updating the data attribute and button label
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.state.theme);
    },

    // Setup event listeners for profile page interactions
    setupEventListeners() {
        // Theme toggle
        const themeBtn = document.getElementById('theme-toggle-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }

        // Change password button
        const changePasswordBtn = document.getElementById('change-password-btn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                this.showToast('Password change functionality coming soon!', 'info');
            });
        }

        // Email notifications toggle
        const emailNotifications = document.getElementById('email-notifications');
        if (emailNotifications) {
            emailNotifications.addEventListener('change', (e) => {
                localStorage.setItem('emailNotifications', e.target.checked);
                this.showToast(`Email notifications ${e.target.checked ? 'enabled' : 'disabled'}`, 'success');
            });
        }

        // Focus mode toggle
        const focusMode = document.getElementById('focus-mode');
        if (focusMode) {
            focusMode.addEventListener('change', (e) => {
                localStorage.setItem('focusMode', e.target.checked);
                this.showToast(`Focus mode ${e.target.checked ? 'enabled' : 'disabled'}`, 'success');
            });
        }

        // Logout button in navigation
        const logoutBtn = document.querySelector('.nav-right .btn-outline');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Logout button in footer
        const footerLogoutBtn = document.querySelector('.profile-footer a.btn-danger');
        if (footerLogoutBtn) {
            footerLogoutBtn.addEventListener('click', () => this.logout());
        }
    },

    // Log the user out and clear saved state
    logout() {
        this.state.isAuthenticated = false;
        this.state.user = null;
        this.state.token = null;
        localStorage.removeItem('revisionAIState');
        window.location.href = '/login';
    },

    // Show error message
    showError(message) {
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            const errorText = errorEl.querySelector('.error-text');
            if (errorText) {
                errorText.textContent = message;
                errorEl.classList.remove('hidden');
            }
        }
    },

    // Show toast notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${this.getToastIcon(type)}</span>
            <span class="toast-message">${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }
};

// Initialize the app after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    app.init();
    app.loadUserProfile();
});