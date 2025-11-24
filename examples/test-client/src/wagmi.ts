import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'

export const config = createConfig({
    chains: [base, baseSepolia],
    connectors: [metaMask(), injected()],
    transports: {
        [base.id]: http(),
        [baseSepolia.id]: http(),
    },
})
