const fs = require('fs');
const path = require('path');
const User = require('../models/user');
const Profile = require('../models/profile');
const Inventory = require('../models/inventory');

const OWNER_IDS = process.env.OWNER_IDS
    ? process.env.OWNER_IDS.split(',').map(id => id.trim().replace('@', ''))
    : [];

const ACTION_LABELS = {
    ban: '🚫 Ban Player',
    unban: '✅ Unban Player',
    add_gold: '💰 Add Gold',
    sub_gold: '💸 Remove Gold',
    add_item: '🎒 Add Item',
    rem_item: '🗑️ Remove Item',
    del_char: '💀 Delete Character',
};

// Actions that need a character selected first
const CHAR_ACTIONS = ['add_gold', 'sub_gold', 'add_item', 'rem_item', 'del_char'];

module.exports = (bot) => {
    const isOwner = (ctx) => {
        const userId = ctx.from.id.toString();
        const username = ctx.from.username;
        return OWNER_IDS.includes(userId) ||
            (username && OWNER_IDS.includes(username)) ||
            ctx.state.profile?.role === 'owner';
    };
    const isAdmin = (ctx) => ctx.state.profile?.role === 'admin' || isOwner(ctx);

    // ─── PANELS ──────────────────────────────────────────────────────────────

    bot.hears('MTpanel', async (ctx) => {
        if (!isOwner(ctx)) return;
        await ctx.reply(
            '👷 MANAGEMENT PANEL (OWNER) 👷\n━━━━━━━━━━━━━━━\nSelect an action:',
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📋 LGpanel (Logs)', callback_data: 'admin:logs' }],
                        [{ text: '➕ Add Admin', callback_data: 'admin:add_role:admin' }, { text: '➖ Remove Admin', callback_data: 'admin:rem_role' }],
                        [{ text: '🚫 Ban Player', callback_data: 'admin:target:ban' }, { text: '✅ Unban Player', callback_data: 'admin:target:unban' }],
                        [{ text: '💰 Add Gold', callback_data: 'admin:target:add_gold' }, { text: '💸 Sub Gold', callback_data: 'admin:target:sub_gold' }],
                        [{ text: '🎒 Add Item', callback_data: 'admin:target:add_item' }, { text: '🗑️ Rem Item', callback_data: 'admin:target:rem_item' }],
                        [{ text: '💀 Delete Character', callback_data: 'admin:target:del_char' }],
                    ]
                }
            }
        );
    });

    bot.hears('ANpanel', async (ctx) => {
        if (isOwner(ctx)) return ctx.reply('Owners should use MTpanel.');
        if (!isAdmin(ctx)) return;
        await ctx.reply(
            '🛠️ ADMIN PANEL\n━━━━━━━━━━━━━━━\nSelect an action:',
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📋 LGpanel (Logs)', callback_data: 'admin:logs' }],
                        [{ text: '🚫 Ban Player', callback_data: 'admin:target:ban' }, { text: '✅ Unban Player', callback_data: 'admin:target:unban' }],
                        [{ text: '💰 Add Gold', callback_data: 'admin:target:add_gold' }, { text: '💸 Sub Gold', callback_data: 'admin:target:sub_gold' }],
                        [{ text: '🎒 Add Item', callback_data: 'admin:target:add_item' }, { text: '🗑️ Rem Item', callback_data: 'admin:target:rem_item' }],
                        [{ text: '💀 Delete Character', callback_data: 'admin:target:del_char' }],
                    ]
                }
            }
        );
    });

    bot.hears('LGpanel', async (ctx) => {
        if (!isAdmin(ctx)) return;
        return handleLogs(ctx);
    });

    bot.action('admin:logs', async (ctx) => {
        await ctx.answerCbQuery();
        return handleLogs(ctx);
    });

    async function handleLogs(ctx) {
        const logPath = path.join(__dirname, '../../logs/bot.log');
        if (!fs.existsSync(logPath)) {
            return ctx.reply('📂 No logs found.');
        }

        const logs = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean).slice(-15).join('\n');
        const buttons = [];
        if (isOwner(ctx)) {
            buttons.push([{ text: '🗑️ Clear Logs', callback_data: 'admin:clear_logs' }]);
        }
        buttons.push([{ text: '🔄 Refresh', callback_data: 'admin:logs' }]);

        const msg = `📋 **RECENT LOGS** 📋\n━━━━━━━━━━━━━━━\n\`\`\`\n${logs || 'No recent activity.'}\n\`\`\``;

        if (ctx.callbackQuery) {
            return ctx.editMessageText(msg, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } });
        }
        return ctx.reply(msg, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } });
    }

    bot.action('admin:clear_logs', async (ctx) => {
        if (!isOwner(ctx)) return ctx.answerCbQuery('❌ Access denied.', { show_alert: true });
        const logPath = path.join(__dirname, '../../logs/bot.log');
        fs.writeFileSync(logPath, '');
        await ctx.answerCbQuery('✅ Logs cleared.');
        return handleLogs(ctx);
    });

    // ─── ACTION SELECTION ────────────────────────────────────────────────────

    bot.action(/^admin:target:(.+)$/, async (ctx) => {
        await ctx.answerCbQuery();
        const action = ctx.match[1];
        const label = ACTION_LABELS[action] || action;
        ctx.session.adminPanel = { action, state: 'AWAITING_ID' };

        await ctx.editMessageText(
            `${label}\n\nSend the Telegram ID or @username of the target player:`,
            { reply_markup: { inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin:cancel' }]] } }
        );
    });

    bot.action(/^admin:add_role:(.+)$/, async (ctx) => {
        await ctx.answerCbQuery();
        if (!isOwner(ctx)) return;
        const role = ctx.match[1];
        ctx.session.adminPanel = { action: 'add_role', role, state: 'AWAITING_ID' };
        await ctx.editMessageText(
            `Promoting to ${role.toUpperCase()}\n\nSend the Telegram ID or @username:`,
            { reply_markup: { inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin:cancel' }]] } }
        );
    });

    bot.action('admin:rem_role', async (ctx) => {
        await ctx.answerCbQuery();
        if (!isOwner(ctx)) return;
        ctx.session.adminPanel = { action: 'rem_role', state: 'AWAITING_ID' };
        await ctx.editMessageText(
            'Demoting to USER\n\nSend the Telegram ID or @username:',
            { reply_markup: { inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin:cancel' }]] } }
        );
    });

    // ─── CHARACTER SELECTION (inline button) ─────────────────────────────────

    bot.action(/^admin:selchar:(\d+)$/, async (ctx) => {
        await ctx.answerCbQuery();
        const charId = ctx.match[1];
        const admin = ctx.session?.adminPanel;
        if (!admin) return ctx.editMessageText('Session expired. Please start again.');

        admin.charId = charId;

        if (admin.action === 'del_char') {
            // Delete immediately
            return finalize(ctx);
        }

        admin.state = 'AWAITING_VALUE';
        const prompt = admin.action.includes('gold')
            ? 'How much gold?'
            : 'What is the item name?\n\nITEM LIST:\n1. Potion\n2. shield\n3. steel_sword\n4. leather_armor\n5. titan_armor\n6. dragon_sword\n7. inf_blade';

        await ctx.editMessageText(
            `Character selected.\n\n${prompt}`,
            { reply_markup: { inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin:cancel' }]] } }
        );
    });

    bot.action('admin:cancel', async (ctx) => {
        await ctx.answerCbQuery();
        ctx.session.adminPanel = null;
        await ctx.editMessageText('❌ Operation cancelled.');
    });

    // ─── TEXT INPUT HANDLER ──────────────────────────────────────────────────

    bot.on('text', async (ctx, next) => {
        const admin = ctx.session?.adminPanel;
        if (!admin) return next();

        const input = ctx.message.text.trim();

        // Step 1: Resolve target player
        if (admin.state === 'AWAITING_ID') {
            let targetId = input;

            if (isNaN(targetId)) {
                targetId = await User.getIdByUsername(input);
                if (!targetId) {
                    return ctx.reply(
                        `User "${input}" not found. Make sure they have started the bot and created a hero.`
                    );
                }
            }

            admin.targetId = targetId;

            // Actions that don't need a character (ban/unban/role changes)
            const noCharNeeded = ['ban', 'unban', 'add_role', 'rem_role'];
            if (noCharNeeded.includes(admin.action)) {
                return finalize(ctx);
            }

            // For char-specific actions: show character list
            const chars = await User.getUserCharacters(targetId);
            if (chars.length === 0) {
                ctx.session.adminPanel = null;
                return ctx.reply(`No characters found for player ${targetId}.`);
            }

            admin.state = 'AWAITING_CHAR';
            const buttons = chars.map(c => ([{
                text: `${c.character_name} (${c.class}, Lvl ${c.level})`,
                callback_data: `admin:selchar:${c.id}`
            }]));
            buttons.push([{ text: '❌ Cancel', callback_data: 'admin:cancel' }]);

            return ctx.reply(
                `Player found!\n\nSelect a character to apply "${ACTION_LABELS[admin.action] || admin.action}":`,
                { reply_markup: { inline_keyboard: buttons } }
            );
        }

        // Step 3: Value input (gold amount or item name)
        if (admin.state === 'AWAITING_VALUE') {
            admin.value = input;
            return finalize(ctx);
        }

        return next();
    });

    // ─── FINALIZE ACTION ─────────────────────────────────────────────────────

    async function finalize(ctx) {
        const { action, targetId, charId, value, role } = ctx.session.adminPanel;
        try {
            if (action === 'ban') {
                await Profile.updateBanStatus(targetId, true);
            }
            else if (action === 'unban') {
                await Profile.updateBanStatus(targetId, false);
            }
            else if (action === 'add_role') {
                await Profile.updateRole(targetId, role);
            }
            else if (action === 'rem_role') {
                await Profile.updateRole(targetId, 'user');
            }
            else if (action === 'add_gold' || action === 'sub_gold') {
                const char = await User.getCharacterById(charId);
                if (!char) throw new Error('Character not found.');
                const amount = parseInt(value);
                if (isNaN(amount)) throw new Error('Invalid gold amount.');
                const newGold = action === 'add_gold'
                    ? (char.gold || 0) + amount
                    : Math.max(0, (char.gold || 0) - amount);
                await User.updateStats(char.id, { ...char, gold: newGold });
            }
            else if (action === 'add_item') {
                await Inventory.addItem(charId, value, 1);
            }
            else if (action === 'rem_item') {
                await Inventory.removeItem(charId, value, 1);
            }
            else if (action === 'del_char') {
                await User.deleteCharacter(charId);
            }

            const label = ACTION_LABELS[action] || action;
            await ctx.reply(
                `✅ SUCCESS\nAction: ${label}\nTarget: ${targetId}\nValue: ${value || role || 'N/A'}`
            );
        } catch (err) {
            await ctx.reply(`❌ ERROR\n${err.message}`);
        } finally {
            ctx.session.adminPanel = null;
        }
    }
};
