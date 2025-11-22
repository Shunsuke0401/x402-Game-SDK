import React, { useEffect, useState } from 'react';
import { LeaderboardData } from '../core/types';

export interface LeaderboardProps {
    apiBaseUrl: string;
    refreshIntervalMs?: number;
    className?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
    apiBaseUrl,
    refreshIntervalMs = 60000,
    className
}) => {
    const [totalData, setTotalData] = useState<LeaderboardData | null>(null);
    const [highData, setHighData] = useState<LeaderboardData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const baseUrl = apiBaseUrl.replace(/\/+$/, '');
            const [totalRes, highRes] = await Promise.all([
                fetch(`${baseUrl}/leaderboard/daily/total`),
                fetch(`${baseUrl}/leaderboard/daily/high`)
            ]);

            if (totalRes.ok) setTotalData(await totalRes.json());
            if (highRes.ok) setHighData(await highRes.json());
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        if (refreshIntervalMs > 0) {
            const interval = setInterval(fetchData, refreshIntervalMs);
            return () => clearInterval(interval);
        }
    }, [apiBaseUrl, refreshIntervalMs]);

    if (loading) {
        return <div className={className}>Loading leaderboard...</div>;
    }

    return (
        <div className={`x402-leaderboard ${className || ''}`} style={{ fontFamily: 'sans-serif' }}>
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                <h3 style={{ marginTop: 0 }}>Prize Formula</h3>
                <p style={{ fontSize: '14px', color: '#555' }}>
                    <strong>Prize</strong> = 0.70 × Fees × (Score / TotalScores) + 0.25 × Fees × Bonus(rank)
                </p>
                <p style={{ fontSize: '12px', color: '#777', margin: 0 }}>
                    Bonus Weights: 1st=60%, 2nd=25%, 3rd=15% (of the 25% pool).
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                    <h4>Total Score Leaders</h4>
                    {totalData?.entries.length === 0 ? (
                        <p>No entries yet today.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                                    <th style={{ padding: '8px' }}>Rank</th>
                                    <th style={{ padding: '8px' }}>Player</th>
                                    <th style={{ padding: '8px' }}>Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {totalData?.entries.slice(0, 10).map((entry) => (
                                    <tr key={entry.wallet} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                        <td style={{ padding: '8px' }}>#{entry.rank}</td>
                                        <td style={{ padding: '8px' }} title={entry.wallet}>
                                            {entry.wallet.slice(0, 6)}...{entry.wallet.slice(-4)}
                                        </td>
                                        <td style={{ padding: '8px' }}>{entry.score.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div>
                    <h4>High Score Leaders</h4>
                    {highData?.entries.length === 0 ? (
                        <p>No entries yet today.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                                    <th style={{ padding: '8px' }}>Rank</th>
                                    <th style={{ padding: '8px' }}>Player</th>
                                    <th style={{ padding: '8px' }}>High Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {highData?.entries.slice(0, 10).map((entry) => (
                                    <tr key={entry.wallet} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                        <td style={{ padding: '8px' }}>#{entry.rank}</td>
                                        <td style={{ padding: '8px' }} title={entry.wallet}>
                                            {entry.wallet.slice(0, 6)}...{entry.wallet.slice(-4)}
                                        </td>
                                        <td style={{ padding: '8px' }}>{entry.score.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};
