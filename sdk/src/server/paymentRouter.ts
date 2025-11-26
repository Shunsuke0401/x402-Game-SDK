import { Router } from 'express';
import crypto from 'crypto';
import { paymentMiddleware } from 'x402-express';
import { createFacilitatorConfig } from '@coinbase/x402';
import { SdkConfig } from '../core/types';

export function createPaymentRouter(config: SdkConfig): Router {
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
    // Note: The middleware handles the response for the payment flow (402 or 200 with signature)
    // We wrap it in a router so the user can mount it at /api or root.
    // The x402-express middleware matches the route path defined in paymentConfig keys.
    // Since we defined "POST /join", it will intercept POST requests to /join relative to where this router is mounted.

    router.use(paymentMiddleware(
        recipient,
        paymentConfig,
        facilitatorConfig
    ));

    // If payment succeeds (middleware passes through), we can add a default success handler
    // or let the user add their own handler after mounting this router.
    // However, x402-express usually handles the handshake. 
    // If the request reaches here, it means the payment is verified (if using the middleware as a gate).
    // But x402-express acts as both a gate and a handshake handler.

    // We'll expose a helper to check payment status if needed, but for the basic flow:
    router.post('/join', (req, res) => {
        // If we get here, the middleware has verified the payment (or it's a free route if not configured, but here it is).
        // The middleware attaches payment info to res.locals or similar? 
        // Actually x402-express usually terminates the request if it's a handshake.
        // If it's a verified request, it passes through.

        // Generate a session ID for the new game session
        const sessionId = crypto.randomUUID();

        res.status(200).json({
            success: true,
            message: 'Payment verified',
            sessionId
        });
    });

    return router;
}
