const User = require('../models/user');
const Inventory = require('../models/inventory');

const md = (text) => String(text).replace(/_/g, '\\_');

const SHOP_ITEMS = [
    { id: 'potion', name: 'Potion', price: 50, icon: '🧪', rarity: 'Common', description: 'Restores **20 HP** instantly.' },
    { id: 'shield', name: 'Wooden Shield', price: 150, icon: '🛡️', rarity: 'Common', description: 'Adds **+10 Max HP**.' },
    { id: 'steel_sword', name: 'Steel Sword', price: 500, icon: '⚔️', rarity: 'Rare', description: 'Increases Attack by **+15 DMG**.' },
    { id: 'leather_armor', name: 'Leather Armor', price: 600, icon: '👕', rarity: 'Rare', description: 'Increases Max HP by **+30**.' },
    { id: 'titan_armor', name: 'Titan Armor', price: 2000, icon: '👘', rarity: 'Legend', description: 'Increases Max HP by **+100**.' },
    { id: 'dragon_sword', name: 'Dragon Slay', price: 2500, icon: '🔥', rarity: 'Legend', description: 'Increases Attack by **+50 DMG**.' },
    { id: 'inf_blade', name: 'Infinity Blade', price: 10000, icon: '✨', rarity: 'Mythic', description: 'The ultimate weapon. **+200 DMG**.' }
];

module.exports = (bot) => {
    bot.action(/^shop:(.+)$/, async (ctx) => {
        const charId = ctx.match[1];
        const character = await User.getCharacterById(charId);

        if (!character) return ctx.answerCbQuery('Hero not found.');

        let message = `🛒 **GLOBAL SHOP** 🛒\n` +
            `━━━━━━━━━━━━━━━\n` +
            `💰 **Your Gold**: ${character.gold}\n` +
            `━━━━━━━━━━━━━━━\n\n`;

        const keyboard = [];
        SHOP_ITEMS.forEach(item => {
            message += `${item.icon} **${md(item.name)}** [${item.rarity}]\n` +
                `   _${item.description}_\n` +
                `   Price: ${item.price} 💰\n\n`;
            keyboard.push([{ text: `Buy ${item.name} (${item.price}💰)`, callback_data: `buy:${charId}:${item.id}` }]);
        });

        keyboard.push([{ text: '⬅️ Back to Profile', callback_data: `select_char:${charId}` }]);

        await ctx.editMessageText(message, {
            reply_markup: { inline_keyboard: keyboard },
            parse_mode: 'Markdown'
        });
    });

    bot.action(/^buy:(.+):(.+)$/, async (ctx) => {
        const charId = ctx.match[1];
        const itemId = ctx.match[2];

        const character = await User.getCharacterById(charId);
        const item = SHOP_ITEMS.find(i => i.id === itemId);

        if (!character || !item) return ctx.answerCbQuery('Error.');

        if (character.gold < item.price) {
            return ctx.answerCbQuery(`❌ Not enough gold! Need ${item.price - character.gold} more.`, { show_alert: true });
        }

        try {
            // Deduct gold
            const newGold = character.gold - item.price;
            await User.updateStats(charId, {
                hp: character.hp,
                xp: character.xp,
                level: character.level,
                energy: character.energy,
                gold: newGold
            });

            // Add to inventory
            await Inventory.addItem(charId, item.name, 1);

            await ctx.answerCbQuery(`✅ Purchased ${item.name}!`);

            // Update shop view
            const updatedChar = await User.getCharacterById(charId);
            let message = `🛒 **GLOBAL SHOP** 🛒\n` +
                `━━━━━━━━━━━━━━━\n` +
                `💰 **Your Gold**: ${updatedChar.gold}\n` +
                `━━━━━━━━━━━━━━━\n\n`;

            const keyboard = [];
            SHOP_ITEMS.forEach(i => {
                message += `${i.icon} **${md(i.name)}** [${i.rarity}]\n` +
                    `   _${i.description}_\n` +
                    `   Price: ${i.price} 💰\n\n`;
                keyboard.push([{ text: `Buy ${i.name} (${i.price}💰)`, callback_data: `buy:${charId}:${i.id}` }]);
            });
            keyboard.push([{ text: '⬅️ Back to Profile', callback_data: `select_char:${charId}` }]);

            await ctx.editMessageText(message, {
                reply_markup: { inline_keyboard: keyboard },
                parse_mode: 'Markdown'
            });

        } catch (err) {
            console.error('Purchase error:', err);
            await ctx.answerCbQuery('❌ Purchase failed.');
        }
    });
};
