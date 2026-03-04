const User = require('../models/user');
const { getProgressBar } = require('../utils/helpers');

module.exports = (bot) => {
    bot.action(/^select_char:(.+)$/, async (ctx) => {
        const charId = ctx.match[1];
        const character = await User.getCharacterById(charId);

        if (!character) return ctx.answerCbQuery('Hero not found.');

        await ctx.editMessageText(
            `🛡️ **HERO PROFILE** 🛡️\n` +
            `━━━━━━━━━━━━━━━\n` +
            `**Name**: ${character.character_name}\n` +
            `**Class**: ${character.class}\n` +
            `**Level**: ${character.level}\n` +
            `━━━━━━━━━━━━━━━\n` +
            `❤️ **HP**: ${getProgressBar(character.hp, 100)}\n` +
            `✨ **XP**: ${getProgressBar(character.xp, 100)}\n` +
            `⚡ **Energy**: ${getProgressBar(character.energy, 100)}\n` +
            `💰 **Gold**: ${character.gold || 0}\n` +
            `━━━━━━━━━━━━━━━`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '⚔️ Battle (10⚡)', callback_data: `battle:${character.id}` }],
                        [{ text: '🛒 Shop', callback_data: `shop:${character.id}` }],
                        [{ text: '🎒 Inventory', callback_data: `inv:${character.id}` }],
                        [{ text: '🗑️ Delete Hero', callback_data: `confirm_delete:${character.id}` }],
                        [{ text: '⬅️ Back to Menu', callback_data: 'back_to_list' }]
                    ]
                },
                parse_mode: 'Markdown'
            }
        );
    });

    bot.action(/^confirm_delete:(.+)$/, async (ctx) => {
        const charId = ctx.match[1];
        const character = await User.getCharacterById(charId);
        if (!character) return ctx.answerCbQuery('Hero not found.');

        await ctx.editMessageText(
            `⚠️ **CONFIRM DELETION** ⚠️\n\n` +
            `Are you sure you want to delete **${character.character_name}**?\n` +
            `This action is **PERMANENT** and cannot be undone!`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔥 YES, DELETE PERMANENTLY', callback_data: `delete_hero:${charId}` }],
                        [{ text: '❌ Cancel', callback_data: `select_char:${charId}` }]
                    ]
                },
                parse_mode: 'Markdown'
            }
        );
    });

    bot.action(/^delete_hero:(.+)$/, async (ctx) => {
        const charId = ctx.match[1];
        const deleted = await User.deleteCharacter(charId);

        if (deleted) {
            await ctx.answerCbQuery(`💀 ${deleted.character_name} has been deleted.`);

            return ctx.callbackQuery.data = 'back_to_list', bot.handleUpdate(ctx.update);
        } else {
            await ctx.answerCbQuery('❌ Deletion failed.');
        }
    });

    bot.action('back_to_list', async (ctx) => {
        const telegramId = ctx.from.id;
        const characters = await User.getUserCharacters(telegramId);

        let message = '✨ **MAIN MENU** ✨\n\nWelcome back! ⚔️\n\n🛡️ **Your Heroes:**\n';
        characters.forEach((char, index) => {
            message += `━━━━━━━━━━━━━━━\n` +
                `${index + 1}. **${char.character_name}**\n` +
                `   🔹 ${char.class} | Lvl ${char.level}\n` +
                `   ❤️ HP: ${char.hp}/100 | ⚡ Energy: ${char.energy}/100\n`;
        });
        message += `━━━━━━━━━━━━━━━\n\nSelect a character! 👇`;

        const buttons = [];
        characters.forEach(char => {
            buttons.push([{ text: `🎮 Play ${char.character_name}`, callback_data: `select_char:${char.id}` }]);
        });

        const Profile = require('../models/profile');
        const profile = await Profile.ensureProfile(telegramId);
        const maxChars = profile.bp_level >= 20 ? 5 : 3;

        if (characters.length < maxChars) {
            buttons.push([{ text: '➕ Create New Hero', callback_data: 'start_creation' }]);
        }

        await ctx.editMessageText(message, {
            reply_markup: {
                inline_keyboard: buttons
            },
            parse_mode: 'Markdown'
        });
    });
};
