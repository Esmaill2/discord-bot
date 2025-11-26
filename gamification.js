const GameDatabase = require('./database');

class GamificationSystem {
  constructor() {
    this.db = new GameDatabase();
    this.activeSessionsMap = new Map(); // userId -> sessionId
  }

  // Achievement definitions
  getAchievements() {
    return {
      NIGHT_OWL: {
        name: 'Night Owl',
        description: 'Active between 12 AM - 6 AM',
        check: (user, context) => {
          const hour = new Date().getHours();
          return hour >= 0 && hour < 6;
        }
      },
      MARATHON: {
        name: 'Marathon',
        description: 'Stay in voice for 6+ hours continuously',
        check: (user, context) => {
          return context.sessionDuration >= 6 * 60 * 60 * 1000; // 6 hours in ms
        }
      },
      DEDICATED: {
        name: 'Dedicated',
        description: 'Maintain a 7-day streak',
        check: (user, context) => {
          return user.current_streak >= 7;
        }
      },
      VETERAN: {
        name: 'Veteran',
        description: 'Reach level 10',
        check: (user, context) => {
          return user.level >= 10;
        }
      },
      MASTER: {
        name: 'Master',
        description: 'Reach level 25',
        check: (user, context) => {
          return user.level >= 25;
        }
      },
      LEGEND: {
        name: 'Legend',
        description: 'Reach level 50',
        check: (user, context) => {
          return user.level >= 50;
        }
      },
      CENTURY: {
        name: 'Century',
        description: 'Reach level 100',
        check: (user, context) => {
          return user.level >= 100;
        }
      }
    };
  }

  // Handle user joining voice
  handleUserJoin(userId, username) {
    // Create or get user
    let user = this.db.getUser(userId);
    if (!user) {
      user = this.db.createUser(userId, username);
    }

    // Update streak
    const newStreak = this.db.updateStreak(userId);

    // Start session
    const sessionId = this.db.startSession(userId, username);
    this.activeSessionsMap.set(userId, {
      sessionId,
      joinTime: Date.now()
    });

    return { user, newStreak };
  }

  // Handle user leaving voice
  handleUserLeave(userId) {
    const sessionData = this.activeSessionsMap.get(userId);
    if (!sessionData) return null;

    const { sessionId, joinTime } = sessionData;
    const duration = Date.now() - joinTime; // in milliseconds
    const durationMinutes = Math.floor(duration / (1000 * 60));

    // Calculate XP (1 XP per minute)
    const baseXP = durationMinutes;
    
    // Get user for streak multiplier
    const user = this.db.getUser(userId);
    const streakMultiplier = this.getStreakMultiplier(user.current_streak);
    const totalXP = Math.floor(baseXP * streakMultiplier);

    // Update total time
    const newTotalTime = user.total_time + durationMinutes;
    this.db.updateUser(userId, { total_time: newTotalTime });

    // Add XP and check for level up
    const xpResult = this.db.addXP(userId, totalXP);

    // End session
    this.db.endSession(sessionId, durationMinutes, totalXP);

    // Check achievements
    const unlockedAchievements = this.checkAchievements(userId, {
      sessionDuration: duration,
      totalTime: newTotalTime
    });

    // Clean up
    this.activeSessionsMap.delete(userId);

    return {
      duration: durationMinutes,
      xpEarned: totalXP,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.newLevel,
      unlockedAchievements,
      streakMultiplier
    };
  }

  // Calculate streak multiplier
  getStreakMultiplier(streak) {
    if (streak >= 30) return 2.0;  // 30+ days: 2x XP
    if (streak >= 14) return 1.5;  // 14+ days: 1.5x XP
    if (streak >= 7) return 1.25;  // 7+ days: 1.25x XP
    return 1.0;
  }

  // Check and unlock achievements
  checkAchievements(userId, context) {
    const user = this.db.getUser(userId);
    const achievements = this.getAchievements();
    const unlocked = [];

    for (const [key, achievement] of Object.entries(achievements)) {
      // Skip if already unlocked
      if (this.db.hasAchievement(userId, key)) continue;

      // Check if conditions are met
      if (achievement.check(user, context)) {
        const wasUnlocked = this.db.unlockAchievement(userId, key);
        if (wasUnlocked) {
          unlocked.push({
            type: key,
            name: achievement.name,
            description: achievement.description
          });
        }
      }
    }

    return unlocked;
  }

  // Get user profile with stats
  getUserProfile(userId) {
    const user = this.db.getUser(userId);
    if (!user) return null;

    const achievements = this.db.getUserAchievements(userId);
    const currentXP = user.xp;
    const currentLevel = user.level;
    const xpForNextLevel = this.db.getXPForNextLevel(currentLevel);
    const xpProgress = currentXP - (currentLevel - 1) * (currentLevel - 1) * 100;

    return {
      userId: user.user_id,
      username: user.username,
      level: currentLevel,
      xp: currentXP,
      xpForNextLevel,
      xpProgress,
      totalTime: user.total_time,
      currentStreak: user.current_streak,
      achievements: achievements.map(a => ({
        type: a.achievement_type,
        unlockedAt: a.unlocked_at
      })),
      createdAt: user.created_at
    };
  }

  // Get leaderboards
  getLeaderboards() {
    return {
      topByTime: this.db.getTopByTime(10),
      topByLevel: this.db.getTopByLevel(10),
      topByStreak: this.db.getTopByStreak(10),
      weeklyStats: this.db.getWeeklyStats(),
      monthlyStats: this.db.getMonthlyStats()
    };
  }

  // Get role rewards based on level
  getRoleRewards() {
    return {
      5: 'Bronze Member',
      10: 'Silver Member',
      25: 'Gold Member',
      50: 'Platinum Member',
      100: 'Diamond Legend'
    };
  }

  // Check if user should get a new role
  checkRoleReward(level) {
    const rewards = this.getRoleRewards();
    return rewards[level] || null;
  }

  // Close database connection
  close() {
    this.db.close();
  }
}

module.exports = GamificationSystem;
