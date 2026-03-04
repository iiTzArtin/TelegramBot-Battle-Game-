const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../../logs/bot.log');

const logsDir = path.dirname(logFilePath);
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const loggerMiddleware = async (ctx, next) => {
    if (ctx.from) {
        const timestamp = new Date().toLocaleString('en-US', { timeZone: 'UTC' });
        const userId = ctx.from.id;
        const username = ctx.from.username || ctx.from.first_name || 'Unknown';
        const action = ctx.message?.text || ctx.callbackQuery?.data || 'Unknown Action';
        const chatType = ctx.chat?.type || 'Unknown';

        const logLine = `[${timestamp}] [User: ${username} (${userId})] [${chatType}] Action: ${action}\n`;

        // Log to file only
        fs.appendFile(logFilePath, logLine, (err) => {
            if (err) console.error('Logger write error:', err);
        });
    }

    await next();
};

module.exports = loggerMiddleware;
