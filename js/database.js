// Local Storage Database Implementation
class LocalDatabase {
    constructor() {
        this.dbName = CONFIG.DATABASE_NAME;
        this.init();
    }
    
    init() {
        // Initialize database structure if it doesn't exist
        if (!localStorage.getItem(this.dbName)) {
            const initialData = {
                users: {},
                messages: [],
                events: [],
                directMessages: {},
                settings: {},
                leaderboard: {},
                version: '1.0.0'
            };
            localStorage.setItem(this.dbName, JSON.stringify(initialData));
        }
    }
    
    getData() {
        const data = localStorage.getItem(this.dbName);
        return data ? JSON.parse(data) : null;
    }
    
    saveData(data) {
        localStorage.setItem(this.dbName, JSON.stringify(data));
    }
    
    // User operations
    createUser(userData) {
        const data = this.getData();
        const userId = Utils.generateId();
        
        data.users[userId] = {
            id: userId,
            username: userData.username,
            displayName: userData.displayName,
            email: userData.email,
            password: userData.password, // In production, this should be hashed
            avatar: userData.avatar || 'assets/default-avatar.png',
            status: 'online',
            statusMessage: '',
            joinDate: Date.now(),
            lastSeen: Date.now(),
            messageCount: 0,
            rank: 'Member',
            isOwner: false,
            isMuted: false,
            theme: CONFIG.DEFAULTS.THEME
        };
        
        // Initialize leaderboard entry
        data.leaderboard[userId] = {
            userId: userId,
            messageCount: 0,
            joinDate: Date.now(),
            isLoserOfWeek: false
        };
        
        this.saveData(data);
        return data.users[userId];
    }
    
    getUserByUsername(username) {
        const data = this.getData();
        return Object.values(data.users).find(user => user.username === username);
    }
    
    getUserById(userId) {
        const data = this.getData();
        return data.users[userId];
    }
    
    updateUser(userId, updates) {
        const data = this.getData();
        if (data.users[userId]) {
            Object.assign(data.users[userId], updates);
            this.saveData(data);
            return data.users[userId];
        }
        return null;
    }
    
    getAllUsers() {
        const data = this.getData();
        return Object.values(data.users);
    }
    
    // Message operations
    addMessage(messageData) {
        const data = this.getData();
        const messageId = Utils.generateId();
        
        const message = {
            id: messageId,
            userId: messageData.userId,
            content: messageData.content,
            timestamp: Date.now(),
            type: messageData.type || 'text',
            edited: false,
            editedAt: null
        };
        
        data.messages.push(message);
        
        // Update user message count
        if (data.users[messageData.userId]) {
            data.users[messageData.userId].messageCount++;
            data.leaderboard[messageData.userId].messageCount++;
        }
        
        this.saveData(data);
        return message;
    }
    
    getMessages(limit = 50) {
        const data = this.getData();
        return data.messages.slice(-limit);
    }
    
    deleteMessage(messageId, userId) {
        const data = this.getData();
        const messageIndex = data.messages.findIndex(msg => msg.id === messageId);
        
        if (messageIndex !== -1) {
            const message = data.messages[messageIndex];
            // Only allow deletion if user owns the message or is owner
            if (message.userId === userId || data.users[userId]?.isOwner) {
                data.messages.splice(messageIndex, 1);
                this.saveData(data);
                return true;
            }
        }
        return false;
    }
    
    clearAllMessages(userId) {
        const data = this.getData();
        // Only allow if user is owner
        if (data.users[userId]?.isOwner) {
            data.messages = [];
            this.saveData(data);
            return true;
        }
        return false;
    }
    
    // Direct Message operations
    createDMConversation(user1Id, user2Id) {
        const data = this.getData();
        const conversationId = [user1Id, user2Id].sort().join('_');
        
        if (!data.directMessages[conversationId]) {
            data.directMessages[conversationId] = {
                id: conversationId,
                participants: [user1Id, user2Id],
                messages: [],
                createdAt: Date.now(),
                lastActivity: Date.now()
            };
            this.saveData(data);
        }
        
        return data.directMessages[conversationId];
    }
    
    addDMMessage(conversationId, messageData) {
        const data = this.getData();
        if (data.directMessages[conversationId]) {
            const messageId = Utils.generateId();
            const message = {
                id: messageId,
                userId: messageData.userId,
                content: messageData.content,
                timestamp: Date.now(),
                type: messageData.type || 'text'
            };
            
            data.directMessages[conversationId].messages.push(message);
            data.directMessages[conversationId].lastActivity = Date.now();
            this.saveData(data);
            return message;
        }
        return null;
    }
    
    getDMConversations(userId) {
        const data = this.getData();
        return Object.values(data.directMessages).filter(conv => 
            conv.participants.includes(userId)
        );
    }
    
    // Event operations
    createEvent(eventData, creatorId) {
        const data = this.getData();
        // Only allow if user is owner
        if (!data.users[creatorId]?.isOwner) {
            return null;
        }
        
        const eventId = Utils.generateId();
        const event = {
            id: eventId,
            title: eventData.title,
            description: eventData.description,
            startDate: eventData.startDate,
            endDate: eventData.endDate,
            createdBy: creatorId,
            createdAt: Date.now(),
            participants: [],
            isActive: true
        };
        
        data.events.push(event);
        this.saveData(data);
        return event;
    }
    
    getEvents() {
        const data = this.getData();
        return data.events.filter(event => event.isActive);
    }
    
    joinEvent(eventId, userId) {
        const data = this.getData();
        const event = data.events.find(e => e.id === eventId);
        if (event && !event.participants.includes(userId)) {
            event.participants.push(userId);
            this.saveData(data);
            return true;
        }
        return false;
    }
    
    // Leaderboard operations
    getLeaderboard() {
        const data = this.getData();
        const users = Object.values(data.users);
        const leaderboard = users.map(user => ({
            ...user,
            ...data.leaderboard[user.id]
        })).sort((a, b) => b.messageCount - a.messageCount);
        
        return leaderboard;
    }
    
    setLoserOfWeek(userId, setById) {
        const data = this.getData();
        // Only allow if setter is owner
        if (!data.users[setById]?.isOwner) {
            return false;
        }
        
        // Clear previous loser
        Object.values(data.leaderboard).forEach(entry => {
            entry.isLoserOfWeek = false;
        });
        
        // Set new loser
        if (data.leaderboard[userId]) {
            data.leaderboard[userId].isLoserOfWeek = true;
            this.saveData(data);
            return true;
        }
        return false;
    }
    
    // Settings operations
    getUserSettings(userId) {
        const data = this.getData();
        return data.settings[userId] || {};
    }
    
    update
        const data = this.getData();
        return data.settings[userId] || {};
    }
    
    updateUserSettings(userId, settings) {
        const data = this.getData();
        data.settings[userId] = { ...data.settings[userId], ...settings };
        this.saveData(data);
        return data.settings[userId];
    }
    
    // Admin operations
    muteUser(userId, mutedById) {
        const data = this.getData();
        // Only allow if muter is owner
        if (!data.users[mutedById]?.isOwner) {
            return false;
        }
        
        if (data.users[userId]) {
            data.users[userId].isMuted = true;
            this.saveData(data);
            return true;
        }
        return false;
    }
    
    unmuteUser(userId, unmutedById) {
        const data = this.getData();
        // Only allow if unmuter is owner
        if (!data.users[unmutedById]?.isOwner) {
            return false;
        }
        
        if (data.users[userId]) {
            data.users[userId].isMuted = false;
            this.saveData(data);
            return true;
        }
        return false;
    }
    
    kickUser(userId, kickedById) {
        const data = this.getData();
        // Only allow if kicker is owner
        if (!data.users[kickedById]?.isOwner) {
            return false;
        }
        
        if (data.users[userId] && !data.users[userId].isOwner) {
            delete data.users[userId];
            delete data.leaderboard[userId];
            delete data.settings[userId];
            this.saveData(data);
            return true;
        }
        return false;
    }
}

// Initialize database
const db = new LocalDatabase();
window.db = db;
