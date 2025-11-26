# Dashboard Setup Complete! 🎉

Your Discord bot now includes a beautiful web dashboard for monitoring and control.

## Quick Start

1. **Install dependencies:**
   ```powershell
   npm install
   ```

2. **Configure your bot token:**
   - Open `config.json`
   - Replace `YOUR_BOT_TOKEN_HERE` with your actual Discord bot token

3. **Start the server:**
   ```powershell
   npm start
   ```

4. **Open the dashboard:**
   - Navigate to: **http://localhost:3000**

## What You Get

### 📊 Real-Time Statistics
- Bot uptime
- Number of servers
- Active users in voice channels
- Total AFK checks sent

### 👥 Live User Monitoring
- See all users currently in voice channels
- View session time and total voice time
- Check AFK status
- See time until next AFK check

### 🎮 Bot Controls
- **Start Button**: Launch the Discord bot
- **Stop Button**: Gracefully shutdown the bot
- **Restart Button**: Restart the bot (useful after config changes)

### 📜 Activity Log
- Real-time updates when users join/leave voice channels
- AFK check notifications
- User kick events
- Bot status changes

## Features

✅ **WebSocket Connection** - Real-time updates without page refresh  
✅ **Responsive Design** - Works on desktop, tablet, and mobile  
✅ **Auto-Reconnect** - Dashboard reconnects if connection is lost  
✅ **Beautiful UI** - Modern gradient design with smooth animations  
✅ **Status Indicators** - Clear visual feedback for bot status  

## Accessing from Other Devices

By default, the dashboard only accessible from the same computer (`localhost`).

To access from other devices on your network:
1. Find your computer's local IP address
2. Access the dashboard at `http://YOUR_IP:3000`

## Port Configuration

The dashboard runs on port **3000** by default. To change it:
1. Open `server.js`
2. Change `const PORT = 3000;` to your desired port
3. Restart the server

## Tips

- Keep the terminal window open to see console logs
- The bot starts automatically when you run `npm start`
- Use the dashboard to monitor multiple users simultaneously
- The activity log keeps the last 50 events

## Need Help?

Check the main `README.md` file for:
- Discord bot setup instructions
- Required permissions
- Troubleshooting guide

Enjoy your new Discord bot dashboard! 🚀
