# @x402/sdk

The official SDK for adding x402 payments, leaderboards, and prize pools to any game.

## Features

- **Turnkey Payments**: Add "Pay to Play" functionality with a single line of code using `x402-express` and `x402-fetch`.
- **Leaderboards**: Built-in daily leaderboard routes and React components.
- **Prize Pools**: Configurable prize distribution logic (70% pool, 25% high score, 5% treasury).
- **Wallet Connection**: Deduplicated wallet connectors with a preference for MetaMask.

## Installation

```bash
pnpm add @x402/sdk
```

## Quick Start

### Server (Express)

```typescript
import express from 'express';
import { createPaymentRouter, createLeaderboardRoutes, loadConfig } from '@x402/sdk/server';

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
import { ConnectWalletButton, PayToPlayButton, Leaderboard } from '@x402/sdk/react';

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

## License

MIT
