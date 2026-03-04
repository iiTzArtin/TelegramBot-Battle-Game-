const User = require('../models/user');
const Profile = require('../models/profile');
const { randomRange, getProgressBar } = require('../utils/helpers');

const md = (text) => String(text || '').replace(/_/g, '\\_');

module.exports = (bot) => {
    bot.action(/^battle:(.+)$/, async (ctx) => {
        const charId = ctx.match[1];
        const character = await User.getCharacterById(charId);

        if (!character) return ctx.answerCbQuery('Hero error.');

        if (character.energy < 10) {
            return ctx.answerCbQuery('⚡ Not enough energy! Recovers 1 every 3 minutes.', { show_alert: true });
        }

        if (character.hp <= 0) {
            return ctx.answerCbQuery('🤕 You are too weak to fight! Use a potion first.', { show_alert: true });
        }

        const newEnergy = character.energy - 10;
        await User.updateStats(charId, { hp: character.hp, xp: character.xp, level: character.level, energy: newEnergy });

        ctx.session = {
            state: 'IN_BATTLE',
            charId: charId,
            enemyHp: 50,
            enemyMaxHp: 50,
            enemyName: 'Wild Beast'
        };

        await ctx.answerCbQuery('Encountered Enemy! 👹');
        await ctx.editMessageText(
            `👹 **ENEMY ENCOUNTERED** 👹\n\n` +
            `🛡️ **${md(character.character_name)}** vs **${ctx.session.enemyName}**\n\n` +
            `❤️ **Hero HP**: ${getProgressBar(character.hp, 100)}\n` +
            `🖤 **Enemy HP**: ${getProgressBar(ctx.session.enemyHp, ctx.session.enemyMaxHp)}\n\n` +
            `⚡ Battle cost 10 energy (-10⚡)`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '💥 Attack', callback_data: 'battle_act:atk' }],
                        [{ text: '🏃 Retreat', callback_data: 'battle_act:run' }]
                    ]
                },
                parse_mode: 'Markdown'
            }
        );
    });

    bot.action('battle_act:atk', async (ctx) => {
        if (ctx.session?.state !== 'IN_BATTLE') return ctx.answerCbQuery('No active battle.');

        const character = await User.getCharacterById(ctx.session.charId);
        if (!character) return ctx.answerCbQuery('Hero error.');

        // 1. Hero Attacks
        const playerDmg = randomRange(5, 15);
        ctx.session.enemyHp -= playerDmg;
        let log = `You dealt **${playerDmg} damage**! 💥\n`;

        // 2. Victory Check
        if (ctx.session.enemyHp <= 0) {
            const Inventory = require('../models/inventory');
            const xpGained = 25;
            let newXp = character.xp + xpGained;
            let newLevel = character.level;
            let victoryMsg = '';

            // Loot Drop (30% chance)
            let lootMsg = '';
            if (Math.random() <= 0.30) {
                await Inventory.addItem(character.id, 'Potion', 1);
                lootMsg = `\n🎁 **Loot Found!** You found a **Potion**! 🧪`;
            }

            if (newXp >= 100) {
                newXp -= 100;
                newLevel += 1;
                victoryMsg = `\n✨ **LEVEL UP!** You are now **Level ${newLevel}**! 🎉`;
            }

            // Reward BP XP
            const bpXpGained = 15;
            await Profile.addBpXp(ctx.from.id, bpXpGained);

            // Reward Gold (20-50)
            const goldGained = randomRange(20, 50);
            const newGold = (character.gold || 0) + goldGained;

            await User.updateStats(character.id, {
                hp: character.hp,
                xp: newXp,
                level: newLevel,
                energy: character.energy,
                gold: newGold
            });
            ctx.session = null;

            return ctx.editMessageText(
                `🏆 **VICTORY!** 🏆\n\n` +
                `Hero earned: **+${xpGained} XP**\n` +
                `Gold found: **+${goldGained} 💰**\n` +
                `Battle Pass earned: **+${bpXpGained} BP XP** 🎫` +
                `${lootMsg}\n\n` +
                `${victoryMsg}`,
                {
                    reply_markup: { inline_keyboard: [[{ text: '⬅️ Back to Home', callback_data: `select_char:${character.id}` }]] },
                    parse_mode: 'Markdown'
                }
            );
        }

        // 3. Enemy Counter-Attacks
        const enemyDmg = randomRange(4, 14);
        const newHp = Math.max(0, character.hp - enemyDmg);
        log += `Enemy hit you for **${enemyDmg} damage**! 🤜`;

        await User.updateStats(character.id, { hp: newHp, xp: character.xp, level: character.level, energy: character.energy });

        // 4. Defeat Check
        if (newHp <= 0) {
            ctx.session = null;
            return ctx.editMessageText(
                `💀 **HERO DEFEATED** 💀\n\n${log}\n\nYou have fallen in battle. Use a potion or wait for future healing systems.`,
                {
                    reply_markup: { inline_keyboard: [[{ text: '⬅️ Back to Menu', callback_data: 'back_to_list' }]] },
                    parse_mode: 'Markdown'
                }
            );
        }

        // 5. Update UI
        await ctx.editMessageText(
            `⚔️ **COMBAT CONTINUES** ⚔️\n\n` +
            `❤️ **Hero HP**: ${getProgressBar(newHp, 100)}\n` +
            `🖤 **Enemy HP**: ${getProgressBar(ctx.session.enemyHp, ctx.session.enemyMaxHp)}\n\n` +
            `📜 **Log**: ${log}`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '💥 Attack', callback_data: 'battle_act:atk' }],
                        [{ text: '🏃 Retreat', callback_data: 'battle_act:run' }]
                    ]
                },
                parse_mode: 'Markdown'
            }
        );
    });

    bot.action('battle_act:run', async (ctx) => {
        const charId = ctx.session?.charId;
        ctx.session = null;
        await ctx.answerCbQuery('Retreated! 🏃');
        await ctx.editMessageText('You safely retreated from the encounter.', {
            reply_markup: { inline_keyboard: [[{ text: '⬅️ Back', callback_data: charId ? `select_char:${charId}` : 'back_to_list' }]] }
        });
    });
};
