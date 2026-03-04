const { pool } = require('../services/db');

const Inventory = {
    async getUserInventory(userId) {
        const query = 'SELECT * FROM inventory WHERE user_id = $1;';
        const { rows } = await pool.query(query, [userId]);
        return rows;
    },

    async addItem(userId, itemName, quantity = 1) {
        const query = `
      INSERT INTO inventory (user_id, item_name, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, item_name) -- Requires unique constraint on (user_id, item_name)
      DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity
      RETURNING *;
    `;
    

        const checkQuery = 'SELECT * FROM inventory WHERE user_id = $1 AND item_name = $2;';
        const { rows: existing } = await pool.query(checkQuery, [userId, itemName]);

        if (existing.length > 0) {
            const updateQuery = 'UPDATE inventory SET quantity = quantity + $3 WHERE user_id = $1 AND item_name = $2 RETURNING *;';
            const { rows } = await pool.query(updateQuery, [userId, itemName, quantity]);
            return rows[0];
        } else {
            const insertQuery = 'INSERT INTO inventory (user_id, item_name, quantity) VALUES ($1, $2, $3) RETURNING *;';
            const { rows } = await pool.query(insertQuery, [userId, itemName, quantity]);
            return rows[0];
        }
    },

    async removeItem(userId, itemName, quantity = 1) {
        const updateQuery = 'UPDATE inventory SET quantity = quantity - $3 WHERE user_id = $1 AND item_name = $2 AND quantity >= $3 RETURNING *;';
        const { rows } = await pool.query(updateQuery, [userId, itemName, quantity]);

        // Optionally delete if quantity reaches 0
        if (rows[0] && rows[0].quantity <= 0) {
            await pool.query('DELETE FROM inventory WHERE id = $1', [rows[0].id]);
        }

        return rows[0];
    }
};

module.exports = Inventory;
