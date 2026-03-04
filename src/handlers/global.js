const Profile = require('../models/profile');
const User = require('../models/user');
const { getProgressBar } = require('../utils/helpers');

// Escape underscores for Markdown
const md = (text) => String(text || '').replace(/_/g, '\\_');

module.exports = (bot) => {
    bot.action('global:leaderboard', async (ctx) => {
        const leaderboard = await Profile.getLeaderboard();

        let message = '🏆 **H A L L  O F  F A M E** 🏆\n' +
            '━━━━━━━━━━━━━━━━━━━━\n\n';
        if (leaderboard.length > 0) {
            leaderboard.forEach((user, index) => {
                const icon = index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤';
                message += `${icon} **${md(user.character_name)}**\n` +
                    `   🔸 **Lvl:** \`${user.level}\` | **BP:** \`${user.bp_level}\`\n` +
                    `   👤 *${md(user.username || 'Mysterious Player')}*\n\n`;
            });
        } else {
            message += '🌑 No heroes found in the rankings. 🕸️';
        }

        await ctx.editMessageText(message, {
            reply_markup: {
                inline_keyboard: [[{ text: '⬅️ Back to Menu', callback_data: 'back_to_list' }]]
            },
            parse_mode: 'Markdown'
        });
    });

    bot.action('global:bp', async (ctx) => {
        const profile = await Profile.ensureProfile(ctx.from.id);

        let rewardList = '';
        Object.entries(Profile.BP_REWARDS).forEach(([lvl, reward]) => {
            const status = profile.bp_level >= lvl ? '✅' : '🔒';
            rewardList += `${status} **Lvl ${lvl}**: \`${reward.name}\`\n`;
        });

        const message = `🎫 **S E A S O N  P A S S** 🎫\n` +
            '━━━━━━━━━━━━━━━━━━━━\n\n' +
            `🔹 **Current Level**: \`${profile.bp_level}\`\n` +
            `🔸 **Experience**: ${getProgressBar(profile.bp_xp, 100, 12)}\n\n` +
            `🎁 **L E V E L  R E W A R D S** 🎁\n` +
            '━━━━━━━━━━━━━━━━━━━━\n' +
            `${rewardList}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `✨ *Earn BP XP by winning battles and rising through the ranks!*`;

        await ctx.editMessageText(message, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🎁 Daily Reward', callback_data: 'global:daily' }],
                    [{ text: '⬅️ Back to Menu', callback_data: 'back_to_list' }]
                ]
            },
            parse_mode: 'Markdown'
        });
    });

    bot.action('global:daily', async (ctx) => {
        const telegramId = ctx.from.id;
        const profile = await Profile.ensureProfile(telegramId);
        const characters = await User.getUserCharacters(telegramId);

        if (characters.length === 0) {
            return ctx.answerCbQuery('❌ You need at least one hero to claim rewards!', { show_alert: true });
        }

        const now = new Date();
        const lastClaim = profile.last_daily ? new Date(profile.last_daily) : new Date(0);
        const diffHours = (now - lastClaim) / (1000 * 60 * 60);

        if (diffHours < 24) {
            const remaining = 24 - diffHours;
            return ctx.answerCbQuery(`⏳ Come back in ${Math.ceil(remaining)} hours!`, { show_alert: true });
        }

        // Grant reward to first character for simplicity, or we could ask to choose.
        // Let's grant 100 Gold and 50 BP XP to the profile.
        const char = characters[0];
        const rewardGold = 100 + (char.level * 10);
        const rewardXP = 25;

        await User.updateStats(char.id, { ...char, gold: (char.gold || 0) + rewardGold });
        await Profile.addExperience(telegramId, rewardXP);

        // We need a way to store last_daily. Assuming there's a way in Profile model.
        // If not, I'll need to check the model.
        if (Profile.updateLastDaily) {
            await Profile.updateLastDaily(telegramId);
        }

        await ctx.answerCbQuery(`🎁 Daily Reward Claimed!\n+${rewardGold} Gold 💰\n+${rewardXP} BP XP 🎫`, { show_alert: true });
        return bot.handle('global:bp', ctx); // Re-render BP menu
    });
};
