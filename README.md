# g402

[![npm version](https://img.shields.io/npm/v/@mark_nakatani/g402.svg)](https://www.npmjs.com/package/@mark_nakatani/g402)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/@mark_nakatani/g402.svg)](https://www.npmjs.com/package/@mark_nakatani/g402)

The official SDK for adding x402 payments, leaderboards, and prize pools to any game.

## Features

- **Turnkey Payments**: Add "Pay to Play" functionality with a single line of code using `x402-express` and `x402-fetch`
- **Leaderboards**: Built-in daily leaderboard routes and React components
- **Prize Pools**: Configurable prize distribution logic with automatic on-chain payouts
- **Wallet Connection**: Deduplicated wallet connectors with a preference for MetaMask
- **Security**: Built-in rate limiting, session validation, and anti-bot protection
- **Flexible Payout Logic**: Customize prize distribution with your own payout strategies

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Server Setup](#server-setup)
- [Client Setup](#client-setup)
- [Security & Anti-Bot](#security--anti-bot)
- [Advanced Topics](#advanced-topics)
- [Development](#development)
- [License](#license)

## Installation

Install the SDK in your project:

```bash
npm install @mark_nakatani/g402
# or
pnpm add @mark_nakatani/g402
# or
yarn add @mark_nakatani/g402
```

## Quick Start

### Server (Express)

```typescript
import express from 'express';
import { createPaymentRouter, createLeaderboardRoutes, loadConfig } from '@mark_nakatani/g402/server';

const app = express();
const config = loadConfig(); // Reads from process.env

// Mount payment routes (POST /api/join)
app.use('/api', createPaymentRouter(config));

// Mount leaderboard routes
// You need to implement a simple store or use an in-memory one for testing
const store = {
  async getDailyLeaderboard(type) { 
    return { entries: [], totalPlayers: 0, lastUpdated: new Date(), type }; 
  },
  async getPlayerStats(wallet) { return null; },
  async getDailyPlayerStats(wallet) { return null; }
};
app.use('/api', createLeaderboardRoutes(store));

app.listen(3000, () => console.log('Server running on port 3000'));
```

### Client (React)

```tsx
import { ConnectWalletButton, PayToPlayButton, Leaderboard } from '@mark_nakatani/g402/react';

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

## Example App

Check out the **Tetris 402** sample application to see the SDK in action:
[Tetris 402 Repository](https://github.com/Shunsuke0401/g402-Tetris)

## Configuration

Create a `.env` file in your project root. You can use `.env.example` as a template:



## Server Setup

### Full Server Example with Database

```typescript
import express from 'express';
import cors from 'cors';
import { 
  createPaymentRouter, 
  createLeaderboardRoutes,
  createRateLimiter,
  verifySession,
  loadConfig,
  SessionStore,
  LeaderboardStore
} from '@mark_nakatani/g402/server';

const app = express();
const config = loadConfig();

// Middleware
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());

// Rate limiting (100 requests per 15 minutes)
app.use('/api/', createRateLimiter());

// Implement stores (use a real database in production)
const sessions = new Map();
const sessionStore: SessionStore = {
  async createSession(id) { 
    sessions.set(id, { id, isPaid: false, createdAt: new Date() }); 
  },
  async markAsPaid(id) { 
    const s = sessions.get(id); 
    if(s) s.isPaid = true; 
  },
  async getSession(id) { 
    return sessions.get(id) || null; 
  },
  async markScoreSubmitted(id) { 
    const s = sessions.get(id); 
    if(s) s.scoreSubmitted = true; 
  }
};

const leaderboardStore: LeaderboardStore = {
  async getDailyLeaderboard(type) {
    // Implement your database query here
    return { entries: [], totalPlayers: 0, lastUpdated: new Date(), type };
  },
  async getPlayerStats(wallet) {
    // Implement your database query here
    return null;
  },
  async getDailyPlayerStats(wallet) {
    // Implement your database query here
    return null;
  }
};

// Mount routes
app.use('/api', createPaymentRouter(config, sessionStore));
app.use('/api', createLeaderboardRoutes(leaderboardStore));

// Protected score submission endpoint
app.post('/api/submit-score', verifySession(sessionStore), async (req, res) => {
  const { sessionId, score } = req.body;
  
  // Session is already verified and attached to req.gameSession
  // Save score logic here...
  
  // Mark session as used
  await sessionStore.markScoreSubmitted(sessionId);
  
  res.json({ success: true });
});

const PORT = config.port || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Client Setup

### React with Wagmi Configuration

```tsx
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectWalletButton, PayToPlayButton, Leaderboard } from '@mark_nakatani/g402/react';

// Configure Wagmi
const config = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  const handleJoined = (newSessionId: string) => {
    setSessionId(newSessionId);
    setGameStarted(true);
    console.log('Game session started:', newSessionId);
  };

  const handleGameOver = async (score: number) => {
    if (!sessionId) return;

    try {
      const response = await fetch('http://localhost:3001/api/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, score }),
      });

      if (response.ok) {
        console.log('Score submitted successfully');
        setGameStarted(false);
      }
    } catch (error) {
      console.error('Failed to submit score:', error);
    }
  };

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="app">
          <header>
            <h1>My Game</h1>
            <ConnectWalletButton />
          </header>

          <main>
            {!gameStarted ? (
              <PayToPlayButton
                apiBaseUrl="http://localhost:3001/api"
                onJoined={handleJoined}
                entryFeeUSDC="0.001"
              />
            ) : (
              <YourGameComponent onGameOver={handleGameOver} />
            )}

            <Leaderboard apiBaseUrl="http://localhost:3001/api" />
          </main>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

## Security & Anti-Bot

The SDK provides built-in tools to help secure your game.

### 1. Rate Limiting

Prevent spam by rate-limiting your API endpoints:

```typescript
import { createRateLimiter } from '@mark_nakatani/g402/server';

// Limit to 100 requests per 15 minutes
app.use('/api/', createRateLimiter());
```

### 2. Session Validation

Ensure that a score can only be submitted once per paid session:

```typescript
import { verifySession, SessionStore } from '@mark_nakatani/g402/server';

// Protect score submission endpoint
app.post('/api/submit-score', verifySession(sessionStore), async (req, res) => {
  const { sessionId, score } = req.body;
  
  // Session is already verified and attached to req.gameSession
  // The middleware ensures:
  // - Session exists
  // - Session is paid
  // - Score hasn't been submitted yet
  
  // Save score logic here...
  await sessionStore.markScoreSubmitted(sessionId);
  
  res.json({ success: true });
});
```

### 3. CORS Configuration

Restrict API access to specific domains:

```env
CORS_ORIGINS=https://yourgame.com,https://www.yourgame.com
```

### 4. Admin Token Protection

Secure admin endpoints with a token:

```env
ADMIN_TOKEN=your-very-secure-random-token
```

## Payout System

The SDK includes a `PayoutService` that automates the distribution of prize pools to leaderboard winners.

### PayoutService

The `PayoutService` runs as a background task (or can be triggered manually) to:
1.  Fetch the daily leaderboard.
2.  Calculate rewards based on a `PayoutStrategy`.
3.  Execute an on-chain transaction to the Prize Pool contract to distribute funds.

By default, it uses a strategy that distributes 0.001 USDC (configurable) to the top 3 players:
-   1st Place: 50%
-   2nd Place: 30%
-   3rd Place: 20%

You can customize this by providing your own `PayoutStrategy` implementation.

### Smart Contract Requirements

To use the automated payout system, you need a smart contract deployed on Base (or Base Sepolia) that adheres to the following interface:

1.  **Ownership**: The contract must have an `owner()` function. The wallet used by the `PayoutService` (configured via `PRIVATE_KEY`) must be the owner of the contract.
2.  **End Cycle Function**: The contract must implement an `endCycle` function to distribute rewards.

#### Required ABI Interface

```solidity
function owner() external view returns (address);
function endCycle(address[] calldata recipients, uint256[] calldata amounts) external;
```

#### Example Contract (`PrizePool.sol`)

A reference implementation is available in `contracts/PrizePool.sol`. It should handle:
-   Storing funds (USDC).
-   Verifying the caller is the owner.
-   Batch transferring tokens to the provided recipients.

**Note**: Ensure your `PRIZE_POOL_CONTRACT` address in `.env` points to a deployed instance of this contract, and your `PRIVATE_KEY` corresponds to the contract owner.

## Advanced Topics

### Custom Payout Strategies

You can implement custom payout distribution logic by creating a payout strategy:

```typescript
import { PayoutStrategy } from '@mark_nakatani/g402/server';

const customStrategy: PayoutStrategy = {
  async calculatePayouts(winners, totalPool) {
    // Example: 50%, 30%, 20% split
    return [
      { address: winners[0].wallet, amount: totalPool * 0.5 },
      { address: winners[1].wallet, amount: totalPool * 0.3 },
      { address: winners[2].wallet, amount: totalPool * 0.2 },
    ];
  }
};

// Use your custom strategy
const payoutService = new PayoutService(config, customStrategy);
```

### Database Integration

For production use, implement the stores with a real database:

```typescript
import { SessionStore, LeaderboardStore } from '@mark_nakatani/g402/server';
import { db } from './your-database';

const sessionStore: SessionStore = {
  async createSession(id) {
    await db.sessions.create({ id, isPaid: false, createdAt: new Date() });
  },
  async markAsPaid(id) {
    await db.sessions.update({ where: { id }, data: { isPaid: true } });
  },
  async getSession(id) {
    return await db.sessions.findUnique({ where: { id } });
  },
  async markScoreSubmitted(id) {
    await db.sessions.update({ where: { id }, data: { scoreSubmitted: true } });
  }
};
```

## Development

### Building the SDK

If you're contributing to the SDK itself:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/x402-game-sdk.git
   cd x402-game-sdk
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Build the SDK**:
   ```bash
   pnpm build
   ```

4. **Watch mode for development**:
   ```bash
   cd sdk
   pnpm dev
   ```

### Repository Structure

- `sdk/`: The source code for the `@mark_nakatani/g402` package
  - `src/core/`: Core configuration and types
  - `src/server/`: Server-side Express middleware and routes
  - `src/react/`: React components and hooks
  - `src/contracts/`: Contract ABIs and utilities
- `contracts/`: Reference Solidity contracts (PrizePool)

## Disclaimer
⚠️ **Disclaimer: Experimental Software**

This SDK is designed as a starter kit to help developers explore and implement Pay-to-Play and Play-to-Earn systems. Please be aware that this project is developed and maintained solely by Mark Nakatani.

While it provides a functional foundation, it does not guarantee production-grade security, concurrency handling, or financial safety. This software has not been audited. If you plan to handle real funds in a production environment, you should review and secure the code accordingly. Use at your own risk.

## License

MIT

---

For more information, visit [x402.org](https://x402.org) or open an issue on GitHub.
