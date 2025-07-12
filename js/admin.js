// Admin System
class AdminSystem {
    constructor(db, authSystem, Utils) {
        this.db = db;
        this.authSystem = authSystem;
        this.Utils = Utils;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadLeaderboard();
    }
    
    setupEventListeners() {
        // Leaderboard controls
        const setLoserBtn = document.getElementById('setLoserBtn');
        if (setLoserBtn) {
            setLoserBtn.addEventListener('click', () => this.showSetLoserModal());
        }
        
        // Admin controls in settings
        const kickUserBtn = document.getElementById('kickUserBtn');
        const muteUserBtn = document.getElementById('muteUserBtn');
        const broadcastBtn = document.getElementById('broadcastBtn');
        
        if (kickUserBtn) {
            kickUserBtn.addEventListener('click', () => this.showKickUserModal());
        }
        
        if (muteUserBtn) {
            muteUserBtn.addEventListener('click', () => this.showMuteUserModal());
        }
        
        if (broadcastBtn) {
            broadcastBtn.addEventListener('click', () => this.showBroadcastModal());
        }
    }
    
    loadLeaderboard() {
        const leaderboard = this.db.getLeaderboard();
        this.renderLeaderboard(leaderboard);
    }
    
    renderLeaderboard(leaderboard) {
        const leaderboardContainer = document.getElementById('leaderboardContainer');
        if (!leaderboardContainer) return;
        
        leaderboardContainer.innerHTML = '';
        
        if (leaderboard.length === 0) {
            leaderboardContainer.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-trophy" style="font-size: 48px; color: var(--text-secondary); margin-bottom: 16px;"></i>
                    <h3 style="color: var(--text-secondary); margin-bottom: 8px;">No Data Available</h3>
                    <p style="color: var(--text-secondary); font-size: 14px;">Start chatting to see the leaderboard!</p>
                </div>
            `;
            return;
        }
        
        leaderboard.forEach((user, index) => {
            const leaderboardItem = this.createLeaderboardItem(user, index + 1);
            leaderboardContainer.appendChild(leaderboardItem);
        });
    }
    
    createLeaderboardItem(user, rank) {
        const itemElement = document.createElement('div');
        itemElement.className = 'leaderboard-item';
        itemElement.dataset.userId = user.id;
        
        let rankDisplay = rank;
        let rankClass = '';
        
        if (rank === 1) {
            rankDisplay = '🥇';
            rankClass = 'rank-gold';
        } else if (rank === 2) {
            rankDisplay = '🥈';
            rankClass = 'rank-silver';
        } else if (rank === 3) {
            rankDisplay = '🥉';
            rankClass = 'rank-bronze';
        }
        
        const joinDate = new Date(user.joinDate).toLocaleDateString();
        const daysSinceJoin = Math.floor((Date.now() - user.joinDate) / (1000 * 60 * 60 * 24));
        
        itemElement.innerHTML = `
            <div class="leaderboard-rank ${rankClass}">${rankDisplay}</div>
            <img src="${user.avatar}" alt="${user.displayName}" class="leaderboard-avatar">
            <div class="leaderboard-info">
                <div class="leaderboard-name">
                    ${user.displayName}
                    ${user.isOwner ? '<i class="fas fa-crown" style="color: #ffd700; margin-left: 8px;" title="Owner"></i>' : ''}
                    ${user.isLoserOfWeek ? '<span class="loser-badge">Loser of the Week</span>' : ''}
                </div>
                <div class="leaderboard-stats">
                    ${user.messageCount} messages • Joined ${daysSinceJoin} days ago
                </div>
            </div>
            <div class="leaderboard-actions">
                ${this.authSystem.isUserOwner() && !user.isOwner ? 
                    `<button class="btn-sm btn-warning set-loser-btn" data-user-id="${user.id}">Set as Loser</button>` : ''
                }
            </div>
        `;
        
        // Add event listeners
        const setLoserBtn = itemElement.querySelector('.set-loser-btn');
        if (setLoserBtn) {
            setLoserBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setLoserOfWeek(user.id, user.displayName);
            });
        }
        
        return itemElement;
    }
    
    showSetLoserModal() {
        if (!this.authSystem.isUserOwner()) {
            this.Utils.showNotification('Only the owner can set loser of the week', 'error');
            return;
        }
        
        const users = this.db.getAllUsers().filter(user => !user.isOwner);
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Set Loser of the Week</h2>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">
                        Select a user to designate as "Loser of the Week". This will be displayed on their profile.
                    </p>
                    <div class="user-list">
                        ${users.map(user => `
                            <div class="user-select-item" data-user-id="${user.id}">
                                <img src="${user.avatar}" alt="${user.displayName}" class="user-select-avatar">
                                <span class="user-select-name">${user.displayName}</span>
                                ${user.isLoserOfWeek ? '<span class="current-loser">(Current Loser)</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelectorAll('.user-select-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = item.dataset.userId;
                const userName = item.querySelector('.user-select-name').textContent;
                this.setLoserOfWeek(userId, userName);
                modal.remove();
            });
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    setLoserOfWeek(userId, userName) {
        if (!this.authSystem.isUserOwner()) {
            this.Utils.showNotification('Only the owner can set loser of the week', 'error');
            return;
        }
        
        const currentUser = this.authSystem.getCurrentUser();
        
        if (confirm(`Are you sure you want to set ${userName} as "Loser of the Week"?`)) {
            if (this.db.setLoserOfWeek(userId, currentUser.id)) {
                this.Utils.showNotification(`${userName} has been set as Loser of the Week`, 'success');
                this.loadLeaderboard();
                
                // Announce in chat
                if (window.chatSystem) {
                    window.chatSystem.displaySystemMessage(`👑 ${userName} has been crowned "Loser of the Week" by the owner! 🏆`);
                }
            } else {
                this.Utils.showNotification('Failed to set loser of the week', 'error');
            }
        }
    }
    
    showKickUserModal() {
        if (!this.authSystem.isUserOwner()) {
            this.Utils.showNotification('Only the owner can kick users', 'error');
            return;
        }
        
        const users = this.db.getAllUsers().filter(user => !user.isOwner);
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Kick User</h2>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">
                        Select a user to kick from the server. This will permanently remove their account.
                    </p>
                    <div class="user-list">
                        ${users.map(user => `
                            <div class="user-select-item kick-item" data-user-id="${user.id}">
                                <img src="${user.avatar}" alt="${user.displayName}" class="user-select-avatar">
                                <span class="user-select-name">${user.displayName}</span>
                                <button class="btn-danger btn-sm">Kick</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelectorAll('.kick-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = item.dataset.userId;
                const userName = item.querySelector('.user-select-name').textContent;
                this.kickUser(userId, userName);
                modal.remove();
            });
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    kickUser(userId, userName) {
        if (!this.authSystem.isUserOwner()) {
            this.Utils.showNotification('Only the owner can kick users', 'error');
            return;
        }
        
        const currentUser = this.authSystem.getCurrentUser();
        
        if (confirm(`Are you sure you want to kick ${userName}? This action cannot be undone.`)) {
            if (this.db.kickUser(userId, currentUser.id)) {
                this.Utils.showNotification(`${userName} has been kicked from the server`, 'success');
                this.loadLeaderboard();
                
                // Update member list
                if (window.chatSystem) {
                    window.chatSystem.loadMembers();
                    window.chatSystem.displaySystemMessage(`⚠️ ${userName} has been kicked from the server by the owner`);
                }
            } else {
                this.Utils.showNotification('Failed to kick user', 'error');
            }
        }
    }
    
    showMuteUserModal() {
        if (!this.authSystem.isUserOwner()) {
            this.Utils.showNotification('Only the owner can mute users', 'error');
            return;
        }
        
        const users = this.db.getAllUsers().filter(user => !user.isOwner);
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Mute/Unmute User</h2>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">
                        Select a user to mute or unmute. Muted users cannot send messages.
                    </p>
                    <div class="user-list">
                        ${users.map(user => `
                            <div class="user-select-item mute-item" data-user-id="${user.id}">
                                <img src="${user.avatar}" alt="${user.displayName}" class="user-select-avatar">
                                <span class="user-select-name">${user.displayName}</span>
                                <button class="btn-${user.isMuted ? 'primary' : 'warning'} btn-sm">
                                    ${user.isMuted ? 'Unmute' : 'Mute'}
                                </button>
                                ${user.isMuted ? '<span class="muted-indicator">(Muted)</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelectorAll('.mute-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = item.dataset.userId;
                const userName = item.querySelector('.user-select-name').textContent;
                const user = this.db.getUserById(userId);
                
                if (user.isMuted) {
                    this.unmuteUser(userId, userName);
                } else {
                    this.muteUser(userId, userName);
                }
                modal.remove();
            });
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    muteUser(userId, userName) {
        const currentUser = this.authSystem.getCurrentUser();
        
        if (this.db.muteUser(userId, currentUser.id)) {
            this.Utils.showNotification(`${userName} has been muted`, 'success');
            
            if (window.chatSystem) {
                window.chatSystem.displaySystemMessage(`🔇 ${userName} has been muted by the owner`);
            }
        } else {
            this.Utils.showNotification('Failed to mute user', 'error');
        }
    }
    
    unmuteUser(userId, userName) {
        const currentUser = this.authSystem.getCurrentUser();
        
        if (this.db.unmuteUser(userId, currentUser.id)) {
            this.Utils.showNotification(`${userName} has been unmuted`, 'success');
            
            if (window.chatSystem) {
                window.chatSystem.displaySystemMessage(`🔊 ${userName} has been unmuted by the owner`);
            }
        } else {
            this.Utils.showNotification('Failed to unmute user', 'error');
        }
    }
    
    showBroadcastModal() {
        if (!this.authSystem.isUserOwner()) {
            this.Utils.showNotification('Only the owner can send broadcasts', 'error');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Server Broadcast</h2>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">
                        Send an important message to all users. This will appear as a system message.
                    </p>
                    <div class="setting-group">
                        <label for="broadcastMessage">Broadcast Message</label>
                        <textarea id="broadcastMessage" rows="4" maxlength="500" placeholder="Enter your broadcast message..." style="width: 100%; padding: 12px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-family: inherit; resize: vertical;"></textarea>
                    </div>
                    <div class="setting-group">
                        <button id="sendBroadcast" class="btn-primary">Send Broadcast</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#sendBroadcast').addEventListener('click', () => {
            const message = modal.querySelector('#broadcastMessage').value.trim();
            if (message) {
                this.sendBroadcast(message);
                modal.remove();
            } else {
                this.Utils.showNotification('Please enter a broadcast message', 'error');
            }
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    sendBroadcast(message) {
        if (!this.authSystem.isUserOwner()) {
            this.Utils.showNotification('Only the owner can send broadcasts', 'error');
            return;
        }
        
        if (window.chatSystem) {
            window.chatSystem.displaySystemMessage(`📢 BROADCAST: ${message}`);
            this.Utils.showNotification('Broadcast sent successfully', 'success');
        }
    }
    
    generateServerStats() {
        const users = this.db.getAllUsers();
        const messages = this.db.getMessages(1000);
        const events = this.db.getEvents();
        
        const stats = {
            totalUsers: users.length,
            onlineUsers: users.filter(u => u.status === 'online').length,
            totalMessages: messages.length,
            activeEvents: events.length,
            topUser: users.sort((a, b) => b.messageCount - a.messageCount)[0]
        };
        
        return stats;
    }
}

// Initialize admin system
const adminSystem = new AdminSystem(window.db, window.authSystem, window.Utils);
window.adminSystem = adminSystem;
