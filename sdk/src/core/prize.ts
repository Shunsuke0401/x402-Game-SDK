/**
 * Calculates the prize for a given player based on the simplified formula:
 * Prize = 0.70 × EntryFees × (PlayerScore / SumTotalScores) + 0.25 × EntryFees × BonusWeight(rank)
 */
export interface ComputePrizeParams {
    entryFeesUSDC: number;
    playerScore: number;
    sumTotalScores: number;
    rank: number; // 1-based rank
    topCount: number; // Number of players in the high score pool (usually top 3 get bonuses)
}

export function highScoreWeight(rank: number, topCount: number): number {
    // Dynamic high-score pool distribution
    // 1 player: 100%
    // 2 players: 70% / 30%
    // 3+ players: 60% / 25% / 15%

    if (rank > topCount) return 0;
    if (rank > 3) return 0; // Only top 3 get bonuses in this model

    if (topCount === 1) {
        return rank === 1 ? 1.0 : 0;
    } else if (topCount === 2) {
        if (rank === 1) return 0.70;
        if (rank === 2) return 0.30;
        return 0;
    } else {
        // 3 or more
        if (rank === 1) return 0.60;
        if (rank === 2) return 0.25;
        if (rank === 3) return 0.15;
        return 0;
    }
}

export function computePrize({
    entryFeesUSDC,
    playerScore,
    sumTotalScores,
    rank,
    topCount
}: ComputePrizeParams): number {
    if (entryFeesUSDC <= 0) return 0;

    const poolTotal = entryFeesUSDC * 0.70;
    const poolHigh = entryFeesUSDC * 0.25;
    // Remaining 5% is treasury

    let totalShare = 0;
    if (sumTotalScores > 0) {
        totalShare = (playerScore / sumTotalScores) * poolTotal;
    }

    let highShare = 0;
    const weight = highScoreWeight(rank, topCount);
    if (weight > 0) {
        highShare = poolHigh * weight;
    }

    return totalShare + highShare;
}
