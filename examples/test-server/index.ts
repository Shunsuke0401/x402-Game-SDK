import express from 'express';
import cors from 'cors';
import { createPaymentRouter, createLeaderboardRoutes } from 'g402/server';
import { loadConfig } from 'g402/core';
import { SdkConfig, LeaderboardData, PlayerStats } from 'g402/core';
import { LeaderboardStore } from 'g402/server';

const app = express();
const PORT = 3001;

// In-memory Store for testing
const db = {
    players: new Map<string, PlayerStats>(),
    entries: [] as { wallet: string, score: number, timestamp: number }[]
};

const store: LeaderboardStore = {
    async getDailyLeaderboard(type: 'total' | 'high', limit?: number): Promise<LeaderboardData> {
        // Recompute leaderboard on the fly for testing
        const entries = Array.from(db.players.values())
            .map((stats, index) => ({
                rank: index + 1, // This rank calculation is naive, sorting needed
                wallet: stats.wallet,
                score: type === 'total' ? stats.totalScore : stats.highScore,
                gamesPlayed: stats.gamesPlayed,
                lastPlayed: stats.lastPlayed
            }))
            .sort((a, b) => b.score - a.score)
            .map((entry, index) => ({ ...entry, rank: index + 1 }));

        return {
            entries: entries.slice(0, limit || 10),
            totalPlayers: entries.length,
            lastUpdated: new Date(),
            type
        };
    },
    async getPlayerStats(wallet: string): Promise<PlayerStats | null> {
        return db.players.get(wallet) || null;
    },
    async getDailyPlayerStats(wallet: string): Promise<PlayerStats | null> {
        return db.players.get(wallet) || null;
    }
};

// Load config (mocking env for test if not present)
// Note: If you have a .env file, dotenv (loaded by loadConfig or manually) will populate process.env
// We only set these defaults if they are NOT already set.
process.env.ENTRY_FEE_USDC = process.env.ENTRY_FEE_USDC || '0.001';
process.env.CDP_NETWORK = process.env.CDP_NETWORK || 'base-sepolia';
process.env.CDP_RECIPIENT_ADDRESS = process.env.CDP_RECIPIENT_ADDRESS || '0x1234567890123456789012345678901234567890'; // Dummy address
process.env.FACILITATOR_URL = process.env.FACILITATOR_URL || 'https://x402.org/facilitator';

const config = loadConfig();

app.use(cors());
app.use(express.json());

// Mount SDK routes
console.log('Mounting payment router...');
app.use('/api', createPaymentRouter(config));

console.log('Mounting leaderboard routes...');
app.use('/api', createLeaderboardRoutes(store));

// Helper to submit score (for testing)
app.post('/api/submit-score', (req, res) => {
    const { wallet, score } = req.body;
    if (!wallet || typeof score !== 'number') {
        return res.status(400).json({ error: 'Invalid input' });
    }

    const current = db.players.get(wallet) || {
        wallet,
        totalScore: 0,
        highScore: 0,
        gamesPlayed: 0,
        lastPlayed: 0
    };

    current.totalScore += score;
    current.highScore = Math.max(current.highScore, score);
    current.gamesPlayed += 1;
    current.lastPlayed = Date.now();

    db.players.set(wallet, current);
    db.entries.push({ wallet, score, timestamp: Date.now() });

    res.json({ success: true, stats: current });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
    console.log(`✅ Test server running on http://localhost:${PORT}`);
    console.log(`   - Health: http://localhost:${PORT}/health`);
    console.log(`   - Leaderboard: http://localhost:${PORT}/api/leaderboard/daily/total`);
    console.log(`   - Join (POST): http://localhost:${PORT}/api/join`);
});
