const Database = require('better-sqlite3');
const path = require('path');

class GameDatabase {
  constructor(dbPath = path.join(__dirname, 'bot-data.db')) {
    this.db = new Database(dbPath);
    this.initializeTables();
  }

  initializeTables() {
    // Users table - stores XP, level, and time data
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        total_time INTEGER DEFAULT 0,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        current_streak INTEGER DEFAULT 0,
        last_active TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Achievements table - tracks unlocked achievements
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        achievement_type TEXT NOT NULL,
        unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, achievement_type),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `);

    // Sessions table - historical voice session data
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        join_time TEXT NOT NULL,
        leave_time TEXT,
        duration INTEGER DEFAULT 0,
        xp_earned INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `);

    // Leaderboard snapshots - weekly/monthly rankings
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        period_type TEXT NOT NULL,
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        rankings TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('[Database] Tables initialized successfully');
  }

  // User operations
  getUser(userId) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE user_id = ?');
    return stmt.get(userId);
  }

  createUser(userId, username) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO users (user_id, username, last_active)
      VALUES (?, ?, datetime('now'))
    `);
    stmt.run(userId, username);
    return this.getUser(userId);
  }

  updateUser(userId, data) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    const stmt = this.db.prepare(`
      UPDATE users SET ${fields}, updated_at = datetime('now')
      WHERE user_id = ?
    `);
    stmt.run(...values, userId);
  }

  // XP and Level operations
  addXP(userId, xpAmount) {
    const user = this.getUser(userId);
    if (!user) return null;

    const newXP = user.xp + xpAmount;
    const newLevel = this.calculateLevel(newXP);
    const leveledUp = newLevel > user.level;

    this.updateUser(userId, { xp: newXP, level: newLevel });

    return { leveledUp, newLevel, newXP };
  }

  calculateLevel(xp) {
    // Level formula: Level = floor(sqrt(xp / 100))
    // Level 1: 0 XP, Level 2: 100 XP, Level 3: 400 XP, Level 4: 900 XP, etc.
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  getXPForNextLevel(currentLevel) {
    // XP needed for next level
    return currentLevel * currentLevel * 100;
  }

  // Session operations
  startSession(userId, username) {
    this.createUser(userId, username);
    const stmt = this.db.prepare(`
      INSERT INTO sessions (user_id, join_time)
      VALUES (?, datetime('now'))
    `);
    const result = stmt.run(userId);
    return result.lastInsertRowid;
  }

  endSession(sessionId, duration, xpEarned) {
    const stmt = this.db.prepare(`
      UPDATE sessions
      SET leave_time = datetime('now'), duration = ?, xp_earned = ?
      WHERE id = ?
    `);
    stmt.run(duration, xpEarned, sessionId);
  }

  // Achievement operations
  unlockAchievement(userId, achievementType) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO achievements (user_id, achievement_type)
      VALUES (?, ?)
    `);
    const result = stmt.run(userId, achievementType);
    return result.changes > 0; // Returns true if new achievement unlocked
  }

  getUserAchievements(userId) {
    const stmt = this.db.prepare(`
      SELECT achievement_type, unlocked_at
      FROM achievements
      WHERE user_id = ?
      ORDER BY unlocked_at DESC
    `);
    return stmt.all(userId);
  }

  hasAchievement(userId, achievementType) {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM achievements
      WHERE user_id = ? AND achievement_type = ?
    `);
    const result = stmt.get(userId, achievementType);
    return result.count > 0;
  }

  // Streak operations
  updateStreak(userId) {
    const user = this.getUser(userId);
    if (!user) return 0;

    const lastActive = user.last_active ? new Date(user.last_active) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newStreak = 1;

    if (lastActive) {
      const lastActiveDate = new Date(lastActive);
      lastActiveDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - lastActiveDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === 0) {
        // Same day, keep current streak
        newStreak = user.current_streak;
      } else if (daysDiff === 1) {
        // Next day, increment streak
        newStreak = user.current_streak + 1;
      }
      // If daysDiff > 1, streak resets to 1
    }

    this.updateUser(userId, {
      current_streak: newStreak,
      last_active: new Date().toISOString()
    });

    return newStreak;
  }

  // Leaderboard operations
  getTopByTime(limit = 10) {
    const stmt = this.db.prepare(`
      SELECT user_id, username, total_time, xp, level
      FROM users
      ORDER BY total_time DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  getTopByLevel(limit = 10) {
    const stmt = this.db.prepare(`
      SELECT user_id, username, total_time, xp, level
      FROM users
      ORDER BY level DESC, xp DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  getTopByStreak(limit = 10) {
    const stmt = this.db.prepare(`
      SELECT user_id, username, current_streak, total_time, level
      FROM users
      ORDER BY current_streak DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  // Weekly/Monthly stats
  getWeeklyStats() {
    const stmt = this.db.prepare(`
      SELECT user_id, username, SUM(duration) as weekly_time, SUM(xp_earned) as weekly_xp
      FROM sessions
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY user_id
      ORDER BY weekly_time DESC
      LIMIT 10
    `);
    return stmt.all();
  }

  getMonthlyStats() {
    const stmt = this.db.prepare(`
      SELECT user_id, username, SUM(duration) as monthly_time, SUM(xp_earned) as monthly_xp
      FROM sessions
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY user_id
      ORDER BY monthly_time DESC
      LIMIT 10
    `);
    return stmt.all();
  }

  // Utility operations
  getAllUsers() {
    const stmt = this.db.prepare('SELECT * FROM users ORDER BY level DESC, xp DESC');
    return stmt.all();
  }

  getUserCount() {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM users');
    return stmt.get().count;
  }

  close() {
    this.db.close();
  }
}

module.exports = GameDatabase;
