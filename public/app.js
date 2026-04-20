/**
 * VenueFlow AI - Frontend Application
 * Refactored to modularly separate State, API, UI Rendering, and Application Control.
 */

// ============================================
// 1. STATE MANAGEMENT LAYER
// ============================================
const State = {
    previousRecIds: '' // Used to track changes for screen reader announcements
};

// ============================================
// 2. API ABSTRACTION LAYER
// ============================================
const API = {
    /** Fetch pre-computed optimum recommendations from the Node backend */
    async fetchRecommendations() {
        const res = await fetch('/api/recommend');
        if (!res.ok) throw new Error("Failed to fetch recommendations");
        return await res.json();
    },

    /** Fetch live capacities and wait times for the venue */
    async fetchVenueStatus() {
        const res = await fetch('/api/status');
        if (!res.ok) throw new Error("Failed to fetch status");
        return await res.json();
    },

    /** Pass user chat intent to the backend Gemini AI logic */
    async sendChatQuery(query) {
        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            const data = await res.json();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// ============================================
// 3. UI RENDERING LAYER
// ============================================
const UI = {
    // DOM Cache
    elements: {
        tabFan: document.getElementById('btn-fan-view'),
        tabOps: document.getElementById('btn-ops-view'),
        viewFan: document.getElementById('view-fan'),
        viewOps: document.getElementById('view-ops'),
        srAnnouncer: document.getElementById('sr-announcer'),
        chatForm: document.getElementById('chat-form'),
        chatInput: document.getElementById('chat-input'),
        chatWindow: document.getElementById('chat-window'),
        navTabs: [document.getElementById('btn-fan-view'), document.getElementById('btn-ops-view')]
    },

    /** Toggle visible panes and accessible properties between Fan/Ops boards */
    switchView(viewName) {
        const { tabFan, tabOps, viewFan, viewOps } = this.elements;
        
        const isFan = viewName === 'fan';
        
        // Update styling and ARIA states
        tabFan.classList.toggle('active', isFan);
        tabFan.setAttribute('aria-selected', isFan);
        tabOps.classList.toggle('active', !isFan);
        tabOps.setAttribute('aria-selected', !isFan);
        
        // Manage visible panels
        if (isFan) {
            viewFan.classList.add('active-view');
            viewFan.removeAttribute('hidden');
            viewOps.classList.remove('active-view');
            viewOps.setAttribute('hidden', '');
        } else {
            viewOps.classList.add('active-view');
            viewOps.removeAttribute('hidden');
            viewFan.classList.remove('active-view');
            viewFan.setAttribute('hidden', '');
        }
    },

    /** Insert updated data points into a specific recommendation card */
    updateRecCard(cardId, itemData, type) {
        const card = document.getElementById(cardId);
        if (!itemData) return;

        const nameEl = card.querySelector('.rec-name');
        const badgeEl = card.querySelector('.wait-badge');

        nameEl.textContent = itemData.name;
        
        const waitText = this._formatWaitTime(itemData.waitTimeMs) + ' wait';
        badgeEl.textContent = waitText;
        badgeEl.className = `wait-badge ${this._getBadgeClass(itemData.waitTimeMs)}`;

        card.setAttribute('aria-label', `Fastest ${type} is ${itemData.name} with a ${waitText}`);
    },

    /** Render robust progress bars onto the Operational Dashboard */
    updateDashboardList(listId, items) {
        const ul = document.getElementById(listId);
        ul.innerHTML = ''; // Wipe and re-draw list
        
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'status-item';
            
            const mins = Math.round(item.waitTimeMs / 60000);
            let barClass = '';
            if (item.capacity >= 80) barClass = 'danger';
            else if (item.capacity >= 50) barClass = 'warning';

            li.setAttribute('aria-label', `${item.name}, wait time: ${mins} minutes, capacity: ${item.capacity}%`);
            li.setAttribute('tabindex', '0');

            li.innerHTML = `
                <span class="status-name" aria-hidden="true">${item.name}</span>
                <div class="status-metrics" aria-hidden="true">
                    <span style="font-size:0.8rem; color:var(--text-muted)">${mins}m</span>
                    <div class="progress-bar-bg" title="Capacity: ${item.capacity}%">
                        <div class="progress-bar-fill ${barClass}" style="width: ${item.capacity}%"></div>
                    </div>
                </div>
            `;
            ul.appendChild(li);
        });
    },

    /** Appends a chat bubble to the virtual assistant thread */
    appendChatMessage(sender, text) {
        const msg = document.createElement('div');
        msg.className = `message ${sender}`;
        msg.textContent = text;
        msg.setAttribute('tabindex', '0'); 
        
        if (sender === 'ai') msg.setAttribute('aria-label', `AI says: ${text}`);
        else msg.setAttribute('aria-label', `You said: ${text}`);
        
        this.elements.chatWindow.appendChild(msg);
        this.elements.chatWindow.scrollTop = this.elements.chatWindow.scrollHeight;
        
        return msg; // Return DOM node specifically for manipulating typing indicators
    },

    removeChatMessage(msgElement) {
        msgElement?.remove();
    },

    /** Quietly inject text into screen reader live queue without visible UI disruption */
    announce(message) {
        this.elements.srAnnouncer.textContent = message;
    },

    // UI Formatting Helpers
    _formatWaitTime(ms) {
        return `${Math.round(ms / 60000)} min`;
    },

    _getBadgeClass(ms) {
        const mins = Math.round(ms / 60000);
        if (mins < 3) return ''; 
        if (mins <= 5) return 'warning';
        return 'danger';
    }
};

// ============================================
// 4. CONTROLLER (EVENT COORDINATION)
// ============================================
const Controller = {
    init() {
        this.bindUserEvents();
        this.startDataPolling();
    },

    bindUserEvents() {
        const { tabFan, tabOps, chatForm, chatInput, navTabs } = UI.elements;

        // View Toggles via Click
        tabFan.addEventListener('click', () => UI.switchView('fan'));
        tabOps.addEventListener('click', () => UI.switchView('ops'));

        // View Toggles via Roving Tabindex Keyboard Input
        navTabs.forEach((tab, index) => {
            tab.addEventListener('keydown', (e) => {
                let changeFocus = false;
                let nextIndex = index;

                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    nextIndex = (index + 1) % navTabs.length;
                    changeFocus = true;
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    nextIndex = (index - 1 + navTabs.length) % navTabs.length;
                    changeFocus = true;
                } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    tab.click();
                }

                if (changeFocus) {
                    e.preventDefault();
                    navTabs[index].setAttribute('tabindex', '-1');
                    navTabs[nextIndex].setAttribute('tabindex', '0');
                    navTabs[nextIndex].focus();
                }
            });
        });

        // AI Chat Submission
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (!text) return;

            // Immediately display user text
            UI.appendChatMessage('user', text);
            chatInput.value = '';

            // Handle Backend processing
            await this.processChatQuery(text);
        });
    },

    /** Execute the query against Gemini/Fallback and paint the responses onto UI */
    async processChatQuery(text) {
        const typingIndicator = UI.appendChatMessage('ai', 'Thinking...');
        
        const result = await API.sendChatQuery(text);
        
        UI.removeChatMessage(typingIndicator);
        
        if (result.success && result.data.response) {
            UI.appendChatMessage('ai', result.data.response);
            UI.announce('AI says: ' + result.data.response);
        } else {
            const errorText = 'Sorry, I encountered an error.';
            UI.appendChatMessage('ai', errorText);
            UI.announce(errorText);
        }
    },

    /** Continuous pinging for live data streams */
    startDataPolling() {
        // Initial immediate sync
        this.executeLifecycleSync();
        // Repeating interval sync
        setInterval(() => this.executeLifecycleSync(), 5000);
    },

    /** Wraps both dashboard rendering and recommendation rendering in a unified Promise call */
    async executeLifecycleSync() {
        try {
            const [recs, status] = await Promise.all([
                API.fetchRecommendations(),
                API.fetchVenueStatus()
            ]);

            // Sync Dashboard Grids
            UI.updateDashboardList('list-gates', status.gates);
            UI.updateDashboardList('list-food', status.foodStalls);
            UI.updateDashboardList('list-restrooms', status.restrooms);

            // Sync Fan Top Picks
            UI.updateRecCard('rec-gate', recs.bestGate, 'Gate');
            UI.updateRecCard('rec-food', recs.bestFood, 'Food');
            UI.updateRecCard('rec-restroom', recs.bestRestroom, 'Restroom');

            // Trigger accessibility announcement solely on context shifts
            const currentRecIds = `${recs.bestGate?.id}-${recs.bestFood?.id}-${recs.bestRestroom?.id}`;
            if (State.previousRecIds && State.previousRecIds !== currentRecIds) {
                 UI.announce(`Recommendations updated: ${recs.bestGate.name} is now the fastest gate. ${recs.bestFood.name} is the quickest bite.`);
            }
            State.previousRecIds = currentRecIds;

        } catch (err) {
            console.error("Critical Background Polling Sync Failed:", err);
        }
    }
};

// ============================================
// APPLICATION BOOTSTRAP
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    Controller.init();
});
