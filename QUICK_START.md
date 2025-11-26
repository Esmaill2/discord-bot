# 🚀 Quick Start Guide

## Step 1: Install Dependencies
Open PowerShell in the bot directory and run:
```powershell
npm install
```

This will install:
- discord.js (Discord bot framework)
- express (Web server)
- socket.io (Real-time communication)

## Step 2: Get Your Discord Bot Token

1. Go to https://discord.com/developers/applications
2. Click "New Application" → Give it a name
3. Go to "Bot" section → Click "Add Bot"
4. **Enable these Privileged Gateway Intents:**
   - ✅ Presence Intent
   - ✅ Server Members Intent
   - ✅ Message Content Intent
5. Click "Reset Token" → Copy the token

## Step 3: Configure the Bot

1. Open `config.json` in a text editor
2. Replace the token:
```json
{
  "token": "paste_your_actual_token_here"
}
```
3. Save the file

## Step 4: Invite Bot to Your Server

1. Go back to Discord Developer Portal
2. Go to "OAuth2" → "URL Generator"
3. Select scopes:
   - ✅ bot
4. Select bot permissions:
   - ✅ Read Messages/View Channels
   - ✅ Send Messages
   - ✅ Add Reactions
   - ✅ Move Members
   - ✅ Connect
5. Copy the generated URL
6. Open it in your browser
7. Select your server and authorize

## Step 5: Start the Bot + Dashboard

```powershell
npm start
```

You should see:
```
🌐 Dashboard server running at http://localhost:3000
📱 Open your browser to: http://localhost:3000
✅ Bot started automatically
✅ Bot is ready! Logged in as YourBot#1234
```

## Step 6: Open the Dashboard

Open your web browser and go to:
```
http://localhost:3000
```

You'll see:
- Real-time bot status
- Statistics dashboard
- Active voice users
- Control buttons (Start/Stop/Restart)
- Live activity log

## Testing the Bot

1. Join a voice channel in your Discord server
2. Watch the dashboard - you should see yourself appear in "Active Voice Users"
3. Wait 30 minutes OR modify `AFK_CHECK_INTERVAL` in `bot.js` for faster testing:
   ```javascript
   const AFK_CHECK_INTERVAL = 1 * 60 * 1000; // 1 minute for testing
   ```
4. The bot will send an AFK check message
5. React with ✅ or type `!here` to confirm
6. If you don't respond within 2 minutes, you'll be kicked from voice

## Customization

### Change AFK Check Interval
In `bot.js`, modify:
```javascript
const AFK_CHECK_INTERVAL = 30 * 60 * 1000; // Change 30 to desired minutes
```

### Change Confirmation Timeout
In `bot.js`, modify:
```javascript
const CONFIRMATION_TIMEOUT = 2 * 60 * 1000; // Change 2 to desired minutes
```

### Change Dashboard Port
In `server.js`, modify:
```javascript
const PORT = 3000; // Change to desired port
```

## Troubleshooting

**"Error: An invalid token was provided"**
- Check that you copied the full token from Discord Developer Portal
- Make sure there are no extra spaces in config.json

**Bot doesn't see voice changes**
- Enable "Server Members Intent" in Developer Portal
- Make sure bot has "Connect" permission

**Bot can't kick users**
- Ensure bot has "Move Members" permission
- Bot's role must be higher than users it tries to kick

**Dashboard won't load**
- Check if port 3000 is already in use
- Try `http://127.0.0.1:3000` instead

**npm install fails**
- Make sure you have Node.js installed (version 16.9.0 or higher)
- Try running PowerShell as Administrator

## Running Options

**With Dashboard (Recommended):**
```powershell
npm start
```

**Bot Only (No Dashboard):**
```powershell
npm run bot-only
```

## Next Steps

- Customize the bot messages in `bot.js`
- Modify the dashboard styling in `public/style.css`
- Add more statistics or features
- Deploy to a server for 24/7 operation

Happy bot building! 🎉
