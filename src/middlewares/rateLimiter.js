const userCooldowns = new Map();

const RATE_LIMIT_MS = 1000; // 1 second between commands

module.exports = async (ctx, next) => {
    if (!ctx.from) return next();

    const userId = ctx.from.id;
    const now = Date.now();

    if (userCooldowns.has(userId)) {
        const lastAction = userCooldowns.get(userId);
        if (now - lastAction < RATE_LIMIT_MS) {
            if (ctx.updateType === 'callback_query') {
                return ctx.answerCbQuery('⚡ Slow down! Stop spamming.', { show_alert: true });
            }
            return;
        }
    }

    userCooldowns.set(userId, now);
    return next();
};
