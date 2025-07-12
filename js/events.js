// Events System
class EventsSystem {
    constructor(db, authSystem, Utils) {
        this.events = [];
        this.db = db;
        this.authSystem = authSystem;
        this.Utils = Utils;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadEvents();
        this.checkActiveEvents();
    }
    
    setupEventListeners() {
        const createEventBtn = document.getElementById('createEventBtn');
        if (createEventBtn) {
            createEventBtn.addEventListener('click', () => this.showCreateEventModal());
        }
    }
    
    loadEvents() {
        this.events = this.db.getEvents();
        this.renderEvents();
        this.updateEventIndicator();
    }
    
    renderEvents() {
        const eventsContainer = document.getElementById('eventsContainer');
        if (!eventsContainer) return;
        
        eventsContainer.innerHTML = '';
        
        if (this.events.length === 0) {
            eventsContainer.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-calendar-times" style="font-size: 48px; color: var(--text-secondary); margin-bottom: 16px;"></i>
                    <h3 style="color: var(--text-secondary); margin-bottom: 8px;">No Events Scheduled</h3>
                    <p style="color: var(--text-secondary); font-size: 14px;">Check back later for upcoming events!</p>
                </div>
            `;
            return;
        }
        
        this.events.forEach(event => {
            const eventElement = this.createEventElement(event);
            eventsContainer.appendChild(eventElement);
        });
    }
    
    createEventElement(event) {
        const eventElement = document.createElement('div');
        eventElement.className = 'event-card';
        eventElement.dataset.eventId = event.id;
        
        const creator = this.db.getUserById(event.createdBy);
        const startDate = new Date(event.startDate);
        const endDate = event.endDate ? new Date(event.endDate) : null;
        const now = new Date();
        
        let statusText = '';
        let statusClass = '';
        
        if (now < startDate) {
            statusText = 'Upcoming';
            statusClass = 'event-upcoming';
        } else if (now >= startDate && (!endDate || now <= endDate)) {
            statusText = 'Active';
            statusClass = 'event-active';
        } else {
            statusText = 'Ended';
            statusClass = 'event-ended';
        }
        
        const currentUser = this.authSystem.getCurrentUser();
        const isParticipant = event.participants.includes(currentUser?.id);
        
        eventElement.innerHTML = `
            <div class="event-header">
                <div class="event-title">${event.title}</div>
                <div class="event-status ${statusClass}">${statusText}</div>
            </div>
            <div class="event-description">${event.description}</div>
            <div class="event-details">
                <div class="event-time">
                    <i class="fas fa-clock"></i>
                    <span>${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    ${endDate ? ` - ${endDate.toLocaleDateString()} ${endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : ''}
                </div>
                <div class="event-creator">
                    <i class="fas fa-user"></i>
                    <span>Created by ${creator?.displayName || 'Unknown'}</span>
                </div>
                <div class="event-participants">
                    <i class="fas fa-users"></i>
                    <span>${event.participants.length} participant(s)</span>
                </div>
            </div>
            <div class="event-actions">
                ${!isParticipant && statusText !== 'Ended' ? 
                    `<button class="btn-primary join-event-btn" data-event-id="${event.id}">Join Event</button>` : 
                    isParticipant ? '<span class="joined-indicator"><i class="fas fa-check"></i> Joined</span>' : ''
                }
                ${this.authSystem.isUserOwner() ? 
                    `<button class="btn-danger delete-event-btn" data-event-id="${event.id}">Delete</button>` : ''
                }
            </div>
        `;
        
        // Add event listeners
        const joinBtn = eventElement.querySelector('.join-event-btn');
        if (joinBtn) {
            joinBtn.addEventListener('click', () => this.joinEvent(event.id));
        }
        
        const deleteBtn = eventElement.querySelector('.delete-event-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteEvent(event.id));
        }
        
        return eventElement;
    }
    
    showCreateEventModal() {
        if (!this.authSystem.isUserOwner()) {
            this.Utils.showNotification('Only the owner can create events', 'error');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Create New Event</h2>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="createEventForm">
                        <div class="setting-group">
                            <label for="eventTitle">Event Title</label>
                            <input type="text" id="eventTitle" required maxlength="100">
                        </div>
                        <div class="setting-group">
                            <label for="eventDescription">Description</label>
                            <textarea id="eventDescription" rows="4" maxlength="500" style="width: 100%; padding: 12px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-family: inherit; resize: vertical;"></textarea>
                        </div>
                        <div class="setting-group">
                            <label for="eventStartDate">Start Date & Time</label>
                            <input type="datetime-local" id="eventStartDate" required style="width: 100%; padding: 12px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary);">
                        </div>
                        <div class="setting-group">
                            <label for="eventEndDate">End Date & Time (Optional)</label>
                            <input type="datetime-local" id="eventEndDate" style="width: 100%; padding: 12px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary);">
                        </div>
                        <div class="setting-group">
                            <button type="submit" class="btn-primary">Create Event</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Set minimum date to now
        const now = new Date();
        const startDateInput = modal.querySelector('#eventStartDate');
        startDateInput.min = now.toISOString().slice(0, 16);
        
        // Event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#createEventForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createEvent(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    createEvent(modal) {
        const title = modal.querySelector('#eventTitle').value.trim();
        const description = modal.querySelector('#eventDescription').value.trim();
        const startDate = modal.querySelector('#eventStartDate').value;
        const endDate = modal.querySelector('#eventEndDate').value;
        
        if (!title || !description || !startDate) {
            this.Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        const startDateTime = new Date(startDate).getTime();
        const endDateTime = endDate ? new Date(endDate).getTime() : null;
        
        if (endDateTime && endDateTime <= startDateTime) {
            this.Utils.showNotification('End date must be after start date', 'error');
            return;
        }
        
        const currentUser = this.authSystem.getCurrentUser();
        const eventData = {
            title,
            description,
            startDate: startDateTime,
            endDate: endDateTime
        };
        
        const event = this.db.createEvent(eventData, currentUser.id);
        
        if (event) {
            this.Utils.showNotification('Event created successfully!', 'success');
            this.loadEvents();
            modal.remove();
            
            // Announce event in chat
            if (window.chatSystem) {
                window.chatSystem.displaySystemMessage(`📅 New event created: "${title}" - ${new Date(startDateTime).toLocaleDateString()}`);
            }
        } else {
            this.Utils.showNotification('Failed to create event', 'error');
        }
    }
    
    joinEvent(eventId) {
        const currentUser = this.authSystem.getCurrentUser();
        if (!currentUser) return;
        
        if (this.db.joinEvent(eventId, currentUser.id)) {
            this.Utils.showNotification('Successfully joined the event!', 'success');
            this.loadEvents();
            
            const event = this.events.find(e => e.id === eventId);
            if (event && window.chatSystem) {
                window.chatSystem.displaySystemMessage(`🎉 ${currentUser.displayName} joined the event "${event.title}"`);
            }
        } else {
            this.Utils.showNotification('Failed to join event', 'error');
        }
    }
    
    deleteEvent(eventId) {
        if (!this.authSystem.isUserOwner()) {
            this.Utils.showNotification('Only the owner can delete events', 'error');
            return;
        }
        
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        if (confirm(`Are you sure you want to delete the event "${event.title}"?`)) {
            const data = this.db.getData();
            const eventIndex = data.events.findIndex(e => e.id === eventId);
            
            if (eventIndex !== -1) {
                data.events[eventIndex].isActive = false;
                this.db.saveData(data);
                
                this.Utils.showNotification('Event deleted successfully', 'success');
                this.loadEvents();
                
                if (window.chatSystem) {
                    window.chatSystem.displaySystemMessage(`🗑️ Event "${event.title}" has been deleted by the owner`);
                }
            }
        }
    }
    
    updateEventIndicator() {
        const eventIndicator = document.getElementById('eventIndicator');
        if (!eventIndicator) return;
        
        const now = new Date();
        const activeEvents = this.events.filter(event => {
            const startDate = new Date(event.startDate);
            const endDate = event.endDate ? new Date(event.endDate) : null;
            return now >= startDate && (!endDate || now <= endDate);
        });
        
        if (activeEvents.length > 0) {
            eventIndicator.classList.add('active');
            eventIndicator.title = `${activeEvents.length} active event(s)`;
        } else {
            eventIndicator.classList.remove('active');
        }
    }
    
    checkActiveEvents() {
        // Check for active events every minute
        setInterval(() => {
            this.updateEventIndicator();
        }, 60000);
    }
    
    getUpcomingEvents() {
        const now = new Date();
        return this.events.filter(event => {
            const startDate = new Date(event.startDate);
            return startDate > now;
        }).sort((a, b) => a.startDate - b.startDate);
    }
    
    getActiveEvents() {
        const now = new Date();
        return this.events.filter(event => {
            const startDate = new Date(event.startDate);
            const endDate = event.endDate ? new Date(event.endDate) : null;
            return now >= startDate && (!endDate || now <= endDate);
        });
    }
}

// Initialize events system
const db = window.db; // Assuming db is available in the global scope
const authSystem = window.authSystem; // Assuming authSystem is available in the global scope
const Utils = window.Utils; // Assuming Utils is available in the global scope
const eventsSystem = new EventsSystem(db, authSystem, Utils);
window.eventsSystem = eventsSystem;
