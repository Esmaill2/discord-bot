const { Client, GatewayIntentBits, Collection } = require('discord.js');
const config = require('./config.json');

// Initialize Discord client with required intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Data structures to track voice channel activity
const voiceTimeTracking = new Map(); // userId -> { joinTime, totalTime }
const afkCheckTimers = new Map(); // userId -> { timer, channelId, guildId }
const awaitingConfirmation = new Map(); // userId -> { timeout, message }

// Constants
const AFK_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds
const CONFIRMATION_TIMEOUT = 2 * 60 * 1000; // 2 minutes in milliseconds

client.once('ready', () => {
    console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
    console.log(`📊 Monitoring voice channels across ${client.guilds.cache.size} servers`);
});

// Handle voice state updates (join/leave/move)
client.on('voiceStateUpdate', (oldState, newState) => {
    const userId = newState.id;
    const member = newState.member;

    // User joined a voice channel
    if (!oldState.channelId && newState.channelId) {
        handleUserJoinVoice(userId, newState.channelId, newState.guild.id);
        console.log(`🎤 ${member.user.tag} joined voice channel: ${newState.channel.name}`);
    }
    
    // User left a voice channel
    else if (oldState.channelId && !newState.channelId) {
        handleUserLeaveVoice(userId);
        console.log(`👋 ${member.user.tag} left voice channel: ${oldState.channel.name}`);
    }
    
    // User moved to a different voice channel
    else if (oldState.channelId !== newState.channelId) {
        handleUserLeaveVoice(userId);
        handleUserJoinVoice(userId, newState.channelId, newState.guild.id);
        console.log(`🔄 ${member.user.tag} moved from ${oldState.channel.name} to ${newState.channel.name}`);
    }
});

// Handle user joining a voice channel
function handleUserJoinVoice(userId, channelId, guildId) {
    // Initialize or update voice time tracking
    if (!voiceTimeTracking.has(userId)) {
        voiceTimeTracking.set(userId, {
            joinTime: Date.now(),
            totalTime: 0
        });
    } else {
        voiceTimeTracking.get(userId).joinTime = Date.now();
    }

    // Start AFK check timer (30 minutes)
    startAFKCheckTimer(userId, channelId, guildId);
}

// Handle user leaving a voice channel
function handleUserLeaveVoice(userId) {
    // Calculate and update total voice time
    const userData = voiceTimeTracking.get(userId);
    if (userData && userData.joinTime) {
        const timeSpent = Date.now() - userData.joinTime;
        userData.totalTime += timeSpent;
        userData.joinTime = null;
        
        const totalMinutes = Math.floor(userData.totalTime / 60000);
        console.log(`⏱️  User ${userId} total voice time: ${totalMinutes} minutes`);
    }

    // Clear AFK check timer
    clearAFKCheckTimer(userId);
    
    // Clear any pending confirmation
    clearPendingConfirmation(userId);
}

// Start the 30-minute AFK check timer
function startAFKCheckTimer(userId, channelId, guildId) {
    // Clear existing timer if any
    clearAFKCheckTimer(userId);

    const timer = setTimeout(() => {
        sendAFKCheck(userId, channelId, guildId);
    }, AFK_CHECK_INTERVAL);

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

// Send AFK check message to the channel
async function sendAFKCheck(userId, channelId, guildId) {
    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return;

        const voiceChannel = guild.channels.cache.get(channelId);
        if (!voiceChannel) return;

        const member = guild.members.cache.get(userId);
        if (!member) return;

        // Check if user is still in the voice channel
        if (!member.voice.channelId) {
            clearAFKCheckTimer(userId);
            return;
        }

        // Find a text channel to send the message (prefer channel with same name or general)
        let textChannel = guild.channels.cache.find(ch => 
            ch.isTextBased() && 
            !ch.isThread() && 
            (ch.name === voiceChannel.name || ch.name === 'general' || ch.name === 'chat')
        );

        // If no suitable channel found, use the first available text channel
        if (!textChannel) {
            textChannel = guild.channels.cache.find(ch => ch.isTextBased() && !ch.isThread());
        }

        if (!textChannel) {
            console.log(`❌ No text channel found in guild ${guild.name}`);
            // Restart timer since we couldn't send the message
            startAFKCheckTimer(userId, channelId, guildId);
            return;
        }

        const message = await textChannel.send(
            `⚠️ <@${userId}> Are you still active in **${voiceChannel.name}**? ` +
            `React with ✅ or type \`!here\` within 2 minutes to confirm, or you'll be disconnected.`
        );

        await message.react('✅');

        // Set up confirmation timeout
        const confirmationTimeout = setTimeout(async () => {
            await kickUserFromVoice(userId, guildId, voiceChannel.name);
            awaitingConfirmation.delete(userId);
        }, CONFIRMATION_TIMEOUT);

        awaitingConfirmation.set(userId, {
            timeout: confirmationTimeout,
            message: message,
            channelId: channelId,
            guildId: guildId
        });

        console.log(`⏰ AFK check sent to ${member.user.tag} in ${voiceChannel.name}`);

    } catch (error) {
        console.error('Error sending AFK check:', error);
        // Restart timer on error
        startAFKCheckTimer(userId, channelId, guildId);
    }
}

// Handle reaction for confirmation
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

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

// Handle user confirmation
function handleUserConfirmation(userId) {
    const confirmData = awaitingConfirmation.get(userId);
    if (!confirmData) return;

    // Clear the confirmation timeout
    clearTimeout(confirmData.timeout);
    awaitingConfirmation.delete(userId);

    // Send confirmation message
    confirmData.message.reply(`✅ <@${userId}> confirmed! You can continue in the voice channel.`);

    // Restart the 30-minute timer
    startAFKCheckTimer(userId, confirmData.channelId, confirmData.guildId);

    console.log(`✅ User ${userId} confirmed activity`);
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
            await member.voice.disconnect('AFK - Did not respond to activity check');
            console.log(`🚫 Kicked ${member.user.tag} from ${channelName} for being AFK`);
            
            // Send notification
            const confirmData = awaitingConfirmation.get(userId);
            if (confirmData && confirmData.message) {
                await confirmData.message.reply(
                    `⏱️ <@${userId}> was disconnected from **${channelName}** for not responding to the activity check.`
                );
            }
        }

        handleUserLeaveVoice(userId);
    } catch (error) {
        console.error('Error kicking user from voice:', error);
    }
}

// Login to Discord
client.login(config.token);
