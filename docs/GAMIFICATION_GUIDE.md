# 🎮 Gamification System Guide

## Overview

The Discord bot now includes a complete gamification system that rewards users for their voice channel activity with XP, levels, achievements, and competitive leaderboards.

## Features

### 💎 XP & Levels
- **Earn XP**: 1 XP per minute in voice channels
- **Level Up**: Progress through levels with increasing XP requirements
- **Level Formula**: Level = floor(sqrt(XP / 100)) + 1
  - Level 1: 0 XP
  - Level 2: 100 XP
  - Level 3: 400 XP
  - Level 4: 900 XP
  - Level 5: 1,600 XP
  - And so on...

### 🔥 Streak System
- **Daily Activity**: Join voice channels daily to maintain your streak
- **Streak Multipliers**:
  - 7+ days: 1.25x XP
  - 14+ days: 1.5x XP
  - 30+ days: 2.0x XP
- **Reset**: Missing a day resets your streak to 1

### 🏅 Achievements

#### Available Achievements:
1. **Night Owl** 🦉
   - Active between 12 AM - 6 AM
   - Unlocked on first activity during night hours

2. **Marathon** 🏃
   - Stay in voice for 6+ hours continuously
   - Unlocked when session exceeds 6 hours

3. **Dedicated** 💪
   - Maintain a 7-day streak
   - Unlocked when streak reaches 7 days

4. **Veteran** 🎖️
   - Reach level 10
   - Unlocked at level 10

5. **Master** 👑
   - Reach level 25
   - Unlocked at level 25

6. **Legend** ⭐
   - Reach level 50
   - Unlocked at level 50

7. **Century** 💯
   - Reach level 100
   - Unlocked at level 100

### 🎁 Role Rewards

Automatic Discord role assignment based on levels:
- **Level 5**: Bronze Member
- **Level 10**: Silver Member
- **Level 25**: Gold Member
- **Level 50**: Platinum Member
- **Level 100**: Diamond Legend

> **Note**: Server admins need to create these roles in Discord for automatic assignment to work.

### 🏆 Leaderboards

Multiple leaderboard categories:

1. **Top by Total Time**
   - Ranks users by all-time voice channel time
   - Shows top 10 users

2. **Top by Level**
   - Ranks users by current level and XP
   - Shows top 10 users

3. **Top by Streak**
   - Ranks users by current active streak
   - Shows top 10 users

4. **Weekly Stats**
   - Time and XP earned in the last 7 days
   - Resets automatically

5. **Monthly Stats**
   - Time and XP earned in the last 30 days
   - Resets automatically

## Database

The gamification system uses **SQLite** (better-sqlite3) with the following structure:

### Tables:

#### users
- `user_id` (PRIMARY KEY): Discord user ID
- `username`: Discord username
- `total_time`: Total minutes in voice channels
- `xp`: Total experience points
- `level`: Current level
- `current_streak`: Current daily streak
- `last_active`: Last activity timestamp
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

#### achievements
- `id` (AUTO INCREMENT): Achievement ID
- `user_id`: Discord user ID
- `achievement_type`: Achievement identifier
- `unlocked_at`: Unlock timestamp

#### sessions
- `id` (AUTO INCREMENT): Session ID
- `user_id`: Discord user ID
- `join_time`: When user joined voice
- `leave_time`: When user left voice
- `duration`: Session length in minutes
- `xp_earned`: XP earned in this session
- `created_at`: Session creation timestamp

#### leaderboard_snapshots
- `id` (AUTO INCREMENT): Snapshot ID
- `period_type`: 'weekly' or 'monthly'
- `period_start`: Period start date
- `period_end`: Period end date
- `rankings`: JSON data of rankings
- `created_at`: Snapshot creation timestamp

### Database Location
- File: `bot-data.db`
- Location: Root directory of the bot
- Backup: Use Telegram bot for automated backups

## API Endpoints

### Get User Profile
```
GET /api/gamification/profile/:userId
```
Returns user stats, level, XP, achievements, and streak.

**Response:**
```json
{
  "success": true,
  "profile": {
    "userId": "123456789",
    "username": "User#1234",
    "level": 5,
    "xp": 1600,
    "xpForNextLevel": 3600,
    "xpProgress": 1600,
    "totalTime": 960,
    "currentStreak": 7,
    "achievements": [
      {
        "type": "DEDICATED",
        "unlockedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Leaderboards
```
GET /api/gamification/leaderboards
```
Returns all leaderboard categories.

**Response:**
```json
{
  "success": true,
  "leaderboards": {
    "topByTime": [...],
    "topByLevel": [...],
    "topByStreak": [...],
    "weeklyStats": [...],
    "monthlyStats": [...]
  }
}
```

### Get Achievements List
```
GET /api/gamification/achievements
```
Returns all available achievements.

### Get Role Rewards
```
GET /api/gamification/role-rewards
```
Returns level-based role rewards.

## Telegram Backup System

### Setup

1. **Create Telegram Bot**:
   - Message [@BotFather](https://t.me/BotFather) on Telegram
   - Send `/newbot` and follow instructions
   - Copy the bot token

2. **Get Chat ID**:
   - Start a chat with your bot
   - Send any message
   - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Find your `chat_id` in the response

3. **Configure Bot**:
   - Open `config.json`
   - Add your credentials:
   ```json
   {
     "telegram": {
       "botToken": "YOUR_TELEGRAM_BOT_TOKEN",
       "chatId": "YOUR_CHAT_ID"
     }
   }
   ```

### Running Telegram Bot

```bash
npm run telegram-backup
```

### Available Commands

#### `/backup`
Downloads the current database file.

**Example:**
```
/backup
```
Response: Sends `bot-data.db` file with size information.

#### `/stats`
Shows database statistics without downloading.

**Example:**
```
/stats
```
Response:
```
📊 Database Statistics

👥 Total Users: 45
💾 File Size: 1.2 MB

🏆 Top 5 Users by Level:
1. User#1234 - Level 15 (120h)
2. User#5678 - Level 12 (95h)
...
```

#### `/schedule`
Toggles automatic daily backups.

**Example:**
```
/schedule
```
- First use: Enables daily backups at the same time
- Second use: Disables automatic backups

#### `/help` or `/start`
Shows available commands.

### Security
- Only the configured `chatId` can use bot commands
- Unauthorized users receive "Unauthorized access" message
- Keep your bot token and chat ID private

## Usage Examples

### User Journey Example

1. **Day 1**: User joins voice channel
   - XP earned: 60 XP (1 hour)
   - Level: 1
   - Streak: 1 day

2. **Day 7**: User maintains streak
   - Streak: 7 days
   - Multiplier: 1.25x XP
   - Achievement unlocked: "Dedicated"

3. **Day 30**: Long-term activity
   - Streak: 30 days
   - Multiplier: 2.0x XP (double rewards!)
   - Total time: ~100 hours
   - Level: ~10
   - Achievement unlocked: "Veteran"
   - Role reward: "Silver Member"

4. **Marathon Session**: 6-hour session
   - XP earned: 720 XP (with 2x multiplier)
   - Achievement unlocked: "Marathon"

5. **Night Activity**: Active at 2 AM
   - Achievement unlocked: "Night Owl"

## Dashboard Integration

The gamification data will be displayed in the web dashboard at `http://localhost:3001`:

- **User Cards**: Show level badges and current streak
- **Leaderboards Tab**: Display top users by various metrics
- **Profile View**: Individual user stats with achievement showcase
- **Progress Bars**: Visual XP progress to next level

## Performance Considerations

- **Database Size**: SQLite file grows with user activity
- **Backup Frequency**: Daily backups recommended for safety
- **Query Optimization**: Indexes on user_id for fast lookups
- **Session Tracking**: Minimal overhead during voice activity

## Troubleshooting

### Database Not Creating
- Ensure write permissions in bot directory
- Check for error logs in console
- Verify better-sqlite3 installation: `npm list better-sqlite3`

### XP Not Tracking
- Check if user is in voice channel tracking map
- Verify database connection
- Look for errors in `handleUserLeave` function

### Telegram Bot Not Responding
- Verify bot token in config.json
- Check if chat ID is correct
- Ensure telegram-backup.js is running
- Review Telegram bot logs for errors

### Achievements Not Unlocking
- Check achievement conditions in gamification.js
- Verify user data in database
- Review achievement check logic

## Future Enhancements

Potential features for future updates:
- Custom achievements per server
- Configurable XP rates
- Seasonal competitions
- Reward shop with virtual currency
- Voice activity analytics
- Achievement notifications in Discord
- Profile cards with statistics
- Custom level-up messages
- Integration with other bot features

## Backup Best Practices

1. **Regular Backups**: Use `/schedule` for daily automation
2. **Manual Backups**: Run `/backup` before major updates
3. **Store Safely**: Keep database backups in multiple locations
4. **Test Restores**: Periodically test backup restoration
5. **Monitor Size**: Watch database file size growth

## Support

For issues or questions:
1. Check console logs for errors
2. Review this documentation
3. Verify all dependencies are installed
4. Ensure config.json is properly configured
5. Test with a small number of users first

---

**Enjoy the gamification system! May the highest level win!** 🎮🏆
