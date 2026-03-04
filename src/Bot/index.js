require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const startCommand = require('../commands/start');
const { testConnection } = require('../services/db');
const { initDatabase } = require('../services/initDb');
const Profile = require('../models/profile');

const logger = require('../middlewares/logger');
const rateLimiter = require('../middlewares/rateLimiter');

const creationHandler = require('../handlers/creation');
const characterHandler = require('../handlers/character');
const inventoryHandler = require('../handlers/inventory');
const battleHandler = require('../handlers/battle');
const globalHandler = require('../handlers/global');
const shopHandler = require('../handlers/shop');

const adminHandler = require('../handlers/admin');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session());
bot.use((ctx, next) => {
  ctx.session = ctx.session || {};
  return next();
});
bot.use(logger);
bot.use(rateLimiter);

bot.use(async (ctx, next) => {
  if (ctx.from) {
    const profile = await Profile.ensureProfile(ctx.from.id);

    // Global Ban Check
    if (profile.is_banned) {
      if (ctx.updateType === 'callback_query') {
        return ctx.answerCbQuery('🚫 You are banned from this bot.', { show_alert: true });
      }
      return ctx.reply('🚫 You are banned from using this bot.');
    }

    ctx.state.profile = profile; // Save profile for later use (roles)
  }
  await next();
});


// ----------------------| Commands |--------------------
bot.command('start', startCommand);

// ----------------------| Register Handlers |--------------------
creationHandler(bot);
characterHandler(bot);
inventoryHandler(bot);
battleHandler(bot);
globalHandler(bot);
shopHandler(bot);
adminHandler(bot);


// ----------------------| Bot Launch |--------------------
async function launchBot() {
  try {
    console.log('Connecting to Database... ⏳');
    const isDbConnected = await testConnection();

    if (!isDbConnected) {
      console.error('❌ Bot startup aborted: Database connection failed.');
      process.exit(1);
    }

    await initDatabase();

    await bot.launch();
    console.log('Robot Started Successfully 🚀');
  } catch (err) {
    console.error('Error in Bot Launch:', err);
  }
}

launchBot();

// ----------------------| Graceful Shutdown |--------------------
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));