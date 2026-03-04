const User = require('../models/user');
const Profile = require('../models/profile');

module.exports = (bot) => {
    bot.action('start_creation', async (ctx) => {
        try {
            const profile = await Profile.ensureProfile(ctx.from.id);
            const characters = await User.getUserCharacters(ctx.from.id);
            const maxChars = profile.bp_level >= 20 ? 5 : 3;

            if (characters.length >= maxChars) {
                return ctx.answerCbQuery(`⚠️ Hero limit (${maxChars}) reached! Reach BP Level 20 for more.`, { show_alert: true });
            }

            ctx.session = { state: 'AWAITING_NAME' };
            await ctx.answerCbQuery();
            await ctx.editMessageText('✨ **Character Creation** ✨\n\nGreat! Let\'s forge a new hero.\n\nType your hero\'s **name**: (2-20 characters)', { parse_mode: 'Markdown' });
        } catch (err) {
            console.error('Error starting creation:', err);
        }
    });

    bot.on('text', async (ctx, next) => {
        if (ctx.session?.state === 'AWAITING_NAME') {
            const name = ctx.message.text.trim();
            if (name.length < 2 || name.length > 20) {
                return ctx.reply('⚠️ Name must be between 2 and 20 characters. Try again:');
            }

            ctx.session.name = name;
            ctx.session.state = 'AWAITING_CLASS';

            return ctx.reply(`🛡️ **Hero Name:** ${name}\n\nNow, choose your **Class**:`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '⚔️ Warrior (+HP)', callback_data: 'class:Warrior' }],
                        [{ text: '🔮 Mage (+XP)', callback_data: 'class:Mage' }],
                        [{ text: '🏹 Archer (+Evasion placeholder)', callback_data: 'class:Archer' }]
                    ]
                },
                parse_mode: 'Markdown'
            });
        }
        return next();
    });

    bot.action(/^class:(.+)$/, async (ctx) => {
        if (ctx.session?.state !== 'AWAITING_CLASS') {
            return ctx.answerCbQuery('Please start from the beginning.');
        }

        const charClass = ctx.match[1];
        const charName = ctx.session.name;
        const telegramId = ctx.from.id;
        const username = ctx.from.username || ctx.from.first_name;

        try {
            await User.createCharacter(telegramId, username, charName, charClass);
            ctx.session = null;

            await ctx.answerCbQuery(`Hero ${charName} born!`);
            await ctx.editMessageText(`🎉 **Success!**\n\nYour hero **${charName}** (the ${charClass}) has been forged.\nI've given you **1 starter Potion**! 🎒\n\nSend /start to play.`, { parse_mode: 'Markdown' });
        } catch (err) {
            console.error('Error in final creation stage:', err);
            await ctx.reply('❌ Sorry, something went wrong. Please try /start again.');
        }
    });
};
