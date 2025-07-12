// Chat System
class ChatSystem {
    constructor(authSystem, db, Utils) {
        this.authSystem = authSystem;
        this.db = db;
        this.Utils = Utils;
        this.currentSection = 'general';
        this.currentDMConversation = null;
        this.typingTimeout = null;
        this.messageUpdateInterval = null;
        this.onlineUsers = new Set();
    }
    
    init() {
        this.setupEventListeners();
        this.loadMessages();
        this.loadMembers();
        this.loadDMConversations();
        this.updateUserInfo();
        this.startMessageUpdates();
        this.simulateOnlineUsers();
    }
    
    setupEventListeners() {
        // Message input
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
                this.handleTyping();
            });
        }
        
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        // Navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });
        
        // DM functionality
        const addDmBtn = document.getElementById('addDmBtn');
        if (addDmBtn) {
            addDmBtn.addEventListener('click', () => this.showDMModal());
        }
        
        // Clear chat (owner only)
        const clearChatBtn = document.getElementById('clearChatBtn');
        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => this.clearChat());
        }
        
        // Member interactions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.member-item')) {
                const memberItem = e.target.closest('.member-item');
                const userId = memberItem.dataset.userId;
                this.showMemberContextMenu(e, userId);
            }
        });
    }
    
    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const content = messageInput.value.trim();
        
        if (!content) return;
        
        const currentUser = this.authSystem.getCurrentUser();
        if (!currentUser) return;
        
        // Check if user is muted
        const user = this.db.getUserById(currentUser.id);
        if (user && user.isMuted) {
            this.Utils.showNotification('You are muted and cannot send messages', 'error');
            return;
        }
        
        if (this.currentSection === 'general') {
            // Send to general chat
            const message = this.db.addMessage({
                userId: currentUser.id,
                content: this.Utils.sanitizeInput(content),
                type: 'text'
            });
            
            this.displayMessage(message);
            this.playMessageSound();
        } else if (this.currentDMConversation) {
            // Send to DM conversation
            const message = this.db.addDMMessage(this.currentDMConversation.id, {
                userId: currentUser.id,
                content: this.Utils.sanitizeInput(content),
                type: 'text'
            });
            
            this.displayDMMessage(message);
        }
        
        messageInput.value = '';
        this.scrollToBottom();
    }
    
    loadMessages() {
        const messages = this.db.getMessages(100);
        const chatMessages = document.getElementById('chatMessages');
        
        if (!chatMessages) return;
        
        chatMessages.innerHTML = '';
        
        messages.forEach(message => {
            this.displayMessage(message);
        });
        
        this.scrollToBottom();
    }
    
    displayMessage(message) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const user = this.db.getUserById(message.userId);
        if (!user) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.dataset.messageId = message.id;
        
        messageElement.innerHTML = `
            <img src="${user.avatar}" alt="${user.displayName}" class="message-avatar">
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${user.displayName}</span>
                    <span class="message-timestamp">${this.Utils.formatTimestamp(message.timestamp)}</span>
                </div>
                <div class="message-text">${message.content}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageElement);
    }
    
    displaySystemMessage(content) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'system-message';
        messageElement.textContent = content;
        
        chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }
    
    loadMembers() {
        const membersList = document.getElementById('membersList');
        const memberCount = document.getElementById('memberCount');
        
        if (!membersList || !memberCount) return;
        
        const users = this.db.getAllUsers();
        const onlineUsers = users.filter(user => user.status === 'online');
        
        membersList.innerHTML = '';
        memberCount.textContent = onlineUsers.length;
        
        // Sort by status and name
        onlineUsers.sort((a, b) => {
            if (a.isOwner && !b.isOwner) return -1;
            if (!a.isOwner && b.isOwner) return 1;
            return a.displayName.localeCompare(b.displayName);
        });
        
        onlineUsers.forEach(user => {
            const memberElement = document.createElement('div');
            memberElement.className = 'member-item';
            memberElement.dataset.userId = user.id;
            
            const roleText = user.isOwner ? 'Owner' : user.rank || 'Member';
            const statusClass = user.status || 'offline';
            
            memberElement.innerHTML = `
                <div class="member-avatar">
                    <img src="${user.avatar}" alt="${user.displayName}">
                    <div class="status-indicator ${statusClass}"></div>
                </div>
                <div class="member-info">
                    <div class="member-name">${user.displayName}</div>
                    <div class="member-role">${roleText}</div>
                </div>
            `;
            
            membersList.appendChild(memberElement);
        });
    }
    
    loadDMConversations() {
        const currentUser = this.authSystem.getCurrentUser();
        if (!currentUser) return;
        
        const conversations = this.db.getDMConversations(currentUser.id);
        const dmList = document.getElementById('dmList');
        
        if (!dmList) return;
        
        dmList.innerHTML = '';
        
        conversations.forEach(conversation => {
            const otherUserId = conversation.participants.find(id => id !== currentUser.id);
            const otherUser = this.db.getUserById(otherUserId);
            
            if (!otherUser) return;
            
            const dmElement = document.createElement('div');
            dmElement.className = 'dm-item';
            dmElement.dataset.conversationId = conversation.id;
            
            dmElement.innerHTML = `
                <div class="dm-avatar">
                    <img src="${otherUser.avatar}" alt="${otherUser.displayName}">
                    <div class="status-indicator ${otherUser.status || 'offline'}"></div>
                </div>
                <div class="dm-name">${otherUser.displayName}</div>
            `;
            
            dmElement.addEventListener('click', () => {
                this.openDMConversation(conversation);
            });
            
            dmList.appendChild(dmElement);
        });
    }
    
    openDMConversation(conversation) {
        this.currentDMConversation = conversation;
        this.currentSection = 'dm';
        
        // Update UI
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelectorAll('.dm-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelector(`[data-conversation-id="${conversation.id}"]`).classList.add('active');
        
        // Switch to DM view
        this.switchSection('dm');
        this.loadDMMessages(conversation);
    }
    
    loadDMMessages(conversation) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        chatMessages.innerHTML = '';
        
        conversation.messages.forEach(message => {
            this.displayDMMessage(message);
        });
        
        this.scrollToBottom();
    }
    
    displayDMMessage(message) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const user = this.db.getUserById(message.userId);
        if (!user) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        
        messageElement.innerHTML = `
            <img src="${user.avatar}" alt="${user.displayName}" class="message-avatar">
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${user.displayName}</span>
                    <span class="message-timestamp">${this.Utils.formatTimestamp(message.timestamp)}</span>
                </div>
                <div class="message-text">${message.content}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageElement);
    }
    
    switchSection(section) {
        this.currentSection = section;
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
        
        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        if (section === 'dm' && this.currentDMConversation) {
            document.getElementById('general-section').classList.add('active');
            this.loadDMMessages(this.currentDMConversation);
        } else {
            document.getElementById(`${section}-section`)?.classList.add('active');
            
            if (section === 'general') {
                this.currentDMConversation = null;
                this.loadMessages();
            }
        }
        
        // Update message input placeholder
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            if (section === 'dm' && this.currentDMConversation) {
                const otherUserId = this.currentDMConversation.participants.find(id => 
                    id !== this.authSystem.getCurrentUser().id
                );
                const otherUser = this.db.getUserById(otherUserId);
                messageInput.placeholder = `Message ${otherUser?.displayName || 'User'}`;
            } else {
                messageInput.placeholder = 'Message #general';
            }
        }
    }
    
    showDMModal() {
        const modal = document.getElementById('dmModal');
        if (modal) {
            modal.classList.remove('hidden');
            this.loadUserSearchResults();
        }
    }
    
    loadUserSearchResults() {
        const currentUser = this.authSystem.getCurrentUser();
        const users = this.db.getAllUsers().filter(user => user.id !== currentUser.id);
        const searchResults = document.getElementById('dmSearchResults');
        
        if (!searchResults) return;
        
        searchResults.innerHTML = '';
        
        users.forEach(user => {
            const resultElement = document.createElement('div');
            resultElement.className = 'search-result-item';
            
            resultElement.innerHTML = `
                <img src="${user.avatar}" alt="${user.displayName}" class="search-result-avatar">
                <span class="search-result-name">${user.displayName}</span>
            `;
            
            resultElement.addEventListener('click', () => {
                this.startDMConversation(user.id);
                document.getElementById('dmModal').classList.add('hidden');
            });
            
            searchResults.appendChild(resultElement);
        });
    }
    
    startDMConversation(otherUserId) {
        const currentUser = this.authSystem.getCurrentUser();
        const conversation = this.db.createDMConversation(currentUser.id, otherUserId);
        
        this.loadDMConversations();
        this.openDMConversation(conversation);
    }
    
    clearChat() {
        const currentUser = this.authSystem.getCurrentUser();
        if (!this.authSystem.isUserOwner()) {
            this.Utils.showNotification('Only the owner can clear chat', 'error');
            return;
        }
        
        if (confirm('Are you sure you want to clear all messages? This cannot be undone.')) {
            this.db.clearAllMessages(currentUser.id);
            this.loadMessages();
            this.displaySystemMessage('Chat has been cleared by the owner');
            this.Utils.showNotification('Chat cleared successfully', 'success');
        }
    }
    
    handleTyping() {
        // Clear existing timeout
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
        
        // Show typing indicator
        const typingIndicator = document.getElementById('typingIndicator');
        const currentUser = this.authSystem.getCurrentUser();
        
        if (typingIndicator && currentUser) {
            typingIndicator.textContent = `${currentUser.displayName} is typing...`;
            
            // Hide after 3 seconds
            this.typingTimeout = setTimeout(() => {
                typingIndicator.textContent = '';
            }, 3000);
        }
    }
    
    updateUserInfo() {
        const currentUser = this.authSystem.getCurrentUser();
        if (!currentUser) return;
        
        const userName = document.getElementById('userName');
        const userStatus = document.getElementById('userStatus');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userName) userName.textContent = currentUser.displayName;
        if (userStatus) userStatus.textContent = currentUser.statusMessage || 'Online';
        if (userAvatar) {
            const img = userAvatar.querySelector('img');
            if (img) img.src = currentUser.avatar;
        }
    }
    
    startMessageUpdates() {
        // Simulate real-time updates by checking for new messages periodically
        this.messageUpdateInterval = setInterval(() => {
            if (this.currentSection === 'general') {
                const currentMessageCount = document.querySelectorAll('.message').length;
                const latestMessages = this.db.getMessages(100);
                
                if (latestMessages.length > currentMessageCount) {
                    this.loadMessages();
                }
            }
            
            // Update member list
            this.loadMembers();
        }, 5000);
    }
    
    simulateOnlineUsers() {
        // Simulate other users being online
        const users = this.db.getAllUsers();
        users.forEach(user => {
            if (Math.random() > 0.3) { // 70% chance of being online
                this.db.updateUser(user.id, { status: 'online' });
            }
        });
    }
    
    playMessageSound() {
        this.Utils.playNotificationSound();
    }
    
    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    showMemberContextMenu(event, userId) {
        if (!this.authSystem.isUserOwner()) return;
        
        event.preventDefault();
        
        const user = this.db.getUserById(userId);
        if (!user || user.isOwner) return;
        
        const contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        contextMenu.style.position = 'fixed';
        contextMenu.style.left = event.clientX + 'px';
        contextMenu.style.top = event.clientY + 'px';
        contextMenu.style.background = 'var(--bg-secondary)';
        contextMenu.style.border = '1px solid var(--border-color)';
        contextMenu.style.borderRadius = '8px';
        contextMenu.style.padding = '8px';
        contextMenu.style.zIndex = '1000';
        
        contextMenu.innerHTML = `
            <div class="context-menu-item" data-action="mute">Mute User</div>
            <div class="context-menu-item" data-action="kick">Kick User</div>
            <div class="context-menu-item" data-action="dm">Send DM</div>
        `;
        
        contextMenu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'mute') {
                this.muteUser(userId);
            } else if (action === 'kick') {
                this.kickUser(userId);
            } else if (action === 'dm') {
                this.startDMConversation(userId);
            }
            contextMenu.remove();
        });
        
        document.body.appendChild(contextMenu);
        
        // Remove on click outside
        setTimeout(() => {
            document.addEventListener('click', () => {
                contextMenu.remove();
            }, { once: true });
        }, 100);
    }
    
    muteUser(userId) {
        const currentUser = this.authSystem.getCurrentUser();
        if (this.db.muteUser(userId, currentUser.id)) {
            const user = this.db.getUserById(userId);
            this.displaySystemMessage(`${user.displayName} has been muted by the owner`);
            this.Utils.showNotification('User muted successfully', 'success');
        }
    }
    
    kickUser(userId) {
        const user = this.db.getUserById(userId);
        const currentUser = this.authSystem.getCurrentUser();
        
        if (confirm(`Are you sure you want to kick ${user.displayName}?`)) {
            if (this.db.kickUser(userId, currentUser.id)) {
                this.displaySystemMessage(`${user.displayName} has been kicked by the owner`);
                this.loadMembers();
                this.Utils.showNotification('User kicked successfully', 'success');
            }
        }
    }
}

// Initialize chat system
const chatSystem = new ChatSystem(authSystem, db, Utils);
window.chatSystem = chatSystem;
