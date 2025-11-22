import { Router } from 'express';
import { LeaderboardData, PlayerStats } from '../core/types';

export interface LeaderboardStore {
    getDailyLeaderboard(type: 'total' | 'high', limit?: number): Promise<LeaderboardData>;
    getPlayerStats(wallet: string): Promise<PlayerStats | null>;
    getDailyPlayerStats(wallet: string): Promise<PlayerStats | null>;
}

export function createLeaderboardRoutes(store: LeaderboardStore): Router {
    const router = Router();

    router.get('/leaderboard/daily/total', async (req, res) => {
        try {
            const data = await store.getDailyLeaderboard('total');
            res.json(data);
        } catch (error) {
            console.error('Error fetching total leaderboard:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get('/leaderboard/daily/high', async (req, res) => {
        try {
            const data = await store.getDailyLeaderboard('high');
            res.json(data);
        } catch (error) {
            console.error('Error fetching high score leaderboard:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get('/player/daily/:wallet', async (req, res) => {
        try {
            const { wallet } = req.params;
            const stats = await store.getDailyPlayerStats(wallet);
            res.json(stats || { wallet, totalScore: 0, highScore: 0, gamesPlayed: 0, lastPlayed: 0 });
        } catch (error) {
            console.error('Error fetching player stats:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
}
