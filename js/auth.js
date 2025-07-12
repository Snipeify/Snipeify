// Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.isOwner = false;
        this.init();
    }
    
    async init() {
        // Check if user is already logged in
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            await this.checkOwnerStatus();
            this.showMainInterface();
        } else {
            this.showAuthScreen();
        }
        
        this.setupEventListeners();
    }
    
    async checkOwnerStatus() {
        const Utils = window.Utils; // Declare Utils variable
        const db = window.db; // Declare db variable
        this.isOwner = await Utils.isOwner();
        if (this.isOwner && this.currentUser) {
            // Update user as owner in database
            db.updateUser(this.currentUser.id, { isOwner: true });
            document.body.classList.add('is-owner');
        }
    }
    
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        // Signup page form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }
        
        // Auth form switching
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');
        
        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchToRegister();
            });
        }
        
        if (showLogin) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchToLogin();
            });
        }
        
        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!username || !password) {
            const Utils = window.Utils; // Declare Utils variable
            Utils.showNotification('Please fill in all fields', 'error');
            return;
        }
        
        const db = window.db; // Declare db variable
        const user = db.getUserByUsername(username);
        if (!user || user.password !== password) {
            const Utils = window.Utils; // Declare Utils variable
            Utils.showNotification('Invalid username or password', 'error');
            return;
        }
        
        await this.loginUser(user);
    }
    
    async handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('regUsername').value.trim();
        const displayName = document.getElementById('regDisplayName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        
        if (!this.validateRegistration(username, displayName, email, password)) {
            return;
        }
        
        const db = window.db; // Declare db variable
        await this.registerUser({ username, displayName, email, password });
    }
    
    async handleSignup(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const displayName = document.getElementById('displayName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            const Utils = window.Utils; // Declare Utils variable
            Utils.showNotification('Passwords do not match', 'error');
            return;
        }
        
        if (!this.validateRegistration(username, displayName, email, password)) {
            return;
        }
        
        const db = window.db; // Declare db variable
        const user = await this.registerUser({ username, displayName, email, password });
        if (user) {
            // Redirect to main page
            window.location.href = 'index.html';
        }
    }
    
    validateRegistration(username, displayName, email, password) {
        if (!username || !displayName || !email || !password) {
            const Utils = window.Utils; // Declare Utils variable
            Utils.showNotification('Please fill in all fields', 'error');
            return false;
        }
        
        if (!Utils.validateUsername(username)) {
            const Utils = window.Utils; // Declare Utils variable
            Utils.showNotification('Username must be 3-20 characters, letters and numbers only', 'error');
            return false;
        }
        
        if (!Utils.validateEmail(email)) {
            const Utils = window.Utils; // Declare Utils variable
            Utils.showNotification('Please enter a valid email address', 'error');
            return false;
        }
        
        if (password.length < 6) {
            const Utils = window.Utils; // Declare Utils variable
            Utils.showNotification('Password must be at least 6 characters', 'error');
            return false;
        }
        
        const db = window.db; // Declare db variable
        if (db.getUserByUsername(username)) {
            const Utils = window.Utils; // Declare Utils variable
            Utils.showNotification('Username already exists', 'error');
            return false;
        }
        
        return true;
    }
    
    async registerUser(userData) {
        const db = window.db; // Declare db variable
        try {
            const user = db.createUser(userData);
            const Utils = window.Utils; // Declare Utils variable
            Utils.showNotification('Account created successfully!', 'success');
            await this.loginUser(user);
            return user;
        } catch (error) {
            const Utils = window.Utils; // Declare Utils variable
            Utils.showNotification('Failed to create account', 'error');
            console.error('Registration error:', error);
            return null;
        }
    }
    
    async loginUser(user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Update last seen
        const db = window.db; // Declare db variable
        db.updateUser(user.id, { 
            lastSeen: Date.now(),
            status: 'online'
        });
        
        await this.checkOwnerStatus();
        
        const Utils = window.Utils; // Declare Utils variable
        Utils.showNotification(`Welcome back, ${user.displayName}!`, 'success');
        this.showMainInterface();
    }
    
    logout() {
        if (this.currentUser) {
            const db = window.db; // Declare db variable
            // Update user status to offline
            db.updateUser(this.currentUser.id, { 
                status: 'offline',
                lastSeen: Date.now()
            });
        }
        
        this.currentUser = null;
        this.isOwner = false;
        localStorage.removeItem('currentUser');
        document.body.classList.remove('is-owner');
        
        const Utils = window.Utils; // Declare Utils variable
        Utils.showNotification('Logged out successfully', 'info');
        this.showAuthScreen();
    }
    
    showAuthScreen() {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('main-interface').classList.add('hidden');
    }
    
    showMainInterface() {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-interface').classList.remove('hidden');
        
        // Initialize main interface
        if (window.chatSystem) {
            window.chatSystem.init();
        }
    }
    
    switchToRegister() {
        document.getElementById('login-form').classList.remove('active');
        document.getElementById('register-form').classList.add('active');
    }
    
    switchToLogin() {
        document.getElementById('register-form').classList.remove('active');
        document.getElementById('login-form').classList.add('active');
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    isUserOwner() {
        return this.isOwner;
    }
    
    updateCurrentUser(updates) {
        if (this.currentUser) {
            Object.assign(this.currentUser, updates);
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
    }
}

// Initialize auth system
const authSystem = new AuthSystem();
window.authSystem = authSystem;
