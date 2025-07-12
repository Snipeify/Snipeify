// Theme System
class ThemeSystem {
    constructor() {
        this.currentTheme = CONFIG.DEFAULTS.THEME;
        this.init();
    }
    
    init() {
        this.loadUserTheme();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const themeBtn = document.getElementById('themeBtn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.showThemeSelector());
        }
        
        // Theme options in settings
        document.addEventListener('click', (e) => {
            if (e.target.closest('.theme-option')) {
                const themeOption = e.target.closest('.theme-option');
                const theme = themeOption.dataset.theme;
                this.setTheme(theme);
            }
        });
    }
    
    loadUserTheme() {
        const currentUser = authSystem.getCurrentUser();
        if (currentUser) {
            const userSettings = db.getUserSettings(currentUser.id);
            this.currentTheme = userSettings.theme || CONFIG.DEFAULTS.THEME;
        } else {
            // Load from localStorage for non-logged in users
            this.currentTheme = localStorage.getItem('theme') || CONFIG.DEFAULTS.THEME;
        }
        
        this.applyTheme(this.currentTheme);
    }
    
    setTheme(theme) {
        this.currentTheme = theme;
        this.applyTheme(theme);
        this.saveTheme(theme);
        
        // Update theme selector
        this.updateThemeSelector();
        
        Utils.showNotification(`Theme changed to ${this.getThemeName(theme)}`, 'success');
    }
    
    applyTheme(theme) {
        // Remove existing theme classes
        document.body.classList.remove('theme-black-opal', 'theme-dark', 'theme-light');
        
        // Add new theme class
        document.body.classList.add(`theme-${theme}`);
        
        // Update meta theme color for mobile browsers
        this.updateMetaThemeColor(theme);
    }
    
    saveTheme(theme) {
        const currentUser = authSystem.getCurrentUser();
        if (currentUser) {
            // Save to user settings
            db.updateUserSettings(currentUser.id, { theme });
            authSystem.updateCurrentUser({ theme });
        } else {
            // Save to localStorage
            localStorage.setItem('theme', theme);
        }
    }
    
    updateThemeSelector() {
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.theme === this.currentTheme) {
                option.classList.add('active');
            }
        });
    }
    
    showThemeSelector() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Choose Theme</h2>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="theme-selector">
                        <div class="theme-option ${this.currentTheme === 'black-opal' ? 'active' : ''}" data-theme="black-opal">
                            <div class="theme-preview black-opal-preview"></div>
                            <span>Black Opal</span>
                            <p style="font-size: 12px; color:
