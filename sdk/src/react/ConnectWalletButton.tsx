import React, { useMemo, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi';

export interface ConnectWalletButtonProps {
    className?: string;
    style?: React.CSSProperties;
}

export const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({ className, style }) => {
    const { address, isConnected } = useAccount();
    const { data: ensName } = useEnsName({ address });
    const { connect, connectors, isPending, variables } = useConnect();
    const { disconnect } = useDisconnect();
    const [showDropdown, setShowDropdown] = useState(false);

    const connectorsToShow = useMemo(() => {
        const byName = new Map<string, (typeof connectors)[number]>();
        for (const c of connectors) {
            const key = c.name.trim().toLowerCase();
            const existing = byName.get(key);
            // Prefer the dedicated MetaMask connector over any others with the same name
            if (!existing || c.id === 'metaMask') byName.set(key, c);
        }
        return Array.from(byName.values());
    }, [connectors]);

    if (isConnected) {
        return (
            <div className={`g402-wallet-connected ${className || ''}`} style={style}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600 }}>
                        {ensName ? ensName : `${address?.slice(0, 6)}…${address?.slice(-4)}`}
                    </span>
                    <button
                        onClick={() => disconnect()}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #ccc',
                            background: 'transparent',
                            cursor: 'pointer'
                        }}
                    >
                        Disconnect
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`g402-wallet-connect ${className || ''}`} style={{ position: 'relative', ...style }}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={isPending}
                style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: '#0052ff',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}
            >
                {isPending && variables?.connector ? `Connecting ${variables.connector.name}...` : 'Connect Wallet'}
            </button>

            {showDropdown && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    background: 'white',
                    border: '1px solid #eee',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    padding: '8px',
                    zIndex: 100,
                    minWidth: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                }}>
                    {connectorsToShow.map((connector) => (
                        <button
                            key={connector.uid || connector.id}
                            onClick={() => {
                                connect({ connector });
                                setShowDropdown(false);
                            }}
                            style={{
                                textAlign: 'left',
                                padding: '8px 12px',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                color: '#333'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            {connector.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
