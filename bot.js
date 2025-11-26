const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./config.json');
const GamificationSystem = require('./gamification');

// Initialize Discord client
let client = null;
let isRunning = false;
let startTime = null;
let broadcastUpdate = null;

// Initialize gamification system
const gamification = new GamificationSystem();

// Data structures to track voice channel activity
const voiceTimeTracking = new Map(); // userId -> { joinTime, totalTime }
const afkCheckTimers = new Map(); // userId -> { timer, channelId, guildId }
const awaitingConfirmation = new Map(); // userId -> { timeout, message }

// Statistics
let stats = {
    afkChecksSent: 0,
    usersKicked: 0
};

// Settings (can be updated)
let settings = {
    afkInterval: 30, // minutes
    confirmTimeout: 2 // minutes
};

// Load settings from file if exists
try {
    const fs = require('fs');
    if (fs.existsSync('./settings.json')) {
        const savedSettings = JSON.parse(fs.readFileSync('./settings.json', 'utf8'));
        settings = { ...settings, ...savedSettings };
    }
} catch (error) {
    console.log('No saved settings found, using defaults');
}

// Check if test mode is enabled
if (config.testMode) {
    settings.afkInterval = 1; // 1 minute for testing
    settings.confirmTimeout = 0.5; // 30 seconds for testing
    console.log('⚠️ TEST MODE ENABLED - Using reduced timers (1min AFK, 30sec timeout)');
}

// Performance settings for large scale
const MAX_CONCURRENT_USERS = 500;
const WARN_USER_THRESHOLD = 100;

// Get time intervals from settings
function getAFKCheckInterval() {
    return settings.afkInterval * 60 * 1000;
}

function getConfirmationTimeout() {
    return settings.confirmTimeout * 60 * 1000;
}

function initializeClient() {
    client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.MessageContent
        ],
        partials: [
            Partials.Message,
            Partials.Channel,
            Partials.Reaction
        ]
    });

    client.once('ready', () => {
        console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
        console.log(`📊 Monitoring voice channels across ${client.guilds.cache.size} servers`);
        isRunning = true;
        startTime = Date.now();
        emitLog('info', `Bot logged in as ${client.user.tag}`);
        notifyDashboard();
    });

    // Handle voice state updates (join/leave/move)
    client.on('voiceStateUpdate', (oldState, newState) => {
        const userId = newState.id;
        const member = newState.member;

        // User joined a voice channel
        if (!oldState.channelId && newState.channelId) {
            handleUserJoinVoice(userId, newState.channelId, newState.guild.id);
            console.log(`🎤 ${member.user.tag} joined voice channel: ${newState.channel.name}`);
            emitLog('join', `${member.user.tag} joined ${newState.channel.name}`);
        }
        
        // User left a voice channel
        else if (oldState.channelId && !newState.channelId) {
            handleUserLeaveVoice(userId);
            console.log(`👋 ${member.user.tag} left voice channel: ${oldState.channel.name}`);
            emitLog('leave', `${member.user.tag} left ${oldState.channel.name}`);
        }
        
        // User moved to a different voice channel
        else if (oldState.channelId !== newState.channelId) {
            handleUserLeaveVoice(userId);
            handleUserJoinVoice(userId, newState.channelId, newState.guild.id);
            console.log(`🔄 ${member.user.tag} moved from ${oldState.channel.name} to ${newState.channel.name}`);
            emitLog('info', `${member.user.tag} moved to ${newState.channel.name}`);
        }

        notifyDashboard();
    });

    // Handle reaction for confirmation
    client.on('messageReactionAdd', async (reaction, user) => {
        if (user.bot) return;

        // Fetch the message if it's a partial
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Error fetching reaction:', error);
                return;
            }
        }

        const confirmData = awaitingConfirmation.get(user.id);
        if (confirmData && reaction.message.id === confirmData.message.id && reaction.emoji.name === '✅') {
            handleUserConfirmation(user.id);
        }
    });

    // Handle message for !here command
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        if (message.content.toLowerCase() === '!here') {
            const confirmData = awaitingConfirmation.get(message.author.id);
            if (confirmData) {
                handleUserConfirmation(message.author.id);
            }
        }
    });
}

// Handle user joining a voice channel
function handleUserJoinVoice(userId, channelId, guildId) {
    // Check if we're approaching capacity
    const currentUsers = afkCheckTimers.size;
    if (currentUsers >= MAX_CONCURRENT_USERS) {
        console.warn(`⚠️ Max user capacity reached (${MAX_CONCURRENT_USERS})! New user not tracked.`);
        emitLog('error', `Max capacity reached: ${MAX_CONCURRENT_USERS} users`);
        return;
    }
    
    if (currentUsers >= WARN_USER_THRESHOLD && currentUsers % 50 === 0) {
        console.log(`📊 High load: ${currentUsers} active users in voice channels`);
        emitLog('info', `High load: ${currentUsers} active users`);
    }
    
    // Get member for username
    const guild = client.guilds.cache.get(guildId);
    const member = guild?.members.cache.get(userId);
    const username = member?.user.tag || 'Unknown User';
    
    // Gamification: Handle user join
    const joinResult = gamification.handleUserJoin(userId, username);
    
    if (joinResult.newStreak > 1) {
        console.log(`🔥 ${username} has a ${joinResult.newStreak}-day streak!`);
    }
    
    if (!voiceTimeTracking.has(userId)) {
        voiceTimeTracking.set(userId, {
            joinTime: Date.now(),
            totalTime: 0
        });
    } else {
        voiceTimeTracking.get(userId).joinTime = Date.now();
    }

    startAFKCheckTimer(userId, channelId, guildId);
}

// Handle user leaving a voice channel
function handleUserLeaveVoice(userId) {
    const userData = voiceTimeTracking.get(userId);
    if (userData && userData.joinTime) {
        const timeSpent = Date.now() - userData.joinTime;
        userData.totalTime += timeSpent;
        userData.joinTime = null;
        
        const totalMinutes = Math.floor(userData.totalTime / 60000);
        console.log(`⏱️  User ${userId} total voice time: ${totalMinutes} minutes`);
        
        // Gamification: Handle user leave
        try {
            const leaveResult = gamification.handleUserLeave(userId);
            
            if (leaveResult) {
                console.log(`💎 User earned ${leaveResult.xpEarned} XP (${leaveResult.duration} minutes)`);
                
                // Level up notification
                if (leaveResult.leveledUp) {
                    console.log(`🎉 User leveled up to Level ${leaveResult.newLevel}!`);
                    emitLog('levelup', `User ${userId} reached Level ${leaveResult.newLevel}`);
                    
                    // Check for role rewards
                    const roleReward = gamification.checkRoleReward(leaveResult.newLevel);
                    if (roleReward) {
                        console.log(`🏆 User unlocked role: ${roleReward}`);
                    }
                }
                
                // Achievement notifications
                if (leaveResult.unlockedAchievements.length > 0) {
                    leaveResult.unlockedAchievements.forEach(achievement => {
                        console.log(`🏅 Achievement Unlocked: ${achievement.name} - ${achievement.description}`);
                        emitLog('achievement', `User ${userId} unlocked: ${achievement.name}`);
                    });
                }
            }
        } catch (error) {
            console.error('Gamification error:', error);
        }
    }

    clearAFKCheckTimer(userId);
    clearPendingConfirmation(userId);
}

// Start the AFK check timer
function startAFKCheckTimer(userId, channelId, guildId) {
    clearAFKCheckTimer(userId);

    const timer = setTimeout(() => {
        sendAFKCheck(userId, channelId, guildId);
    }, getAFKCheckInterval());

    afkCheckTimers.set(userId, { timer, channelId, guildId });
}

// Clear AFK check timer
function clearAFKCheckTimer(userId) {
    const timerData = afkCheckTimers.get(userId);
    if (timerData) {
        clearTimeout(timerData.timer);
        afkCheckTimers.delete(userId);
    }
}

// Message queue to prevent rate limiting
const messageQueue = [];
let isProcessingQueue = false;

async function processMessageQueue() {
    if (isProcessingQueue || messageQueue.length === 0) return;
    
    isProcessingQueue = true;
    
    while (messageQueue.length > 0) {
        const task = messageQueue.shift();
        try {
            await task();
            // Rate limit: wait 500ms between messages to avoid Discord limits
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('Error processing message queue:', error);
        }
    }
    
    isProcessingQueue = false;
}

// Send AFK check message to the channel
async function sendAFKCheck(userId, channelId, guildId) {
    // Queue the AFK check to prevent rate limiting
    messageQueue.push(async () => {
        await sendAFKCheckImmediate(userId, channelId, guildId);
    });
    processMessageQueue();
}

async function sendAFKCheckImmediate(userId, channelId, guildId) {
    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return;

        const voiceChannel = guild.channels.cache.get(channelId);
        if (!voiceChannel) return;

        const member = guild.members.cache.get(userId);
        if (!member) return;

        if (!member.voice.channelId) {
            clearAFKCheckTimer(userId);
            return;
        }

        let textChannel = guild.channels.cache.find(ch => 
            ch.isTextBased() && 
            !ch.isThread() && 
            (ch.name === voiceChannel.name || ch.name === 'general' || ch.name === 'chat')
        );

        if (!textChannel) {
            textChannel = guild.channels.cache.find(ch => ch.isTextBased() && !ch.isThread());
        }

        if (!textChannel) {
            console.log(`❌ No text channel found in guild ${guild.name}`);
            startAFKCheckTimer(userId, channelId, guildId);
            return;
        }

        // Send ephemeral-style message by sending and deleting after user sees it
        const message = await textChannel.send(
            `⚠️ <@${userId}> Are you still here in **${voiceChannel.name}**? ` +
            `Click ✅ or type \`!here\` within 2 minutes to confirm, or you will be kicked.`
        );

        await message.react('✅');

        stats.afkChecksSent++;
        emitLog('afk', `AFK check sent to ${member.user.tag} in ${voiceChannel.name}`);

        const confirmationTimeout = setTimeout(async () => {
            await kickUserFromVoice(userId, guildId, voiceChannel.name);
            awaitingConfirmation.delete(userId);
            // Delete the message after timeout
            try {
                await message.delete();
            } catch (err) {
                console.log('Could not delete AFK message');
            }
        }, getConfirmationTimeout());

        awaitingConfirmation.set(userId, {
            timeout: confirmationTimeout,
            message: message,
            channelId: channelId,
            guildId: guildId
        });

        console.log(`⏰ AFK check sent to ${member.user.tag} in ${voiceChannel.name}`);
        notifyDashboard();

    } catch (error) {
        console.error('Error sending AFK check:', error);
        startAFKCheckTimer(userId, channelId, guildId);
    }
}

// Handle user confirmation
async function handleUserConfirmation(userId) {
    const confirmData = awaitingConfirmation.get(userId);
    if (!confirmData) return;

    clearTimeout(confirmData.timeout);
    awaitingConfirmation.delete(userId);

    // Reply and delete both messages after a short time
    try {
        const reply = await confirmData.message.reply(`✅ <@${userId}> Confirmed! You can stay in the voice channel.`);
        
        // Delete both messages after 5 seconds
        setTimeout(async () => {
            try {
                await confirmData.message.delete();
                await reply.delete();
            } catch (err) {
                console.log('Could not delete confirmation messages');
            }
        }, 5000);
    } catch (error) {
        console.log(`Could not reply to confirmation message: ${error.message}`);
    }

    startAFKCheckTimer(userId, confirmData.channelId, confirmData.guildId);

    console.log(`✅ User ${userId} confirmed activity`);
    emitLog('info', `User confirmed activity`);
    notifyDashboard();
}

// Clear pending confirmation
function clearPendingConfirmation(userId) {
    const confirmData = awaitingConfirmation.get(userId);
    if (confirmData) {
        clearTimeout(confirmData.timeout);
        awaitingConfirmation.delete(userId);
    }
}

// Kick user from voice channel
async function kickUserFromVoice(userId, guildId, channelName) {
    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return;

        const member = guild.members.cache.get(userId);
        if (!member) return;

        if (member.voice.channelId) {
            await member.voice.disconnect('AFK - Did not respond');
            console.log(`🚫 Kicked ${member.user.tag} from ${channelName} for being AFK`);
            stats.usersKicked++;
            emitLog('kick', `${member.user.tag} was kicked from ${channelName} for being AFK`);
            
            const confirmData = awaitingConfirmation.get(userId);
            if (confirmData && confirmData.message) {
                try {
                    const kickMsg = await confirmData.message.reply(
                        `⏱️ <@${userId}> You were kicked from **${channelName}** for not responding.`
                    );
                    
                    // Delete both messages after 10 seconds
                    setTimeout(async () => {
                        try {
                            await confirmData.message.delete();
                            await kickMsg.delete();
                        } catch (err) {
                            console.log('Could not delete kick messages');
                        }
                    }, 10000);
                } catch (err) {
                    console.log('Could not send kick message');
                }
            }
        }

        handleUserLeaveVoice(userId);
        notifyDashboard();
    } catch (error) {
        console.error('Error kicking user from voice:', error);
    }
}

// Get bot statistics
function getStats() {
    const memUsage = process.memoryUsage();
    return {
        uptime: startTime ? Date.now() - startTime : 0,
        servers: client ? client.guilds.cache.size : 0,
        activeUsers: afkCheckTimers.size,
        afkChecksSent: stats.afkChecksSent,
        usersKicked: stats.usersKicked,
        queuedMessages: messageQueue.length,
        memoryUsageMB: Math.round(memUsage.heapUsed / 1024 / 1024)
    };
}

// Get voice users data (optimized for large datasets)
function getVoiceUsers() {
    if (!client) return [];

    const users = [];
    const now = Date.now();
    
    // Limit results to prevent dashboard overload
    const MAX_DISPLAY_USERS = 200;
    let processedCount = 0;
    
    for (const [userId, timerData] of afkCheckTimers.entries()) {
        if (processedCount >= MAX_DISPLAY_USERS) {
            console.log(`⚠️ Dashboard display limited to ${MAX_DISPLAY_USERS} users`);
            break;
        }
        processedCount++;
        try {
            const guild = client.guilds.cache.get(timerData.guildId);
            if (!guild) continue;

            const member = guild.members.cache.get(userId);
            if (!member) {
                console.log(`Member ${userId} not in cache, skipping...`);
                continue;
            }
            
            if (!member.voice.channelId) {
                console.log(`Member ${member.user.tag} not in voice channel, skipping...`);
                continue;
            }

            const channel = guild.channels.cache.get(member.voice.channelId);
            const userData = voiceTimeTracking.get(userId);
            const confirmData = awaitingConfirmation.get(userId);

            const sessionTime = userData && userData.joinTime 
                ? now - userData.joinTime 
                : 0;

            users.push({
                id: userId,
                username: member.user.tag,
                channelName: channel ? channel.name : 'Unknown',
                sessionTime: sessionTime,
                totalTime: userData ? userData.totalTime : 0,
                awaitingConfirmation: !!confirmData,
                nextCheck: getAFKCheckInterval() - sessionTime
            });
        } catch (error) {
            console.error('Error getting user data:', error);
        }
    }

    return users;
}

// Notify dashboard of updates with throttling
let dashboardUpdateTimeout = null;
function notifyDashboard() {
    if (!broadcastUpdate) return;
    
    // Throttle updates to every 2 seconds max for performance
    if (dashboardUpdateTimeout) return;
    
    dashboardUpdateTimeout = setTimeout(() => {
        broadcastUpdate();
        dashboardUpdateTimeout = null;
    }, 2000);
}

// Emit log to dashboard
function emitLog(type, message) {
    try {
        const serverModule = require('./server');
        if (serverModule && serverModule.io) {
            serverModule.io.emit('log', { type, message });
        }
    } catch (error) {
        // Server module not available yet
    }
}

// Start the bot
async function start() {
    if (isRunning) {
        throw new Error('Bot is already running');
    }

    if (!client) {
        initializeClient();
    }

    await client.login(config.token);
}

// Stop the bot
async function stop() {
    if (!isRunning) {
        throw new Error('Bot is not running');
    }

    // Clear all timers
    for (const userId of afkCheckTimers.keys()) {
        clearAFKCheckTimer(userId);
    }
    for (const userId of awaitingConfirmation.keys()) {
        clearPendingConfirmation(userId);
    }

    // Clear tracking data
    voiceTimeTracking.clear();

    await client.destroy();
    client = null;
    isRunning = false;
    startTime = null;
    
    console.log('🛑 Bot stopped');
    emitLog('info', 'Bot stopped');
}

// Set broadcast function from server
function setBroadcastFunction(fn) {
    broadcastUpdate = fn;
}

// Get current settings
function getSettings() {
    return { ...settings };
}

// Update settings
function updateSettings(newSettings) {
    settings = { ...settings, ...newSettings };
    
    // Save to file
    const fs = require('fs');
    try {
        fs.writeFileSync('./settings.json', JSON.stringify(settings, null, 2));
        console.log('⚙️ Settings updated:', settings);
        emitLog('info', `Settings updated: AFK=${settings.afkInterval}min, Timeout=${settings.confirmTimeout}min`);
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

module.exports = {
    start,
    stop,
    getStats,
    getVoiceUsers,
    setBroadcastFunction,
    getSettings,
    updateSettings,
    get isRunning() { return isRunning; }
};
