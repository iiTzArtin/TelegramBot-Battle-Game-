const Inventory = require('../models/inventory');
const User = require('../models/user');

const md = (text) => String(text).replace(/_/g, '\\_');

module.exports = (bot) => {
    bot.action(/^inv:(.+)$/, async (ctx) => {
        const charId = ctx.match[1];
        const inventory = await Inventory.getUserInventory(charId);
        const character = await User.getCharacterById(charId);

        let message = `🎒 **INVENTORY - ${md(character.character_name)}** 🎒\n\n`;

        const buttons = [];
        if (inventory.length > 0) {
            inventory.forEach(item => {
                message += `• ${md(item.item_name)} x${item.quantity}\n`;
                if (item.item_name === 'Potion') {
                    buttons.push([{ text: `🧪 Use Potion (+20 HP)`, callback_data: `use:Potion:${charId}` }]);
                }
            });
        } else {
            message += 'Your inventory is empty. 🕸️';
        }

        buttons.push([{ text: '⬅️ Back to Hero', callback_data: `select_char:${charId}` }]);

        await ctx.editMessageText(message, {
            reply_markup: { inline_keyboard: buttons },
            parse_mode: 'Markdown'
        });
    });

    bot.action(/^use:(.+):(.+)$/, async (ctx) => {
        const itemName = ctx.match[1];
        const charId = ctx.match[2];

        const character = await User.getCharacterById(charId);
        const item = await Inventory.removeItem(charId, itemName, 1);

        if (!item) return ctx.answerCbQuery('Item not found or empty!');

        if (itemName === 'Potion') {
            const newHp = Math.min(100, character.hp + 20);
            await User.updateStats(charId, { hp: newHp, xp: character.xp, level: character.level, energy: character.energy, gold: character.gold });
            await ctx.answerCbQuery('Healed 20 HP! ❤️');
        }

        // Refresh inventory view
        const updatedChar = await User.getCharacterById(charId);
        const inventory = await Inventory.getUserInventory(charId);
        let message = `🎒 **INVENTORY - ${md(updatedChar.character_name)}** 🎒\n\n`;
        const buttons = [];
        if (inventory.length > 0) {
            inventory.forEach(i => {
                message += `• ${md(i.item_name)} x${i.quantity}\n`;
                if (i.item_name === 'Potion') {
                    buttons.push([{ text: `🧪 Use Potion (+20 HP)`, callback_data: `use:Potion:${charId}` }]);
                }
            });
        } else {
            message += 'Your inventory is empty. 🕸️';
        }
        buttons.push([{ text: '⬅️ Back to Hero', callback_data: `select_char:${charId}` }]);

        await ctx.editMessageText(message, {
            reply_markup: { inline_keyboard: buttons },
            parse_mode: 'Markdown'
        });
    });
};
