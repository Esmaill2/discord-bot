const socket = io();

let startTime = null;
let uptimeInterval = null;

// Connect to WebSocket
socket.on('connect', () => {
    console.log('Connected to server');
    addLog('info', 'Dashboard connected to server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    updateStatus('stopped');
    addLog('error', 'Dashboard disconnected from server');
});

// Receive updates from server
socket.on('update', (data) => {
    updateDashboard(data);
});

// Initial load
fetchStatus();
loadSettings();

// Load current settings
async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        
        document.getElementById('afkInterval').value = data.afkInterval || 30;
        document.getElementById('confirmTimeout').value = data.confirmTimeout || 2;
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

// Save settings
async function saveSettings() {
    const afkInterval = parseInt(document.getElementById('afkInterval').value);
    const confirmTimeout = parseInt(document.getElementById('confirmTimeout').value);
    const saveStatus = document.getElementById('saveStatus');
    
    if (afkInterval < 1 || afkInterval > 180) {
        saveStatus.textContent = '❌ AFK interval must be between 1-180 minutes';
        saveStatus.className = 'save-status error';
        setTimeout(() => saveStatus.textContent = '', 3000);
        return;
    }
    
    if (confirmTimeout < 1 || confirmTimeout > 10) {
        saveStatus.textContent = '❌ Confirmation timeout must be between 1-10 minutes';
        saveStatus.className = 'save-status error';
        setTimeout(() => saveStatus.textContent = '', 3000);
        return;
    }
    
    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ afkInterval, confirmTimeout })
        });
        
        const data = await response.json();
        
        if (data.success) {
            saveStatus.textContent = '✅ Settings saved! Restart bot to apply changes.';
            saveStatus.className = 'save-status success';
            addLog('info', `Settings updated: AFK=${afkInterval}min, Timeout=${confirmTimeout}min`);
        } else {
            saveStatus.textContent = '❌ ' + data.message;
            saveStatus.className = 'save-status error';
        }
        
        setTimeout(() => saveStatus.textContent = '', 5000);
    } catch (error) {
        saveStatus.textContent = '❌ Failed to save settings';
        saveStatus.className = 'save-status error';
        setTimeout(() => saveStatus.textContent = '', 3000);
    }
}

// Update dashboard with new data
function updateDashboard(data) {
    updateStatus(data.status);
    
    document.getElementById('servers').textContent = data.servers || 0;
    document.getElementById('activeUsers').textContent = data.activeUsers || 0;
    document.getElementById('afkChecks').textContent = data.afkChecksSent || 0;
    
    if (data.status === 'running' && !startTime) {
        startTime = Date.now() - (data.uptime || 0);
        startUptimeCounter();
    } else if (data.status === 'stopped') {
        startTime = null;
        stopUptimeCounter();
        document.getElementById('uptime').textContent = '0m';
    }
    
    updateUsersList(data.users || []);
}

// Update status indicator
function updateStatus(status) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const restartBtn = document.getElementById('restartBtn');
    
    statusDot.className = 'status-dot ' + status;
    
    if (status === 'running') {
        statusText.textContent = 'Bot Running';
        statusText.style.color = '#2ecc71';
        startBtn.disabled = true;
        stopBtn.disabled = false;
        restartBtn.disabled = false;
    } else {
        statusText.textContent = 'Bot Stopped';
        statusText.style.color = '#e74c3c';
        startBtn.disabled = false;
        stopBtn.disabled = true;
        restartBtn.disabled = true;
    }
}

// Update users list
function updateUsersList(users) {
    const container = document.getElementById('usersContainer');
    
    if (users.length === 0) {
        container.innerHTML = '<div class="no-data">No users in voice channels</div>';
        return;
    }
    
    container.innerHTML = users.map(user => `
        <div class="user-card">
            <div class="user-header">
                <div class="user-name">${escapeHtml(user.username)}</div>
                <div class="user-status">${user.awaitingConfirmation ? '⚠️ AFK Check' : '✅ Active'}</div>
            </div>
            <div class="user-info">
                <div>🎤 ${escapeHtml(user.channelName)}</div>
                <div>⏱️ Session: ${formatTime(user.sessionTime)}</div>
                <div>📊 Total: ${formatTime(user.totalTime)}</div>
                ${user.nextCheck ? `<div>⏰ Next check: ${formatTime(user.nextCheck)}</div>` : ''}
            </div>
        </div>
    `).join('');
}

// Uptime counter
function startUptimeCounter() {
    if (uptimeInterval) return;
    
    uptimeInterval = setInterval(() => {
        if (!startTime) return;
        const uptime = Date.now() - startTime;
        document.getElementById('uptime').textContent = formatUptime(uptime);
    }, 1000);
}

function stopUptimeCounter() {
    if (uptimeInterval) {
        clearInterval(uptimeInterval);
        uptimeInterval = null;
    }
}

// Format time in milliseconds to readable format
function formatTime(ms) {
    if (!ms || ms < 0) return '0m';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m`;
    } else {
        return `${seconds}s`;
    }
}

// Format uptime
function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add log entry
function addLog(type, message) {
    const logContainer = document.getElementById('activityLog');
    const time = new Date().toLocaleTimeString();
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `
        <span class="log-time">${time}</span>
        <span class="log-message">${escapeHtml(message)}</span>
    `;
    
    // Add to top
    if (logContainer.firstChild) {
        logContainer.insertBefore(entry, logContainer.firstChild);
    } else {
        logContainer.innerHTML = '';
        logContainer.appendChild(entry);
    }
    
    // Keep only last 50 entries
    while (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.lastChild);
    }
}

// Listen for log events
socket.on('log', (data) => {
    addLog(data.type, data.message);
});

// Bot control functions
async function startBot() {
    try {
        const response = await fetch('/api/bot/start', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            addLog('info', 'Bot started successfully');
        } else {
            addLog('error', data.message);
            alert(data.message);
        }
    } catch (error) {
        addLog('error', 'Failed to start bot: ' + error.message);
        alert('Failed to start bot');
    }
}

async function stopBot() {
    try {
        const response = await fetch('/api/bot/stop', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            addLog('info', 'Bot stopped successfully');
        } else {
            addLog('error', data.message);
            alert(data.message);
        }
    } catch (error) {
        addLog('error', 'Failed to stop bot: ' + error.message);
        alert('Failed to stop bot');
    }
}

async function restartBot() {
    try {
        const response = await fetch('/api/bot/restart', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            addLog('info', 'Bot restarted successfully');
        } else {
            addLog('error', data.message);
            alert(data.message);
        }
    } catch (error) {
        addLog('error', 'Failed to restart bot: ' + error.message);
        alert('Failed to restart bot');
    }
}

async function fetchStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        updateDashboard(data);
    } catch (error) {
        console.error('Failed to fetch status:', error);
    }
}

// Refresh status every 5 seconds
setInterval(fetchStatus, 5000);
