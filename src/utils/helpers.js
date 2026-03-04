
function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


function getProgressBar(current, max, length = 10) {
    const percent = Math.min(1, Math.max(0, current / max));
    const filledLength = Math.round(length * percent);
    const emptyLength = length - filledLength;

    const filled = '█'.repeat(filledLength);
    const empty = '░'.repeat(emptyLength);

    return `[${filled}${empty}] ${Math.round(percent * 100)}%`;
}


const CLASS_MODIFIERS = {
    Warrior: { hpBonus: 20, dmgBonus: 0 },
    Mage: { hpBonus: 0, dmgBonus: 1.2 },
    Archer: { hpBonus: 5, dmgBonus: 1.1 }
};

module.exports = {
    randomRange,
    getProgressBar,
    CLASS_MODIFIERS
};
