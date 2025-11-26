# 🚀 Quick Setup: Gamification System

## Prerequisites
- Node.js 16+ installed
- Discord bot token
- Telegram account (optional, for backups)

## Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `better-sqlite3` - Local database
- `node-telegram-bot-api` - Telegram backup bot
- All existing dependencies

## Step 2: Configure Telegram (Optional)

### Create Telegram Bot:
1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot`
3. Choose a name and username
4. Copy the bot token

### Get Your Chat ID:
1. Start a chat with your new bot
2. Send any message (e.g., "hello")
3. Open this URL in browser (replace `<TOKEN>`):
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
4. Find the `chat` object and copy the `id` value

### Update config.json:
```json
{
  "token": "YOUR_DISCORD_BOT_TOKEN",
  "testMode": false,
  "telegram": {
    "botToken": "YOUR_TELEGRAM_BOT_TOKEN",
    "chatId": "YOUR_CHAT_ID"
  }
}
```

## Step 3: Start the Bot

### Option A: Start with Dashboard (Recommended)
```bash
npm start
```
- Opens dashboard at http://localhost:3001
- Bot starts automatically
- Gamification system enabled

### Option B: Bot Only
```bash
npm run bot
```
- No dashboard
- Console output only

### Option C: Telegram Backup Bot
```bash
npm run telegram-backup
```
- Runs in separate terminal
- Allows backup commands via Telegram

## Step 4: Verify Setup

### Check Database:
After first user joins voice channel, verify:
```bash
# Windows PowerShell
ls bot-data.db
```

File should exist in bot directory.

### Test XP System:
1. Join a voice channel
2. Stay for 1-2 minutes
3. Leave the channel
4. Check console logs for XP messages:
   ```
   💎 User earned X XP (Y minutes)
   ```

### Test Telegram Backup:
1. Start telegram-backup script
2. Send `/help` to your Telegram bot
3. Send `/backup` to download database
4. Send `/stats` to see user statistics

## Step 5: Create Discord Roles (Optional)

For automatic role rewards, create these roles in your Discord server:
- Bronze Member
- Silver Member
- Gold Member
- Platinum Member
- Diamond Legend

The bot will auto-assign these based on user levels.

## Available Scripts

```json
{
  "start": "node server.js",           // Dashboard + Bot
  "bot": "node index.js",              // Bot only
  "telegram-backup": "node telegram-backup.js"  // Telegram bot
}
```

## Telegram Commands

Once telegram-backup is running:

- `/backup` - Download database file
- `/stats` - View database statistics
- `/schedule` - Enable/disable daily backups
- `/help` - Show available commands

## Verification Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] config.json updated with tokens
- [ ] Bot starts without errors
- [ ] Database file created (`bot-data.db`)
- [ ] XP tracking works (check console)
- [ ] Telegram bot responds (if configured)
- [ ] Dashboard accessible (http://localhost:3001)

## Troubleshooting

### Database not creating
```bash
# Check permissions
npm list better-sqlite3

# Reinstall if needed
npm install better-sqlite3 --build-from-source
```

### Telegram bot not responding
- Verify bot token is correct
- Check chat ID matches your Telegram user
- Ensure telegram-backup.js is running
- Look for errors in console

### XP not tracking
- Check console for errors
- Verify user joined/left voice channel
- Ensure bot has proper Discord permissions

## Next Steps

1. **Configure Settings**: Adjust AFK timers in dashboard
2. **Monitor Performance**: Check console for activity logs
3. **Backup Database**: Test `/backup` command
4. **Review Leaderboards**: Check `/api/gamification/leaderboards`
5. **Read Full Guide**: See GAMIFICATION_GUIDE.md for details

## Quick Test

```bash
# Terminal 1: Start main bot
npm start

# Terminal 2: Start Telegram bot (optional)
npm run telegram-backup

# In Discord: Join a voice channel and wait 1 minute
# In Console: Look for XP messages
# In Telegram: Send /stats
```

## Support

- **Full Documentation**: See GAMIFICATION_GUIDE.md
- **Dashboard Guide**: See DASHBOARD.md
- **Docker Deployment**: See DOCKER_GUIDE.md
- **Performance Tips**: See PERFORMANCE_GUIDE.md

---

**Setup complete! Start gaming! 🎮**
