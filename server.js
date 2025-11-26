const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const GamificationSystem = require('./gamification');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3001;

// Initialize gamification system
const gamification = new GamificationSystem();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Store reference to bot module
let botModule = null;

// Serve dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Endpoints
app.get('/api/status', (req, res) => {
    if (!botModule) {
        return res.json({ 
            status: 'stopped',
            uptime: 0,
            servers: 0,
            activeUsers: 0,
            users: []
        });
    }

    const stats = botModule.getStats();
    const users = botModule.getVoiceUsers();
    res.json({
        status: botModule.isRunning ? 'running' : 'stopped',
        ...stats,
        users: users
    });
});

app.get('/api/users', (req, res) => {
    if (!botModule) {
        return res.json({ users: [] });
    }

    const users = botModule.getVoiceUsers();
    res.json({ users });
});

app.get('/api/settings', (req, res) => {
    if (!botModule) {
        return res.json({ afkInterval: 30, confirmTimeout: 2 });
    }

    const settings = botModule.getSettings();
    res.json(settings);
});

app.post('/api/settings', (req, res) => {
    try {
        const { afkInterval, confirmTimeout } = req.body;
        
        if (!afkInterval || !confirmTimeout) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        if (afkInterval < 1 || afkInterval > 180) {
            return res.status(400).json({ success: false, message: 'AFK interval must be between 1-180 minutes' });
        }
        
        if (confirmTimeout < 1 || confirmTimeout > 10) {
            return res.status(400).json({ success: false, message: 'Confirmation timeout must be between 1-10 minutes' });
        }
        
        if (!botModule) {
            botModule = require('./bot');
            botModule.setBroadcastFunction(broadcastUpdate);
        }
        
        botModule.updateSettings({ afkInterval, confirmTimeout });
        res.json({ success: true, message: 'Settings saved successfully' });
        broadcastUpdate();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/bot/start', async (req, res) => {
    try {
        if (!botModule) {
            botModule = require('./bot');
            botModule.setBroadcastFunction(broadcastUpdate);
        }
        
        if (botModule.isRunning) {
            return res.json({ success: false, message: 'Bot is already running' });
        }

        await botModule.start();
        res.json({ success: true, message: 'Bot started successfully' });
        broadcastUpdate();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/bot/stop', async (req, res) => {
    try {
        if (!botModule || !botModule.isRunning) {
            return res.json({ success: false, message: 'Bot is not running' });
        }

        await botModule.stop();
        res.json({ success: true, message: 'Bot stopped successfully' });
        broadcastUpdate();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/bot/restart', async (req, res) => {
    try {
        if (botModule && botModule.isRunning) {
            await botModule.stop();
        }
        
        // Reload the bot module
        delete require.cache[require.resolve('./bot')];
        botModule = require('./bot');
        botModule.setBroadcastFunction(broadcastUpdate);
        
        await botModule.start();
        res.json({ success: true, message: 'Bot restarted successfully' });
        broadcastUpdate();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Gamification API Endpoints
app.get('/api/gamification/profile/:userId', (req, res) => {
    try {
        const profile = gamification.getUserProfile(req.params.userId);
        if (!profile) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, profile });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/gamification/leaderboards', (req, res) => {
    try {
        const leaderboards = gamification.getLeaderboards();
        res.json({ success: true, leaderboards });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/gamification/achievements', (req, res) => {
    try {
        const achievements = gamification.getAchievements();
        const achievementList = Object.entries(achievements).map(([key, value]) => ({
            id: key,
            name: value.name,
            description: value.description
        }));
        res.json({ success: true, achievements: achievementList });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/gamification/role-rewards', (req, res) => {
    try {
        const rewards = gamification.getRoleRewards();
        res.json({ success: true, rewards });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// WebSocket connection
io.on('connection', (socket) => {
    console.log('Dashboard client connected');
    
    // Send initial data
    if (botModule) {
        socket.emit('update', {
            status: botModule.isRunning ? 'running' : 'stopped',
            ...botModule.getStats(),
            users: botModule.getVoiceUsers()
        });
    }

    socket.on('disconnect', () => {
        console.log('Dashboard client disconnected');
    });
});

// Broadcast updates to all connected clients
function broadcastUpdate() {
    if (!botModule) return;
    
    io.emit('update', {
        status: botModule.isRunning ? 'running' : 'stopped',
        ...botModule.getStats(),
        users: botModule.getVoiceUsers()
    });
}

// Export broadcast function and io for bot to use
module.exports = { broadcastUpdate, io };

// Start server
server.listen(PORT, () => {
    console.log(`🌐 Dashboard server running at http://localhost:${PORT}`);
    console.log(`📱 Open your browser to: http://localhost:${PORT}`);
    
    // Auto-start the bot
    botModule = require('./bot');
    botModule.setBroadcastFunction(broadcastUpdate);
    
    botModule.start().then(() => {
        console.log('✅ Bot started automatically');
        broadcastUpdate();
    }).catch(err => {
        console.error('❌ Failed to auto-start bot:', err.message);
    });
});
