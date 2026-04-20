document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation Logic ---
    const btnFan = document.getElementById('btn-fan-view');
    const btnOps = document.getElementById('btn-ops-view');
    const viewFan = document.getElementById('view-fan');
    const viewOps = document.getElementById('view-ops');

    btnFan.addEventListener('click', () => switchView('fan'));
    btnOps.addEventListener('click', () => switchView('ops'));

    function switchView(viewName) {
        if (viewName === 'fan') {
            btnFan.classList.add('active');
            btnOps.classList.remove('active');
            viewFan.classList.add('active-view');
            viewOps.classList.remove('active-view');
        } else {
            btnOps.classList.add('active');
            btnFan.classList.remove('active');
            viewOps.classList.add('active-view');
            viewFan.classList.remove('active-view');
        }
    }

    // --- Data Fetching & UI Updation ---
    async function fetchRecommendations() {
        try {
            const res = await fetch('/api/recommend');
            const data = await res.json();
            updateRecCard('rec-gate', data.bestGate);
            updateRecCard('rec-food', data.bestFood);
            updateRecCard('rec-restroom', data.bestRestroom);
        } catch (e) {
            console.error("Failed to fetch recommendations:", e);
        }
    }

    async function fetchVenueStatus() {
        try {
            const res = await fetch('/api/status');
            const data = await res.json();
            updateDashboardList('list-gates', data.gates);
            updateDashboardList('list-food', data.foodStalls);
            updateDashboardList('list-restrooms', data.restrooms);
        } catch (e) {
            console.error("Failed to fetch status:", e);
        }
    }

    // Polling every 5 seconds
    fetchRecommendations();
    fetchVenueStatus();
    setInterval(() => {
        fetchRecommendations();
        fetchVenueStatus();
    }, 5000);

    // --- Helper Functions ---
    function formatWaitTime(ms) {
        const mins = Math.round(ms / 60000);
        return `${mins} min`;
    }

    function getBadgeClass(ms) {
        const mins = Math.round(ms / 60000);
        if (mins < 3) return ''; 
        if (mins <= 5) return 'warning';
        return 'danger';
    }

    function updateRecCard(cardId, itemData) {
        const card = document.getElementById(cardId);
        if (!itemData) return;
        const nameEl = card.querySelector('.rec-name');
        const badgeEl = card.querySelector('.wait-badge');

        nameEl.textContent = itemData.name;
        badgeEl.textContent = formatWaitTime(itemData.waitTimeMs) + ' wait';
        
        // Update styling
        badgeEl.className = `wait-badge ${getBadgeClass(itemData.waitTimeMs)}`;
    }

    function updateDashboardList(listId, items) {
        const ul = document.getElementById(listId);
        ul.innerHTML = '';
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'status-item';
            
            const mins = Math.round(item.waitTimeMs / 60000);
            let barClass = '';
            if (item.capacity >= 80) barClass = 'danger';
            else if (item.capacity >= 50) barClass = 'warning';

            li.innerHTML = `
                <span class="status-name">${item.name}</span>
                <div class="status-metrics">
                    <span style="font-size:0.8rem; color:var(--text-muted)">${mins}m</span>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill ${barClass}" style="width: ${item.capacity}%"></div>
                    </div>
                </div>
            `;
            ul.appendChild(li);
        });
    }

    // --- Chat Logic ---
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatWindow = document.getElementById('chat-window');

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage('user', text);
        chatInput.value = '';

        const typingIndicator = appendMessage('ai', 'Thinking...');

        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: text })
            });
            const data = await res.json();
            
            // Remove typing indicator
            typingIndicator.remove();
            
            if (data.response) {
                appendMessage('ai', data.response);
            } else {
                appendMessage('ai', 'Sorry, I encountered an error.');
            }
        } catch(e) {
            typingIndicator.remove();
            appendMessage('ai', 'Error connecting to the AI service.');
        }
    });

    function appendMessage(sender, text) {
        const msg = document.createElement('div');
        msg.className = `message ${sender}`;
        msg.textContent = text;
        chatWindow.appendChild(msg);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        return msg; // useful for removing typing indicator
    }
});
