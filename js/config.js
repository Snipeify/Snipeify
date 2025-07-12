// Configuration
const CONFIG = {
    // Owner IP address - replace with your actual IP
    OWNER_IP: '127.0.0.1', // Replace with your actual IP address
    
    // Database configuration
    DATABASE_NAME: 'blackopal_chat',
    
    // WebSocket configuration (for real-time features)
    WS_URL: 'wss://your-websocket-server.com', // Replace with actual WebSocket server
    
    // API endpoints (if using external services)
    API_BASE_URL: 'https://your-api-server.com/api', // Replace with actual API server
    
    // Features
    FEATURES: {
        REAL_TIME_CHAT: true,
        DIRECT_MESSAGES: true,
        EVENTS: true,
        LEADERBOARD: true,
        ADMIN_COMMANDS: true,
        THEME_SWITCHING: true
    },
    
    // Limits
    LIMITS: {
        MESSAGE_LENGTH: 2000,
        USERNAME_LENGTH: 20,
        DISPLAY_NAME_LENGTH: 32,
        MAX_DM_CONVERSATIONS: 50
    },
    
    // Default settings
    DEFAULTS: {
        THEME: 'black-opal',
        STATUS: 'Online'
    }
};

// Utility functions
const Utils = {
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    formatTimestamp: (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            return `${Math.floor(diff / 60000)}m ago`;
        } else if (diff < 86400000) { // Less than 1 day
            return `${Math.floor(diff / 3600000)}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    },
    
    sanitizeInput: (input) => {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    },
    
    validateUsername: (username) => {
        const regex = /^[a-zA-Z0-9_]{3,20}$/;
        return regex.test(username);
    },
    
    validateEmail: (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },
    
    getUserIP: async () => {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('Failed to get user IP:', error);
            return null;
        }
    },
    
    isOwner: async () => {
        const userIP = await Utils.getUserIP();
        return userIP === CONFIG.OWNER_IP;
    },
    
    showNotification: (message, type = 'info') => {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    },
    
    playNotificationSound: () => {
        // Create audio context for notification sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
};

// Export for use in other files
window.CONFIG = CONFIG;
window.Utils = Utils;
