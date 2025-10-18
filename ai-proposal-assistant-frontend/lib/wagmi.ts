'use client';
import { http, createConfig } from 'wagmi';
import { sepolia, mainnet } from 'viem/chains';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org';

const chains = [sepolia, mainnet] as const;
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    }),
  ],
  transports: {
    [sepolia.id]: http(rpcUrl),
    [mainnet.id]: http(),
  },
  ssr: true,
});
