export interface Player {
    id: string;
    username: string;
    walletAddress?: string;
}

export interface GameSession {
    id: string;
    isPaid: boolean;
    createdAt: Date;
    paidAt?: Date;
    wallet?: string;
    scoreSubmitted?: boolean;
}

export interface SessionStore {
    createSession(id: string): Promise<void>;
    markAsPaid(id: string, wallet?: string): Promise<void>;
    getSession(id: string): Promise<GameSession | null>;
    markScoreSubmitted(id: string): Promise<void>;
}

export interface LeaderboardEntry {
    rank: number;
    wallet: string;
    username?: string;
    score: number;
    gamesPlayed: number;
    lastPlayed: number;
}

export interface LeaderboardData {
    entries: LeaderboardEntry[];
    totalPlayers: number;
    lastUpdated: Date;
    type: 'total' | 'high';
}

export interface PlayerStats {
    wallet: string;
    totalScore: number;
    highScore: number;
    gamesPlayed: number;
    lastPlayed: number;
}

export interface SdkConfig {
    entryFeeUSDC: string;
    cdpNetwork: 'base' | 'base-sepolia';
    cdpRecipientAddress: string;
    facilitatorUrl: string;
    corsOrigins: string[];
    payoutIntervalMs: number;
    prizePoolContract?: string;
    treasuryAddress?: string;
    enableOnchainPayouts: boolean;
    cdpApiKeyId?: string;
    cdpApiKeySecret?: string;
    baseRpcUrl?: string;
    privateKey?: string;
}
