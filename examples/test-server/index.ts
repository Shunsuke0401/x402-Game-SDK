import express from 'express';
import cors from 'cors';
import { createPaymentRouter, createLeaderboardRoutes } from '@x402/sdk/server';
import { loadConfig } from '@x402/sdk/core';
import { SdkConfig, LeaderboardData, PlayerStats } from '@x402/sdk/core';
import { LeaderboardStore } from '@x402/sdk/server';

const app = express();
const PORT = 3001;

// Mock Store for testing
const mockStore: LeaderboardStore = {
    async getDailyLeaderboard(type: 'total' | 'high', limit?: number): Promise<LeaderboardData> {
        return {
            entries: [
                { rank: 1, wallet: '0x123...abc', score: 100, gamesPlayed: 5, lastPlayed: Date.now() },
                { rank: 2, wallet: '0x456...def', score: 80, gamesPlayed: 3, lastPlayed: Date.now() }
            ],
            totalPlayers: 2,
            lastUpdated: new Date(),
            type
        };
    },
    async getPlayerStats(wallet: string): Promise<PlayerStats | null> {
        return { wallet, totalScore: 100, highScore: 50, gamesPlayed: 5, lastPlayed: Date.now() };
    },
    async getDailyPlayerStats(wallet: string): Promise<PlayerStats | null> {
        return { wallet, totalScore: 20, highScore: 10, gamesPlayed: 1, lastPlayed: Date.now() };
    }
};

// Load config (mocking env for test if not present)
process.env.ENTRY_FEE_USDC = '0.001';
process.env.CDP_NETWORK = 'base-sepolia';
process.env.CDP_RECIPIENT_ADDRESS = '0x1234567890123456789012345678901234567890'; // Dummy address
process.env.FACILITATOR_URL = 'https://x402.org/facilitator';

const config = loadConfig();

app.use(cors());
app.use(express.json());

// Mount SDK routes
console.log('Mounting payment router...');
app.use('/api', createPaymentRouter(config));

console.log('Mounting leaderboard routes...');
app.use('/api', createLeaderboardRoutes(mockStore));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
    console.log(`✅ Test server running on http://localhost:${PORT}`);
    console.log(`   - Health: http://localhost:${PORT}/health`);
    console.log(`   - Leaderboard: http://localhost:${PORT}/api/leaderboard/daily/total`);
    console.log(`   - Join (POST): http://localhost:${PORT}/api/join`);
});
