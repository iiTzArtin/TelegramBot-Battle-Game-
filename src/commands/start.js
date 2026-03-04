const User = require('../models/user');
const { getProgressBar } = require('../utils/helpers');

module.exports = async (ctx) => {
  const telegramId = ctx.from.id;
  const characters = await User.getUserCharacters(telegramId);

  const Profile = require('../models/profile');
  const profile = await Profile.ensureProfile(telegramId);

  let message = '💠 **M I N I  B A T T L E  G A M E** 💠\n' +
    '━━━━━━━━━━━━━━━━━━━━\n' +
    'Welcome back, Warrior! ⚔️\n\n' +
    '📍 **Q U I C K  S T A T S** 📍\n' +
    `👤 **User ID:** \`${telegramId}\`\n` +
    `🎟️ **Battle Pass Level:** \`${profile.bp_level || 0}\`\n\n`;

  if (characters.length > 0) {
    message += '🛡️ **Y O U R  H E R O E S** 🛡️\n';
    characters.forEach((char, index) => {
      message += `━━━━━━━━━━━━━━━━━━━━\n` +
        `**${index + 1}. ${char.character_name}**\n` +
        `   🔸 **Class:** \`${char.class}\` | **Lvl:** \`${char.level}\`\n` +
        `   ❤️ **HP:** ${getProgressBar(char.hp, 100, 8)}\n` +
        `   ⚡ **NRG:** ${getProgressBar(char.energy, 100, 8)}\n`;
    });
    message += `━━━━━━━━━━━━━━━━━━━━\n\n✨ Choose your destiny or explore the realm! 👇`;
  } else {
    message += '🌑 **The realm awaits...**\n\nYou have no heroes yet. Create one to begin your journey! 🗺️';
  }

  const buttons = [];

  characters.forEach(char => {
    buttons.push([{ text: `🎮 Play as ${char.character_name}`, callback_data: `select_char:${char.id}` }]);
  });

  const maxChars = profile.bp_level >= 20 ? 5 : 3;

  // Management Buttons
  const mgmtRow = [];
  if (characters.length < maxChars) {
    mgmtRow.push({ text: '➕ Create Hero', callback_data: 'start_creation' });
  }
  buttons.push(mgmtRow);

  // Profile/Global Buttons
  buttons.push([
    { text: '🏆 Hall of Fame', callback_data: 'global:leaderboard' },
    { text: '🎫 Season Pass', callback_data: 'global:bp' }
  ]);

  await ctx.reply(message, {
    reply_markup: {
      inline_keyboard: buttons
    },
    parse_mode: 'Markdown'
  });
};