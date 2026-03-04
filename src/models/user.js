const { pool } = require('../services/db');

const User = {
    async createCharacter(telegramId, username, charName, charClass) {
        const Profile = require('./profile');
        await Profile.ensureProfile(telegramId);

        const query = `
      INSERT INTO users (telegram_id, username, character_name, class, gold)
      VALUES ($1, $2, $3, $4, 100)
      RETURNING *;
    `;
        const values = [telegramId, username, charName, charClass];
        const { rows } = await pool.query(query, values);

        // Give starter potion
        const Inventory = require('./inventory');
        await Inventory.addItem(rows[0].id, 'Potion', 1);

        return rows[0];
    },

    async getUserCharacters(telegramId) {
        const query = 'SELECT * FROM users WHERE telegram_id = $1 ORDER BY id ASC;';
        const { rows } = await pool.query(query, [telegramId]);

        // Update energy for all characters on retrieval
        for (let char of rows) {
            await this.calculateEnergy(char);
        }

        return rows;
    },

    async getCharacterById(id) {
        const query = 'SELECT * FROM users WHERE id = $1;';
        const { rows } = await pool.query(query, [id]);
        if (!rows[0]) return null;

        return await this.calculateEnergy(rows[0]);
    },

    async calculateEnergy(user) {
        const now = new Date();
        const lastUpdate = new Date(user.last_energy_update);
        const diffMs = now - lastUpdate;
        const diffMins = Math.floor(diffMs / (1000 * 60));

        if (diffMins >= 3 && user.energy < 100) {
            const energyToAdd = Math.floor(diffMins / 3);
            const newEnergy = Math.min(100, user.energy + energyToAdd);
            const newLastUpdate = new Date(lastUpdate.getTime() + (energyToAdd * 3 * 60 * 1000));

            const query = 'UPDATE users SET energy = $2, last_energy_update = $3 WHERE id = $1 RETURNING *;';
            const { rows } = await pool.query(query, [user.id, newEnergy, newLastUpdate]);
            return rows[0];
        }
        return user;
    },

    async updateStats(id, { hp, xp, level, energy, gold }) {
        const query = `
      UPDATE users 
      SET hp = $2, xp = $3, level = $4, energy = $5, gold = $6, last_energy_update = NOW()
      WHERE id = $1 
      RETURNING *;
    `;
        const values = [id, hp, xp, level, energy, gold];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    async getIdByUsername(username) {
        // Remove @ if present
        const cleanName = username.replace('@', '');
        const query = 'SELECT telegram_id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1;';
        const { rows } = await pool.query(query, [cleanName]);
        return rows.length > 0 ? rows[0].telegram_id : null;
    },

    async deleteCharacter(id) {
        const query = 'DELETE FROM users WHERE id = $1 RETURNING *;';
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    }
};

module.exports = User;
