const { pool } = require('../services/db');

const Profile = {
    BP_REWARDS: {
        2: { name: '🧪 Potion Drop', type: 'ITEM', item: 'Potion', qty: 1 },
        5: { name: '🧪 Potion Pack', type: 'ITEM', item: 'Potion', qty: 2 },
        10: { name: '🛡️ Grand Hero Title', type: 'TITLE' },
        20: { name: '🔓 5 Hero Slots', type: 'SLOTS', limit: 5 }
    },
    async ensureProfile(telegramId) {
        const checkQuery = 'SELECT * FROM user_profiles WHERE telegram_id = $1;';
        const { rows } = await pool.query(checkQuery, [telegramId]);

        if (rows.length === 0) {
            const insertQuery = 'INSERT INTO user_profiles (telegram_id) VALUES ($1) RETURNING *;';
            const { rows: newProfile } = await pool.query(insertQuery, [telegramId]);
            return newProfile[0];
        }
        return rows[0];
    },

    async addBpXp(telegramId, xpToAdd) {
        const profile = await this.ensureProfile(telegramId);
        let newXp = profile.bp_xp + xpToAdd;
        let oldLevel = profile.bp_level;
        let newLevel = oldLevel;

        // BP Level up every 100 XP
        while (newXp >= 100) {
            newXp -= 100;
            newLevel += 1;
        }

        const query = 'UPDATE user_profiles SET bp_xp = $2, bp_level = $3 WHERE telegram_id = $1 RETURNING *;';
        const { rows } = await pool.query(query, [telegramId, newXp, newLevel]);

        // Check and grant rewards for any levels gained
        if (newLevel > oldLevel) {
            await this.grantLevelRewards(telegramId, oldLevel, newLevel);
        }

        return rows[0];
    },

    async grantLevelRewards(telegramId, startLevel, endLevel) {
        const User = require('./user');
        const Inventory = require('./inventory');

        // Get the first character to give items to (as items are char-locked in current schema)
        const characters = await User.getUserCharacters(telegramId);
        const primaryCharId = characters.length > 0 ? characters[0].id : null;

        for (let lvl = startLevel + 1; lvl <= endLevel; lvl++) {
            const reward = this.BP_REWARDS[lvl];
            if (reward) {
                if (reward.type === 'ITEM' && primaryCharId) {
                    await Inventory.addItem(primaryCharId, reward.item, reward.qty);
                }
                // TITLE and SLOTS are currently passive/logical checks
            }
        }
    },

    async getLeaderboard() {
        const query = `
      SELECT u.character_name, u.class, u.level, up.bp_level, u.username
      FROM users u
      JOIN user_profiles up ON u.telegram_id = up.telegram_id
      ORDER BY u.level DESC, u.xp DESC
      LIMIT 10;
    `;
        const { rows } = await pool.query(query);
        return rows;
    },

    async updateRole(telegramId, role) {
        const query = 'UPDATE user_profiles SET role = $2 WHERE telegram_id = $1 RETURNING *;';
        const { rows } = await pool.query(query, [telegramId, role]);
        return rows[0];
    },

    async updateBanStatus(telegramId, isBanned) {
        const query = 'UPDATE user_profiles SET is_banned = $2 WHERE telegram_id = $1 RETURNING *;';
        const { rows } = await pool.query(query, [telegramId, isBanned]);
        return rows[0];
    },

    async isBanned(telegramId) {
        const query = 'SELECT is_banned FROM user_profiles WHERE telegram_id = $1;';
        const { rows } = await pool.query(query, [telegramId]);
        return rows.length > 0 && rows[0].is_banned;
    },
    async updateLastDaily(telegramId) {
        const query = 'UPDATE user_profiles SET last_daily = CURRENT_TIMESTAMP WHERE telegram_id = $1;';
        await pool.query(query, [telegramId]);
    },
    async addExperience(telegramId, xp) {
        return this.addBpXp(telegramId, xp);
    }
};

module.exports = Profile;
