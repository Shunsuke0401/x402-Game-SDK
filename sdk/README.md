# g402

The official SDK for adding x402 payments, leaderboards, and prize pools to any game.

## Features

- **Turnkey Payments**: Add "Pay to Play" functionality with a single line of code using `x402-express` and `x402-fetch`.
- **Leaderboards**: Built-in daily leaderboard routes and React components.
- **Prize Pools**: Configurable prize distribution logic (70% pool, 25% high score, 5% treasury).
- **Wallet Connection**: Deduplicated wallet connectors with a preference for MetaMask.

## Installation

```bash
pnpm add g402
```

## Quick Start

### Server (Express)

```typescript
import express from 'express';
import { createPaymentRouter, createLeaderboardRoutes, loadConfig } from 'g402/server';

const app = express();
const config = loadConfig(); // Reads from process.env

// Mount payment routes (POST /api/join)
app.use('/api', createPaymentRouter(config));

// Mount leaderboard routes
// You need to implement a simple store or use an in-memory one for testing
const store = {
  async getDailyLeaderboard(type) { return { entries: [], totalPlayers: 0, lastUpdated: new Date(), type }; },
  async getPlayerStats(wallet) { return null; },
  async getDailyPlayerStats(wallet) { return null; }
};
app.use('/api', createLeaderboardRoutes(store));

app.listen(3000, () => console.log('Server running on port 3000'));
```

### Client (React)

```tsx
import { ConnectWalletButton, PayToPlayButton, Leaderboard } from 'g402/react';

function App() {
  return (
    <div>
      <ConnectWalletButton />
      
      <PayToPlayButton 
        apiBaseUrl="http://localhost:3000/api"
        onJoined={(sessionId) => console.log('Joined!', sessionId)}
        entryFeeUSDC="0.001"
      />
      
      <Leaderboard apiBaseUrl="http://localhost:3000/api" />
    </div>
  );
}
```

## Configuration

Create a `.env` file in your project root:

```env
ENTRY_FEE_USDC=0.001
CDP_NETWORK=base-sepolia
CDP_RECIPIENT_ADDRESS=0x...
FACILITATOR_URL=https://x402.org/facilitator
CORS_ORIGINS=http://localhost:5173
```


## Security & Anti-Bot

## Security & Anti-Bot

The SDK provides built-in tools to help secure your game.

### 1. Rate Limiting
Prevent spam by rate-limiting your API endpoints using the built-in helper.

```typescript
import { createRateLimiter } from 'g402/server';

// Limit to 100 requests per 15 minutes
app.use('/api/', createRateLimiter());
```

### 2. Session Validation
Ensure that a score can only be submitted once per paid session.

1. Implement the `SessionStore` interface (or use a database adapter).
2. Pass the store to `createPaymentRouter` to track new sessions.
3. Use `verifySession` middleware to protect your score submission endpoint.

```typescript
import { createPaymentRouter, verifySession, SessionStore } from 'g402/server';

// Example in-memory store (use a real DB in production)
const sessions = new Map();
const sessionStore: SessionStore = {
    async createSession(id) { sessions.set(id, { id, isPaid: false, createdAt: new Date() }); },
    async markAsPaid(id) { const s = sessions.get(id); if(s) s.isPaid = true; },
    async getSession(id) { return sessions.get(id) || null; },
    async markScoreSubmitted(id) { const s = sessions.get(id); if(s) s.scoreSubmitted = true; }
};

// 1. Mount payment router with store
app.use('/api', createPaymentRouter(config, sessionStore));

// 2. Protect score submission
app.post('/api/submit-score', verifySession(sessionStore), async (req, res) => {
    const { sessionId, score } = req.body;
    
    // Session is already verified and attached to req.gameSession
    // Save score logic here...
    
    // Mark session as used
    await sessionStore.markScoreSubmitted(sessionId);
    
    res.json({ success: true });
});
```

## Examples

Check the `examples/` directory in the repository for working examples.
- **test-server**: A minimal Express server using the SDK.

## License

MIT
