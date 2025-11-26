import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectWalletButton, PayToPlayButton, Leaderboard } from '@mark_nakatani/g402/react'

function App() {
    const [sessionId, setSessionId] = useState<string | null>(null)
    const { address } = useAccount()
    const API_BASE_URL = 'http://localhost:3001/api'

    const submitScore = async () => {
        if (!address) return alert('No wallet connected')

        const score = Math.floor(Math.random() * 100) + 1
        try {
            const res = await fetch(`${API_BASE_URL}/submit-score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet: address, score })
            })
            if (res.ok) {
                alert(`Submitted score: ${score}! Refreshing leaderboard...`)
                // In a real app, we'd trigger a refetch on the Leaderboard component
                // For now, the user can just wait for the auto-refresh or reload
                window.location.reload()
            } else {
                alert('Failed to submit score')
            }
        } catch (e) {
            console.error(e)
            alert('Error submitting score')
        }
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1>g402 SDK Demo</h1>
                <ConnectWalletButton />
            </header>

            <main>
                <section style={{ marginBottom: '40px', padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
                    <h2>1. Pay to Play</h2>
                    <p>Click below to simulate a payment and join the game session.</p>

                    <PayToPlayButton
                        apiBaseUrl={API_BASE_URL}
                        onJoined={(sid) => setSessionId(sid)}
                        entryFeeUSDC="0.001"
                        style={{ padding: '12px 24px', fontSize: '16px', cursor: 'pointer' }}
                    />

                    {sessionId && (
                        <div style={{ marginTop: '10px', padding: '10px', background: '#e6fffa', color: '#006666', borderRadius: '4px' }}>
                            ✅ Joined! Session ID: {sessionId}
                            <div style={{ marginTop: '10px' }}>
                                <button
                                    onClick={submitScore}
                                    style={{ padding: '8px 16px', cursor: 'pointer', background: '#006666', color: 'white', border: 'none', borderRadius: '4px' }}
                                >
                                    Submit Random Score
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                <section>
                    <h2>2. Leaderboard</h2>
                    <Leaderboard apiBaseUrl={API_BASE_URL} />
                </section>

                <section style={{ marginTop: '40px', padding: '20px', border: '1px solid #eee', borderRadius: '8px', background: '#f9f9f9' }}>
                    <h2>3. Admin / Payouts</h2>
                    <p>Trigger the payout cycle manually (requires server env configuration).</p>
                    <button
                        onClick={async () => {
                            try {
                                const res = await fetch(`${API_BASE_URL}/payout/trigger`, { method: 'POST' });
                                const data = await res.json();
                                alert(JSON.stringify(data, null, 2));
                            } catch (e) {
                                alert('Error triggering payout: ' + e);
                            }
                        }}
                        style={{ padding: '12px 24px', fontSize: '16px', cursor: 'pointer', background: '#333', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                        Trigger Payout Cycle
                    </button>
                </section>
            </main>
        </div>
    )
}

export default App
