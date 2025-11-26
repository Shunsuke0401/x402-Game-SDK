import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { SessionStore } from '../core/types';

/**
 * Creates a rate limiter middleware to prevent spam.
 * @param windowMs Time window in milliseconds (default: 15 minutes)
 * @param max Max requests per window (default: 100)
 */
export function createRateLimiter(windowMs: number = 15 * 60 * 1000, max: number = 100) {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
    });
}

/**
 * Middleware to verify that a session is valid and paid before allowing score submission.
 * @param store The session store implementation
 */
export function verifySession(store: SessionStore) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: 'Missing sessionId' });
        }

        try {
            const session = await store.getSession(sessionId);

            if (!session) {
                return res.status(403).json({ error: 'Invalid session ID' });
            }

            if (!session.isPaid) {
                return res.status(402).json({ error: 'Session not paid' });
            }

            if (session.scoreSubmitted) {
                return res.status(409).json({ error: 'Score already submitted for this session' });
            }

            // Attach session to request for downstream use
            (req as any).gameSession = session;
            next();
        } catch (error) {
            console.error('Session verification error:', error);
            res.status(500).json({ error: 'Internal server error during verification' });
        }
    };
}
