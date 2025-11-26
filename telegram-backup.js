const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

// Initialize Telegram bot
const bot = new TelegramBot(config.telegram.botToken, { polling: true });
const chatId = config.telegram.chatId;

console.log('[Telegram Backup] Bot started');

// Command: /backup - Send database file
bot.onText(/\/backup/, async (msg) => {
  const userId = msg.from.id.toString();
  
  // Only respond to authorized chat
  if (userId !== chatId && msg.chat.id.toString() !== chatId) {
    bot.sendMessage(msg.chat.id, '❌ Unauthorized access');
    return;
  }

  const dbPath = path.join(__dirname, 'bot-data.db');

  if (!fs.existsSync(dbPath)) {
    bot.sendMessage(msg.chat.id, '❌ Database file not found');
    return;
  }

  try {
    // Get file stats
    const stats = fs.statSync(dbPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    await bot.sendMessage(msg.chat.id, `📦 Backing up database...\nSize: ${fileSizeInMB} MB`);
    await bot.sendDocument(msg.chat.id, dbPath, {
      caption: `🗄️ Database Backup\n📅 ${new Date().toLocaleString()}\n💾 Size: ${fileSizeInMB} MB`
    });

    console.log('[Telegram Backup] Database sent successfully');
  } catch (error) {
    console.error('[Telegram Backup] Error:', error);
    bot.sendMessage(msg.chat.id, `❌ Error sending database: ${error.message}`);
  }
});

// Command: /stats - Get database statistics
bot.onText(/\/stats/, async (msg) => {
  const userId = msg.from.id.toString();
  
  if (userId !== chatId && msg.chat.id.toString() !== chatId) {
    bot.sendMessage(msg.chat.id, '❌ Unauthorized access');
    return;
  }

  const dbPath = path.join(__dirname, 'bot-data.db');

  if (!fs.existsSync(dbPath)) {
    bot.sendMessage(msg.chat.id, '❌ Database file not found');
    return;
  }

  try {
    const GameDatabase = require('./database');
    const db = new GameDatabase();

    const userCount = db.getUserCount();
    const topUsers = db.getTopByLevel(5);
    const stats = fs.statSync(dbPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    let message = `📊 **Database Statistics**\n\n`;
    message += `👥 Total Users: ${userCount}\n`;
    message += `💾 File Size: ${fileSizeInMB} MB\n\n`;
    message += `🏆 **Top 5 Users by Level:**\n`;

    topUsers.forEach((user, index) => {
      const hours = Math.floor(user.total_time / 60);
      message += `${index + 1}. ${user.username} - Level ${user.level} (${hours}h)\n`;
    });

    db.close();
    bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('[Telegram Backup] Stats error:', error);
    bot.sendMessage(msg.chat.id, `❌ Error getting stats: ${error.message}`);
  }
});

// Command: /help - Show available commands
bot.onText(/\/help|\/start/, (msg) => {
  const userId = msg.from.id.toString();
  
  if (userId !== chatId && msg.chat.id.toString() !== chatId) {
    bot.sendMessage(msg.chat.id, '❌ Unauthorized access');
    return;
  }

  const helpMessage = `
🤖 **Discord Bot Backup Manager**

Available Commands:
/backup - Download database file
/stats - View database statistics
/schedule - Set up automatic backups
/help - Show this message

📝 Note: Only authorized users can use these commands.
  `;

  bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: 'Markdown' });
});

// Scheduled backup (every 24 hours)
let backupInterval = null;

bot.onText(/\/schedule/, async (msg) => {
  const userId = msg.from.id.toString();
  
  if (userId !== chatId && msg.chat.id.toString() !== chatId) {
    bot.sendMessage(msg.chat.id, '❌ Unauthorized access');
    return;
  }

  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
    bot.sendMessage(msg.chat.id, '⏸️ Automatic backups stopped');
  } else {
    // Send backup immediately
    const dbPath = path.join(__dirname, 'bot-data.db');
    if (fs.existsSync(dbPath)) {
      await bot.sendDocument(msg.chat.id, dbPath, {
        caption: `🗄️ Initial Backup\n📅 ${new Date().toLocaleString()}`
      });
    }

    // Schedule daily backups
    backupInterval = setInterval(async () => {
      if (fs.existsSync(dbPath)) {
        try {
          await bot.sendDocument(chatId, dbPath, {
            caption: `🗄️ Scheduled Backup\n📅 ${new Date().toLocaleString()}`
          });
          console.log('[Telegram Backup] Scheduled backup sent');
        } catch (error) {
          console.error('[Telegram Backup] Scheduled backup error:', error);
        }
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    bot.sendMessage(msg.chat.id, '✅ Automatic daily backups enabled');
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('[Telegram Backup] Polling error:', error);
});

console.log('[Telegram Backup] Listening for commands...');
console.log('[Telegram Backup] Authorized Chat ID:', chatId);
