import React, { useState } from 'react';
import { useAccount, useWalletClient, useSwitchChain, useChainId } from 'wagmi';
import { wrapFetchWithPayment, decodeXPaymentResponse } from 'x402-fetch';
import { base, baseSepolia } from 'viem/chains';

export interface PayToPlayButtonProps {
    apiBaseUrl: string;
    onJoined: (sessionId: string) => void;
    entryFeeUSDC?: string;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
}

export const PayToPlayButton: React.FC<PayToPlayButtonProps> = ({
    apiBaseUrl,
    onJoined,
    entryFeeUSDC,
    className,
    style,
    children
}) => {
    const { isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePlay = async () => {
        if (!isConnected) {
            setError('Please connect your wallet first');
            return;
        }

        // If walletClient is missing but we are connected, try to wait briefly or proceed if we can get it via other means.
        // However, x402-fetch needs a signer. 
        // Let's provide a more specific error if walletClient is missing.
        if (!walletClient) {
            console.warn('PayToPlayButton: Wallet connected but no walletClient found. This might be a timing issue or connector issue.');
            setError('Wallet client not ready. Please try again or reconnect.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Ensure correct network (defaulting to Base Mainnet logic for now, but should ideally check config)
            // For simplicity in v1, we'll assume the user's wallet should be on the chain the server expects.
            // But x402-fetch handles the chain switching request if the facilitator demands it? 
            // Actually x402-fetch just signs. The facilitator might reject if on wrong chain.

            const fetchWithPay = wrapFetchWithPayment(fetch as any, walletClient as any);
            const joinUrl = `${apiBaseUrl.replace(/\/+$/, '')}/join`;

            const response = await fetchWithPay(joinUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.sessionId) {
                    onJoined(data.sessionId);
                } else {
                    setError('Joined successfully but no session ID returned');
                }
            } else {
                setError(`Payment failed: ${response.statusText}`);
            }
        } catch (err) {
            console.error('PayToPlay error:', err);
            setError(err instanceof Error ? err.message : 'Payment failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="g402-pay-container">
            <button
                className={`g402-pay-button ${className || ''}`}
                style={style}
                onClick={handlePlay}
                disabled={isLoading || !isConnected}
            >
                {isLoading ? 'Processing...' : children || `Pay ${entryFeeUSDC ? `$${entryFeeUSDC}` : ''} to Play`}
            </button>
            {error && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '8px' }}>
                    {error}
                </div>
            )}
        </div>
    );
};
