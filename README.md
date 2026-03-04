# ⚔️ Telegram Mini Battle Game

A professional, feature-rich turn-based RPG bot for Telegram. This project demonstrates modular architecture, database persistence, and a polished user experience using the Telegraf framework and PostgreSQL.

## 🚀 Features

### 🛡️ Multi-Character System
- Create and manage up to **3 unique heroes** per account.
- Unlock up to **5 slots** by progressing through the Battle Pass.
- Custom naming and class selection (**Warrior**, **Mage**, **Archer**).

### ⚔️ Battle System
- Turn-based combat engine with randomized damage.
- Real-time **HP Progress Bars** for heroes and enemies.
- Strategic **Retreat** option.
- XP reward system and automatic Level Ups.

### 🔋 Energy & Cooldowns
- Battles consume **10 Energy**.
- Automatic energy recovery (**1 point every 3 minutes**).
- Fair cooldown mechanics to prevent spamming.

### 🎒 Inventory Management
- Item storage system linked to specific heroes.
- **Potions**: Restore +20 HP instantly.
- Modular item handling for easy expansion.

### 👑 Management & Admin & Log System 
- type MTpanel manually to open it
- type ANpanel manually to open it
- type LGpanel manually to open it

### 🏆 Global Progression
- **Leaderboard**: See the top 10 heroes across the entire game.
- **Battle Pass**: Earn BP XP from victories to unlock account-wide rewards.

## 🛠️ Tech Stack
- **Runtime**: Node.js
- **Framework**: [Telegraf](https://telegraf.js.org/) (Telegram Bot API)
- **Database**: PostgreSQL
- **Persistence**: `pg` client with connection pooling
- **Architecture**: Modular handler-based structure

## 📁 Project Structure
```text
src/
├── bot/            # Bot entry point & middleware
├── commands/       # Slash command handlers (/start)
├── handlers/       # Modular action handlers (Battle, Inv, etc.)
├── models/         # Database models (User, Inventory, Profile)
├── services/       # DB connection & initialization
└── utils/          # Global helpers (RNG, Progress Bars)
```

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v16+)
- PostgreSQL Database
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
BOT_TOKEN=your_telegram_bot_token
DATABASE_URL=postgres://user:password@localhost:5432/dbname
PORT=3000
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Bot
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

## 🎮 How to Play
1. Send `/start` to the bot.
2. Create your first hero.
3. Open the **Hero Profile** and start a **Battle**.
4. Use **Potions** from your **Inventory** if your HP is low.
5. Check the **Leaderboard** and level up your **Battle Pass**!

---
*Built with ❤️ for the community.*