# Discord Voice Time Tracker Bot

A Discord bot that tracks voice channel time for users and implements an AFK check system to ensure users are active. Includes a beautiful web dashboard for monitoring and controlling the bot.

## Features

- 📊 **Voice Time Tracking**: Automatically tracks how long each user spends in voice channels
- ⏰ **AFK Checks**: Every 30 minutes, sends a message to users in voice channels to confirm they're not AFK
- ⚡ **Quick Confirmation**: Users have 2 minutes to confirm by reacting with ✅ or typing `!here`
- 🚫 **Auto-Kick**: Users who don't respond are automatically disconnected from the voice channel
- 👥 **Multi-User Support**: Works simultaneously for multiple users across all voice channels in your server
- 🌐 **Web Dashboard**: Real-time dashboard to monitor stats and control the bot
- 📈 **Live Statistics**: Track uptime, active users, AFK checks, and more

## Dashboard Features

- ▶️ Start/Stop/Restart bot controls
- 📊 Real-time statistics display
- 👤 Live view of users in voice channels
- ⏱️ Session and total voice time for each user
- 📜 Activity log with real-time updates
- 📱 Responsive design for mobile and desktop

## Setup Instructions

### 1. Create a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section in the left sidebar
4. Click "Add Bot"
5. Under "Privileged Gateway Intents", enable:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
6. Click "Reset Token" and copy your bot token

### 2. Configure the Bot

1. Open `config.json` in this directory
2. Replace `YOUR_BOT_TOKEN_HERE` with your actual bot token:
   ```json
   {
     "token": "your_actual_token_here"
   }
   ```

### 3. Install Dependencies

Open a terminal in this directory and run:
```powershell
npm install
```

### 4. Invite the Bot to Your Server

1. Go back to the Discord Developer Portal
2. Select your application
3. Go to "OAuth2" → "URL Generator"
4. Under "Scopes", select:
   - ✅ bot
5. Under "Bot Permissions", select:
   - ✅ Read Messages/View Channels
   - ✅ Send Messages
   - ✅ Add Reactions
   - ✅ Move Members
   - ✅ Connect (to voice channels)
6. Copy the generated URL and open it in your browser
7. Select your server and authorize the bot

### 5. Run the Bot

**With Dashboard (Recommended):**
```powershell
npm start
```

The bot will start automatically and you can access the dashboard at:
**http://localhost:3000**

**Bot Only (No Dashboard):**
```powershell
npm run bot-only
```

You should see:
```
🌐 Dashboard server running at http://localhost:3000
📱 Open your browser to: http://localhost:3000
✅ Bot is ready! Logged in as YourBot#1234
📊 Monitoring voice channels across X servers
```

## Dashboard Usage

1. Open your browser and go to `http://localhost:3000`
2. You'll see:
   - **Bot Status**: Current status (Running/Stopped)
   - **Statistics**: Uptime, servers, active users, AFK checks sent
   - **Active Voice Users**: Real-time list of users in voice channels with their stats
   - **Recent Activity**: Live log of bot events
3. **Controls**:
   - ▶️ **Start**: Start the bot
   - ⏹️ **Stop**: Stop the bot
   - 🔄 **Restart**: Restart the bot (useful after config changes)

## How It Works

1. **User Joins Voice Channel**: The bot starts tracking their voice time and sets a 30-minute timer
2. **30-Minute Check**: The bot sends a message in a text channel asking the user to confirm they're active
3. **User Response**: 
   - ✅ React with the checkmark emoji, OR
   - 💬 Type `!here` in any channel
4. **Confirmation**: Timer resets and another 30-minute cycle begins
5. **No Response**: After 2 minutes, the user is automatically disconnected from the voice channel

## Commands

- `!here` - Confirm you're active when prompted during an AFK check

## Notes

- The bot tracks total voice time for each user (displayed in console logs)
- Multiple users can be in voice channels simultaneously - each has their own independent timer
- The bot will try to send AFK check messages in a text channel with the same name as the voice channel, or fall back to #general or #chat

## Troubleshooting

**Bot doesn't respond to reactions:**
- Make sure "Message Content Intent" is enabled in the Discord Developer Portal

**Bot can't kick users:**
- Ensure the bot has "Move Members" permission
- Make sure the bot's role is higher than the users it's trying to kick

**Bot doesn't see voice state changes:**
- Enable "Server Members Intent" in the Discord Developer Portal

**Dashboard doesn't connect:**
- Make sure the server is running on port 3000
- Check if another application is using port 3000
- Try accessing `http://127.0.0.1:3000` instead

**Can't access dashboard from another device:**
- The server only listens on localhost by default
- To access from other devices, you'll need to modify `server.js` to bind to `0.0.0.0`

## File Structure

```
discord-bot/
├── bot.js              # Bot logic module
├── server.js           # Web dashboard server
├── index.js            # Standalone bot entry (no dashboard)
├── config.json         # Bot configuration
├── package.json        # Dependencies
├── README.md          # This file
└── public/            # Dashboard files
    ├── index.html     # Dashboard HTML
    ├── style.css      # Dashboard styles
    └── script.js      # Dashboard JavaScript
```

## Support

For issues or questions, check:
- Discord.js Documentation: https://discord.js.org/
- Discord Developer Portal: https://discord.com/developers/applications
