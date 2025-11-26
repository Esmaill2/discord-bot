# Discord Voice Time Tracker Bot 🎤

A comprehensive Discord bot that tracks voice channel activity with AFK checks, gamification features, and a real-time web dashboard.

## 🌟 Features

### Core Functionality
- ⏰ **Automatic AFK Checks**: Sends periodic checks to confirm users are active
- ✅ **User Confirmation**: React with ✅ or type `!here` to confirm presence
- 🚪 **Auto-Kick**: Removes non-responsive users from voice channels
- 📊 **Time Tracking**: Records voice channel time for all users
- 🌐 **Web Dashboard**: Real-time monitoring and control interface

### 🎮 Gamification System (NEW!)
- 💎 **XP & Levels**: Earn 1 XP per minute in voice channels
- 🔥 **Daily Streaks**: Maintain activity for XP multipliers (up to 2x)
- 🏅 **Achievements**: Unlock badges for milestones (Night Owl, Marathon, etc.)
- 🎁 **Role Rewards**: Auto-assign Discord roles at level milestones
- 🏆 **Leaderboards**: Compete in multiple categories (time, level, streak)
- 📈 **Weekly/Monthly Stats**: Track performance over time

### 💾 Data Management
- 🗄️ **SQLite Database**: Local storage for persistent data
- 📱 **Telegram Backup**: Automated database backups via Telegram bot
- 📊 **Statistics API**: RESTful endpoints for data access

### ⚙️ Management
- 🎛️ **Configurable Timings**: Adjust AFK intervals via dashboard
- 🔄 **Bot Controls**: Start/Stop/Restart from web interface
- 📝 **Activity Logs**: Real-time event tracking
- 🧪 **Test Mode**: Reduced timers for development

## 📦 Quick Start

### Prerequisites
- Node.js 16+
- Discord bot token
- (Optional) Telegram account for backups

### Installation

```bash
# Install dependencies
npm install

# Configure bot token in config.json
{
  "token": "YOUR_DISCORD_BOT_TOKEN",
  "testMode": false
}

# Start with dashboard
npm start
```

Dashboard opens at: http://localhost:3001

### 🚀 Quick Setup for Gamification

See [GAMIFICATION_SETUP.md](GAMIFICATION_SETUP.md) for detailed setup instructions.

**Quick Steps:**
1. Install dependencies ✓ (already done)
2. Configure Telegram bot (optional)
3. Start the bot
4. Verify database creation
5. Test XP tracking

## 📚 Documentation

- **[GAMIFICATION_GUIDE.md](GAMIFICATION_GUIDE.md)** - Complete gamification system guide
- **[GAMIFICATION_SETUP.md](GAMIFICATION_SETUP.md)** - Quick setup instructions
- **[DASHBOARD.md](DASHBOARD.md)** - Dashboard features and usage
- **[DOCKER_GUIDE.md](DOCKER_GUIDE.md)** - Docker deployment guide
- **[PERFORMANCE_GUIDE.md](PERFORMANCE_GUIDE.md)** - Optimization for 100+ users

## 🎮 Gamification Features

### XP System
```
1 minute in voice = 1 XP (base)
With streak multipliers:
- 7+ days: 1.25x XP
- 14+ days: 1.5x XP  
- 30+ days: 2.0x XP
```

### Level Formula
```
Level = floor(sqrt(XP / 100)) + 1

Level 1: 0 XP
Level 2: 100 XP
Level 5: 1,600 XP
Level 10: 8,100 XP
Level 25: 57,600 XP
Level 50: 240,100 XP
Level 100: 980,100 XP
```

### Achievements
- 🦉 **Night Owl** - Active 12 AM - 6 AM
- 🏃 **Marathon** - 6+ hours continuous
- 💪 **Dedicated** - 7-day streak
- 🎖️ **Veteran** - Reach level 10
- 👑 **Master** - Reach level 25
- ⭐ **Legend** - Reach level 50
- 💯 **Century** - Reach level 100

### Role Rewards
- Level 5: Bronze Member
- Level 10: Silver Member
- Level 25: Gold Member
- Level 50: Platinum Member
- Level 100: Diamond Legend

## 🔧 Configuration

### config.json
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

### settings.json (auto-generated)
```json
{
  "afkInterval": 30,
  "confirmTimeout": 2
}
```

## 🌐 API Endpoints

### Bot Control
- `GET /api/status` - Get bot status and statistics
- `GET /api/users` - Get active voice users
- `GET /api/settings` - Get current settings
- `POST /api/settings` - Update settings
- `POST /api/bot/start` - Start the bot
- `POST /api/bot/stop` - Stop the bot
- `POST /api/bot/restart` - Restart the bot

### Gamification
- `GET /api/gamification/profile/:userId` - Get user profile
- `GET /api/gamification/leaderboards` - Get all leaderboards
- `GET /api/gamification/achievements` - Get achievement list
- `GET /api/gamification/role-rewards` - Get role reward levels

## 📱 Telegram Backup Bot

### Setup
1. Create bot with [@BotFather](https://t.me/BotFather)
2. Get your chat ID from bot updates
3. Add credentials to config.json
4. Run: `npm run telegram-backup`

### Commands
- `/backup` - Download database file
- `/stats` - View database statistics
- `/schedule` - Toggle daily auto-backups
- `/help` - Show available commands

## 🐳 Docker Deployment

```bash
# Build image
docker build -t discord-bot .

# Run container
docker-compose up -d
```

See [DOCKER_GUIDE.md](DOCKER_GUIDE.md) for details.

## 📊 Performance

Optimized for **100+ concurrent users**:
- Message queue system (500ms delays)
- Dashboard throttling (2-second updates)
- Maximum capacity: 500 users
- Database indexing for fast queries

See [PERFORMANCE_GUIDE.md](PERFORMANCE_GUIDE.md) for tuning tips.

## 🧪 Test Mode

Enable in config.json for rapid testing:
```json
{
  "testMode": true
}
```

Reduces timers to:
- AFK check: 1 minute
- Confirmation timeout: 30 seconds

## 🛠️ Available Scripts

```bash
npm start              # Start with dashboard (port 3001)
npm run bot            # Start bot only (no dashboard)
npm run telegram-backup # Start Telegram backup bot
```

## 📂 Database Schema

### users
- user_id, username, total_time
- xp, level, current_streak
- last_active, created_at, updated_at

### achievements
- id, user_id, achievement_type, unlocked_at

### sessions
- id, user_id, join_time, leave_time
- duration, xp_earned, created_at

### leaderboard_snapshots
- id, period_type, period_start, period_end
- rankings, created_at

## 🔒 Security

- Dashboard runs on localhost (port 3001)
- Telegram commands restricted to configured chat ID
- No sensitive data in public endpoints
- Discord token stored in config.json (gitignored)

## 🐛 Troubleshooting

### Database not creating
```bash
npm install better-sqlite3 --build-from-source
```

### Telegram bot not responding
- Verify bot token and chat ID
- Ensure telegram-backup.js is running
- Check console for errors

### XP not tracking
- Check console for gamification errors
- Verify database permissions
- Ensure users join/leave voice properly

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Test thoroughly
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Discord.js - Discord API wrapper
- Better-SQLite3 - Fast SQLite database
- Socket.IO - Real-time communication
- Express.js - Web framework
- node-telegram-bot-api - Telegram integration

## 📈 Roadmap

- [ ] Custom achievements per server
- [ ] Reward shop with virtual currency
- [ ] Voice activity analytics dashboard
- [ ] Profile cards with statistics
- [ ] Seasonal competitions
- [ ] Achievement notifications in Discord
- [ ] Multi-language support
- [ ] Advanced role management

## 📞 Support

For issues and questions:
1. Check documentation files
2. Review console logs
3. Verify configuration
4. Test with small user count first

---

**Built with ❤️ for Discord communities**

🎮 **Start gaming and climb the leaderboards!** 🏆
