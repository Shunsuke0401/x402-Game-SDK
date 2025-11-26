# Snake402 Production Deployment Guide

## 🚨 Important Security Notice

This application handles real USDC transactions on Base Mainnet. Follow all security guidelines carefully.

## Prerequisites

1. **Production Coinbase Developer Platform Account**
   - Create account at https://portal.cdp.coinbase.com/
   - Generate production API keys
   - Verify your identity and complete KYC if required

2. **Secure Wallet Setup**
   - Treasury wallet: Secure multisig or hardware wallet for receiving payments
   - Facilitator wallet: Dedicated operational wallet with minimal funds

3. **Infrastructure Requirements**
   - HTTPS-enabled domain
   - SSL certificate
   - Reverse proxy (nginx, Cloudflare, etc.)
   - Process manager (PM2, systemd, etc.)

## Environment Configuration

1. **Copy the production template:**
```bash
cp .env.production.template .env
```

2. **Fill in production values:**
- `CDP_API_KEY_ID`: Your production CDP API key ID
- `CDP_API_KEY_SECRET`: Your production CDP API key secret
- `CDP_RECIPIENT_ADDRESS`: Your secure treasury wallet address
- `PRIVATE_KEY`: Dedicated facilitator wallet private key
- `SANDBOX_MODE`: Set to `false` for real transactions
 - `PRIZE_POOL_CONTRACT`: Deployed PrizePool address (see Remix section)
 - `USDC_CONTRACT`: Base USDC token address (mainnet: `0x833589fCD6EDB6E08f4c7d8b9A55B41C89d5bE1E`)
 - `TREASURY_ADDRESS`: Your treasury wallet address
 - `ENABLE_ONCHAIN_PAYOUTS`: `true` to call endCycle on-chain
 - `BASE_RPC_URL`: Base JSON-RPC endpoint (e.g., `https://mainnet.base.org`)
 - `BASE_WS_URL` (optional): Base WebSocket endpoint for live events

## Build and Deploy

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Build the application:**
   ```bash
   pnpm build
   ```

3. **Start production server:**
   ```bash
pnpm start
   ```

## Vercel (Frontend)

Deploy the `client` app to Vercel from your public repository.

- Project root: `client`
- Build command:
  ```bash
  pnpm install --frozen-lockfile && pnpm --filter client build
  ```
- Output directory: `dist`
- Node version: `20`
- Environment Variables:
  - `VITE_API_BASE_URL`: `https://<your-backend-host>`

Notes:
- The client now reads `VITE_API_BASE_URL` (no trailing slash) and appends `/api` where needed.
- On push to the public repo, Vercel will auto-redeploy.

## Render (Backend)

Create a Render Web Service pointing to your public repository. Render supports monorepos.

- Root repository: your public GitHub repo
- Service settings:
  - **Build Command:**
    ```bash
    pnpm install --frozen-lockfile && pnpm --filter server build
    ```
  - **Start Command:**
    ```bash
    pnpm --filter server start
    ```
  - **Node Version:** `20`
  - **Environment Variables:**
    - `PORT=3001` (or use Render's assigned port via `$PORT`)
    - `CDP_NETWORK` = `base` (mainnet) or `base-sepolia` (testnet)
    - `ENTRY_FEE_USDC` (e.g., `0.001`)
    - `SANDBOX_MODE` = `true` for testing, `false` for production
    - `ADMIN_TOKEN` = strong random string
    - `CORS_ORIGINS` = `https://<your-vercel-app>.vercel.app,https://<your-domain>`
    - `PRIZE_POOL_CONTRACT` (if using on-chain payouts)
    - `TREASURY_ADDRESS`
    - `USDC_CONTRACT`
    - `ENABLE_ONCHAIN_PAYOUTS` = `true|false`
    - `ENABLE_SSE_PAYOUTS` = `true|false`
    - `BASE_RPC_URL` (e.g., `https://mainnet.base.org` or provider URL)
    - `BASE_WS_URL` (optional, for event listening)

### Render Notes
- Ensure HTTPS is enabled (Render provides TLS).
- Update `CORS_ORIGINS` to match Vercel domains exactly.
- Admin endpoints (`/admin/*`) require `ADMIN_TOKEN`.

## Syncing Private → Public Repo

If you develop in a private repo and publish snapshots:

```bash
# From private repo root
git archive --format=tar HEAD | tar -x -C ../snake402-public
cd ../snake402-public
git add -A && git commit -m "Sync from private: YYYY-MM-DD" && git push
```

Deployments (Vercel/Render) will update automatically on push.

## Post-Deploy Checklist
- `VITE_API_BASE_URL` set on Vercel
- Backend env vars set on Render (including `ADMIN_TOKEN` and `CORS_ORIGINS`)
- Client can call:
  - `GET /api` for network info
  - `POST /api/join` (402 flow)
  - Leaderboards and SSE under `/leaderboard/*` and `/events/payouts`
- Verify admin token blocks unauthorized requests
- Confirm HTTPS and CORS behavior

## Smart Contract Requirements

The SDK requires a Prize Pool smart contract deployed on Base (Mainnet or Sepolia) with the following interface:

### Required Contract Functions

Your contract **must** implement these functions for the SDK to work properly:

```solidity
// Read-only functions
function owner() external view returns (address);
function usdc() external view returns (address);
function treasury() external view returns (address);

// State-changing functions (owner-only)
function endCycle(address[] calldata winners, uint256[] calldata rewards) external;
function deposit(uint256 amount) external;
function setTreasury(address _treasury) external;
function withdrawTo(address recipient, uint256 amount) external;
function withdrawTreasury(uint256 amount) external;
```

### Contract Setup

1. **Deploy your Prize Pool contract** to Base Mainnet or Base Sepolia
   - You can use any deployment method (Hardhat, Foundry, Remix, etc.)
   - The contract must accept USDC address and treasury address in the constructor
   - Example: `constructor(address _usdc, address _treasury)`

2. **Configure your `.env` file:**
   ```bash
   # Network Configuration
   CDP_NETWORK=base                    # or 'base-sepolia' for testnet
   BASE_RPC_URL=https://mainnet.base.org  # or your RPC provider URL
   
   # Contract Addresses
   PRIZE_POOL_CONTRACT=0xYourDeployedContractAddress
   TREASURY_ADDRESS=0xYourTreasuryWalletAddress
   
   # Payout Configuration
   ENABLE_ONCHAIN_PAYOUTS=true
   PRIVATE_KEY=0xYourPrivateKey      # Must be the contract owner's private key
   PAYOUT_INTERVAL_MS=86400000       # 24 hours in milliseconds
   ```

3. **Important Requirements:**
   - The `PRIVATE_KEY` wallet **must be the contract owner** (the address that deployed it)
   - The wallet needs ETH on Base Mainnet/Sepolia for gas fees
   - The contract needs USDC balance to distribute payouts
   - Set `CDP_RECIPIENT_ADDRESS` to your Prize Pool contract address so entry fees go to the contract

### Verification

After deployment, verify your setup:

1. **Check contract on BaseScan:**
   - Mainnet: `https://basescan.org/address/0xYourContractAddress`
   - Sepolia: `https://sepolia.basescan.org/address/0xYourContractAddress`

2. **Verify ownership:**
   ```bash
   # The owner() function should return your wallet address
   # You can check this on BaseScan's "Read Contract" tab
   ```

3. **Test the payout trigger:**
   - Start your server
   - Submit some test scores
   - Click "Trigger Payout Cycle" in the admin panel
   - Check the server logs for transaction hash
   - Verify the transaction on BaseScan

### Contract Reference

A reference implementation is available in `sdk/src/contracts/index.ts` which exports the `PRIZE_POOL_ABI`. Your contract should match this interface.

## HTTPS Configuration

**Critical:** The application MUST run over HTTPS in production for security.

### Option 1: Reverse Proxy (Recommended)
Configure nginx or similar to handle SSL termination:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Option 2: Cloudflare
Use Cloudflare's SSL/TLS encryption for easy HTTPS setup.

## Security Checklist

- [ ] Production API keys configured
- [ ] Treasury wallet is secure (multisig/hardware)
- [ ] Facilitator wallet has minimal funds
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] `.env` file not committed to git
- [ ] Server monitoring enabled
- [ ] Transaction alerts configured
- [ ] Backup and recovery plan in place

## Monitoring and Alerts

1. **Transaction Monitoring:**
   - Monitor treasury wallet for incoming payments
   - Set up alerts for unusual transaction patterns
   - Log all payment verifications

2. **Server Monitoring:**
   - Monitor server health and uptime
   - Track API response times
   - Monitor error rates

3. **Security Monitoring:**
   - Monitor for failed authentication attempts
   - Track unusual API usage patterns
   - Set up alerts for high-value transactions

## Testing Before Production

1. **Testnet Verification:**
   ```bash
   # Use .env.development for testnet testing
   cp .env.development .env
   pnpm dev
   ```

2. **Production Dry Run:**
   ```bash
   # Set SANDBOX_MODE=true in production .env
   SANDBOX_MODE=true
   pnpm start
   ```

3. **Small Transaction Test:**
   - Start with minimal entry fee
   - Test with small amounts first
   - Verify all payment flows work correctly

## Troubleshooting

### Common Issues:

1. **Payment Verification Fails:**
   - Check network connectivity to Base RPC
   - Verify transaction hash format
   - Check recipient address matches

2. **API Key Issues:**
   - Verify API keys are for production environment
   - Check API key permissions
   - Ensure keys are properly formatted

3. **Network Issues:**
   - Confirm `CDP_NETWORK=base` for mainnet
   - Check RPC endpoint connectivity
   - Verify chain ID matches Base Mainnet (8453)

## Support

For technical issues:
1. Check server logs for error details
2. Verify all environment variables are set correctly
3. Test network connectivity to Base Mainnet
4. Review Coinbase Developer Platform documentation

## Emergency Procedures

If you need to stop the service immediately:
1. Stop the server process
2. Set `SANDBOX_MODE=true` to prevent real transactions
3. Investigate the issue before restarting
4. Consider temporarily redirecting traffic if needed