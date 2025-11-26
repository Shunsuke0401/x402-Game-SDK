import { SdkConfig } from './types';
import dotenv from 'dotenv';
import path from 'node:path';
dotenv.config();
dotenv.config({ path: '.env.development' });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env.development') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.development') });

export const DEFAULT_CONFIG: Partial<SdkConfig> = {
    entryFeeUSDC: '0.001',
    cdpNetwork: 'base-sepolia',
    corsOrigins: [],
    payoutIntervalMs: 24 * 60 * 60 * 1000, // 24 hours
    enableOnchainPayouts: false,
    facilitatorUrl: 'https://x402.org/facilitator'
};

export function loadConfig(env: Record<string, string | undefined> = process.env): SdkConfig {
    const config: SdkConfig = {
        entryFeeUSDC: env.ENTRY_FEE_USDC || DEFAULT_CONFIG.entryFeeUSDC!,
        cdpNetwork: (env.CDP_NETWORK as 'base' | 'base-sepolia') || DEFAULT_CONFIG.cdpNetwork!,
        cdpRecipientAddress: env.CDP_RECIPIENT_ADDRESS || '',
        facilitatorUrl: env.FACILITATOR_URL || DEFAULT_CONFIG.facilitatorUrl!,
        corsOrigins: (env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
        payoutIntervalMs: Number(env.PAYOUT_INTERVAL_MS || DEFAULT_CONFIG.payoutIntervalMs),
        prizePoolContract: env.PRIZE_POOL_CONTRACT,
        treasuryAddress: env.TREASURY_ADDRESS,
        enableOnchainPayouts: env.ENABLE_ONCHAIN_PAYOUTS === 'true',
        cdpApiKeyId: env.CDP_API_KEY_ID,
        cdpApiKeySecret: env.CDP_API_KEY_SECRET,
        baseRpcUrl: env.BASE_RPC_URL,
        privateKey: env.PRIVATE_KEY
    };

    if (!config.cdpRecipientAddress && !config.prizePoolContract) {
        console.warn('⚠️ Warning: Neither CDP_RECIPIENT_ADDRESS nor PRIZE_POOL_CONTRACT is set. Payments may fail.');
    }

    return config;
}
