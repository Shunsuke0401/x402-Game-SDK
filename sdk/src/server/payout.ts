import { createWalletClient, createPublicClient, http, parseEther, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';
import { SdkConfig, PayoutStrategy, PayoutDistribution, LeaderboardData } from '../core/types';
import { LeaderboardStore } from './leaderboard';
import { PRIZE_POOL_ABI } from '../contracts';

export class DefaultPayoutStrategy implements PayoutStrategy {
    async calculateDistribution(leaderboard: LeaderboardData, prizePoolAmount: bigint): Promise<PayoutDistribution> {
        const winners = leaderboard.entries.slice(0, 3); // Top 3
        const addresses = winners.map(w => w.wallet as `0x${string}`);

        const rewards = [
            (prizePoolAmount * 50n) / 100n,
            (prizePoolAmount * 30n) / 100n,
            (prizePoolAmount * 20n) / 100n
        ].slice(0, addresses.length);

        return { addresses, rewards };
    }
}

export class PayoutService {
    private config: SdkConfig;
    private store: LeaderboardStore;
    private strategy: PayoutStrategy;
    private intervalId?: NodeJS.Timeout;
    private isProcessing = false;

    constructor(config: SdkConfig, store: LeaderboardStore, strategy?: PayoutStrategy) {
        this.config = config;
        this.store = store;
        this.strategy = strategy || new DefaultPayoutStrategy();
    }

    // ... existing methods ...

    private async executePayout() {
        if (!this.config.prizePoolContract) {
            throw new Error('Missing PRIZE_POOL_CONTRACT');
        }

        // 1. Fetch Winners
        const leaderboard = await this.store.getDailyLeaderboard('total', 10);
        if (leaderboard.entries.length === 0) {
            console.log('ℹ️ No players to pay out.');
            return;
        }

        // Let's setup Viem clients
        let pk = this.config.privateKey;
        if (!pk) {
            console.error('❌ Private key is missing');
            return;
        }
        if (!pk.startsWith('0x')) {
            console.warn('⚠️ Private key missing 0x prefix, adding it.');
            pk = `0x${pk}`;
        }

        console.log(`DEBUG: Using private key: ${pk.slice(0, 6)}...${pk.slice(-4)}`);

        let account;
        try {
            account = privateKeyToAccount(pk as `0x${string}`);
        } catch (e) {
            console.error('❌ Failed to create account from private key:', e);
            return;
        }

        const chain = this.config.cdpNetwork === 'base' ? base : baseSepolia;

        const client = createPublicClient({
            chain,
            transport: http(this.config.baseRpcUrl)
        });

        const walletClient = createWalletClient({
            account,
            chain,
            transport: http(this.config.baseRpcUrl)
        });

        // Simple distribution: 50%, 30%, 20% of 0.001 USDC
        // 1 USDC = 1,000,000 units
        // 0.001 USDC = 1,000 units
        const prizePoolAmount = 1000n;

        const { addresses, rewards } = await this.strategy.calculateDistribution(leaderboard, prizePoolAmount);

        console.log('DEBUG: Rewards calculated:', rewards);

        if (addresses.length === 0) {
            console.log('DEBUG: No addresses, returning early');
            return;
        }

        console.log('DEBUG: Rewards calculated:', rewards);

        if (addresses.length === 0) {
            console.log('DEBUG: No addresses, returning early');
            return;
        }

        console.log('DEBUG: About to start payout transaction...');

        console.log(`Paying out to ${addresses.length} winners:`, addresses);
        console.log(`Rewards:`, rewards);
        console.log(`Total payout amount: ${prizePoolAmount} (0.001 USDC)`);
        console.log(`Contract address: ${this.config.prizePoolContract}`);
        console.log(`Sender address: ${account.address}`);

        try {
            // Check contract owner first
            console.log('Checking contract owner...');
            const contractOwner = await client.readContract({
                address: this.config.prizePoolContract as `0x${string}`,
                abi: PRIZE_POOL_ABI,
                functionName: 'owner'
            });
            console.log(`Contract owner: ${contractOwner}`);
            console.log(`Caller (your wallet): ${account.address}`);

            if (contractOwner.toLowerCase() !== account.address.toLowerCase()) {
                throw new Error(`❌ Permission denied: Your wallet (${account.address}) is not the contract owner (${contractOwner}). You need to use the owner's private key in your .env file.`);
            }

            console.log('✅ Ownership verified!');

            // Try to estimate gas first to catch errors early
            console.log('Estimating gas...');
            const gasEstimate = await client.estimateContractGas({
                address: this.config.prizePoolContract as `0x${string}`,
                abi: PRIZE_POOL_ABI,
                functionName: 'endCycle',
                args: [addresses, rewards],
                account
            });
            console.log(`Gas estimate: ${gasEstimate}`);

            console.log('Sending transaction...');
            const hash = await walletClient.writeContract({
                address: this.config.prizePoolContract as `0x${string}`,
                abi: PRIZE_POOL_ABI,
                functionName: 'endCycle',
                args: [addresses, rewards]
            });

            console.log(`✅ Payout Transaction sent: ${hash}`);

            // Wait for receipt
            console.log('Waiting for transaction confirmation...');
            const receipt = await client.waitForTransactionReceipt({ hash });
            console.log(`🎉 Payout confirmed in block ${receipt.blockNumber}`);
        } catch (error: any) {
            console.error('❌ Transaction failed:');
            console.error('Error message:', error.message);
            console.error('Error details:', error);
            if (error.cause) {
                console.error('Error cause:', error.cause);
            }
            throw error;
        }
    }
}
