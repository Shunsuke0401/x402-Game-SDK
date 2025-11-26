import { Router } from 'express';
import crypto from 'crypto';
import { paymentMiddleware } from 'x402-express';
import { createFacilitatorConfig } from '@coinbase/x402';
import { SdkConfig } from '../core/types';

import { SessionStore } from '../core/types';

export function createPaymentRouter(config: SdkConfig, store?: SessionStore): Router {
    const router = Router();

    if (!config.cdpRecipientAddress && !config.prizePoolContract) {
        throw new Error('createPaymentRouter: Missing CDP_RECIPIENT_ADDRESS or PRIZE_POOL_CONTRACT in config');
    }

    console.log('DEBUG: Payment Router Config:', {
        prizePoolContract: config.prizePoolContract,
        cdpRecipientAddress: config.cdpRecipientAddress
    });

    const recipient = (config.prizePoolContract || config.cdpRecipientAddress) as `0x${string}`;
    console.log('DEBUG: Selected Recipient:', recipient);
    const isMainnet = config.cdpNetwork === 'base';

    const paymentConfig = {
        "POST /join": {
            price: `$${config.entryFeeUSDC}`,
            network: config.cdpNetwork,
            config: {
                description: `Entry fee (${isMainnet ? 'MAINNET' : 'TESTNET'})`
            }
        }
    };

    let facilitatorConfig;
    if (isMainnet) {
        if (!config.cdpApiKeyId || !config.cdpApiKeySecret) {
            throw new Error('createPaymentRouter: Base Mainnet requires cdpApiKeyId and cdpApiKeySecret');
        }
        facilitatorConfig = createFacilitatorConfig(config.cdpApiKeyId, config.cdpApiKeySecret);
    } else {
        facilitatorConfig = {
            url: config.facilitatorUrl as `${string}://${string}`
        };
    }

    // Mount the middleware
    router.use(paymentMiddleware(
        recipient,
        paymentConfig,
        facilitatorConfig
    ));

    router.post('/join', async (req, res) => {
        // Generate a session ID for the new game session
        const sessionId = crypto.randomUUID();

        if (store) {
            try {
                await store.createSession(sessionId);
                // We assume payment is verified if we reached here
                // TODO: Extract wallet address from res.locals if available from x402-express
                await store.markAsPaid(sessionId);
            } catch (error) {
                console.error('Error creating session:', error);
                return res.status(500).json({ error: 'Failed to create session' });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Payment verified',
            sessionId
        });
    });

    return router;
}
