# ⚡ QUICK START - Gamification System

## 🎯 What You Need to Do

### 1️⃣ Set Up Telegram Bot (5 minutes) - OPTIONAL

**Get Bot Token:**
1. Open Telegram
2. Search for `@BotFather`
3. Send: `/newbot`
4. Follow instructions
5. **Copy the token** (looks like: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

**Get Your Chat ID:**
1. Start chat with your bot (send any message)
2. Open in browser:
   ```
   https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
   ```
   Replace `<YOUR_TOKEN>` with the token from step above
3. Find `"chat":{"id":123456789}` in the response
4. **Copy the number** (your chat ID)

**Update config.json:**
```json
{
  "token": "MTM2NzI3Njk4MzQ2NTAyMTU2MQ.GhLNw6.wJDfleAnk9VNr7c54OOFNAW38bOFkkP9zv5CPU",
  "testMode": false,
  "telegram": {
    "botToken": "PASTE_YOUR_BOT_TOKEN_HERE",
    "chatId": "PASTE_YOUR_CHAT_ID_HERE"
  }
}
```

### 2️⃣ Start the Bot (1 command)

Open PowerShell in the bot folder and run:
```powershell
npm start
```

You should see:
```
🌐 Dashboard server running at http://localhost:3001
✅ Bot is ready! Logged in as YourBot#1234
[Database] Tables initialized successfully
```

✅ **Dashboard**: http://localhost:3001
✅ **Database**: Will be created automatically

### 3️⃣ Start Telegram Backup Bot (Optional)

Open a **second PowerShell** window:
```powershell
cd 'c:\Users\mohamed\Desktop\Getting_Huge_Again\discord bot'
npm run telegram-backup
```

You should see:
```
[Telegram Backup] Bot started
[Telegram Backup] Listening for commands...
```

Now send `/help` to your Telegram bot to test!

### 4️⃣ Test the System (2 minutes)

1. **Join a Discord voice channel**
2. **Wait 1 minute**
3. **Leave the voice channel**
4. **Check PowerShell console** - you should see:
   ```
   🎤 YourName joined voice channel
   👋 YourName left voice channel
   ⏱️  User 123456789 total voice time: 1 minutes
   💎 User earned 1 XP (1 minutes)
   ```

5. **Check if database was created**:
   ```powershell
   ls bot-data.db
   ```
   You should see the file!

6. **Test Telegram** (if you set it up):
   - Send `/stats` to your bot
   - You should get user statistics back!

## 📊 That's It! You're Done!

### What Works Now:

✅ **Voice Time Tracking** - Automatic  
✅ **XP System** - 1 XP per minute  
✅ **Level System** - Auto-calculates from XP  
✅ **Streaks** - Daily activity tracking  
✅ **Achievements** - Auto-unlocks (Night Owl, Marathon, etc.)  
✅ **Leaderboards** - Multiple categories  
✅ **Database** - All data saved locally  
✅ **Telegram Backup** - Download database anytime  
✅ **Dashboard** - Real-time stats at http://localhost:3001  

### Test These Features:

1. **Daily Streak**:
   - Join voice today → Streak = 1
   - Join voice tomorrow → Streak = 2
   - Join voice 7 days → Achievement "Dedicated" unlocked!

2. **XP Multiplier**:
   - Day 7 streak: Get 1.25x XP
   - Day 14 streak: Get 1.5x XP
   - Day 30 streak: Get 2x XP (double rewards!)

3. **Marathon Achievement**:
   - Stay in voice for 6+ hours → Unlocked!

4. **Night Owl Achievement**:
   - Join voice between 12 AM - 6 AM → Unlocked!

5. **Level Up**:
   - Stay 100 minutes → Level 2
   - Stay 400 minutes total → Level 3

## 📱 Telegram Commands

```
/backup      → Download database file
/stats       → See user statistics
/schedule    → Enable daily auto-backups
/help        → Show all commands
```

## 🔍 Check Your Data

### View Leaderboards (in browser):
```
http://localhost:3001/api/gamification/leaderboards
```

### View Your Profile (replace USER_ID):
```
http://localhost:3001/api/gamification/profile/YOUR_DISCORD_ID
```

### View All Achievements:
```
http://localhost:3001/api/gamification/achievements
```

## 🎮 XP & Levels Quick Reference

| Time in Voice | XP Earned | Level Reached |
|---------------|-----------|---------------|
| 1 hour        | 60 XP     | Level 1       |
| 2 hours       | 120 XP    | Level 2       |
| 7 hours       | 420 XP    | Level 3       |
| 15 hours      | 900 XP    | Level 4       |
| 27 hours      | 1,620 XP  | Level 5       |
| 81 hours      | 8,100 XP  | Level 10      |

**With 2x streak bonus (30+ days)**: Everything doubles! 🔥

## 🏅 All Achievements

1. 🦉 **Night Owl** - Active 12 AM - 6 AM
2. 🏃 **Marathon** - 6+ hours continuous
3. 💪 **Dedicated** - 7-day streak
4. 🎖️ **Veteran** - Level 10
5. 👑 **Master** - Level 25
6. ⭐ **Legend** - Level 50
7. 💯 **Century** - Level 100

## 🎁 Role Rewards

Create these roles in Discord (Server Settings → Roles):
- **Bronze Member** - Unlocks at Level 5
- **Silver Member** - Unlocks at Level 10
- **Gold Member** - Unlocks at Level 25
- **Platinum Member** - Unlocks at Level 50
- **Diamond Legend** - Unlocks at Level 100

Bot will auto-assign them when users reach these levels!

## ⚠️ Common Issues

**"Database not creating"**
- Join and leave a voice channel first
- Check console for errors

**"Telegram bot not responding"**
- Make sure you're using the correct chat ID
- Verify bot token is correct
- Check if telegram-backup.js is running

**"XP not tracking"**
- Make sure you actually leave the voice channel
- Check console logs for errors
- XP only awarded when you LEAVE voice

## 📁 What Files Do What

- **bot.js** - Main Discord bot (tracks voice, kicks AFK users)
- **server.js** - Web dashboard (http://localhost:3001)
- **database.js** - Database operations (SQLite)
- **gamification.js** - XP, levels, achievements logic
- **telegram-backup.js** - Telegram bot for backups
- **config.json** - Your settings (tokens, chat IDs)
- **bot-data.db** - Database file (created automatically)

## 🚀 You're All Set!

Just run `npm start` and join a voice channel!

---

**For full details, see:**
- GAMIFICATION_GUIDE.md (complete guide)
- GAMIFICATION_SETUP.md (detailed setup)
- IMPLEMENTATION_COMPLETE.md (what was added)

**Need help?** Check console logs for error messages.

**Have fun and enjoy the gamification! 🎮🏆**
