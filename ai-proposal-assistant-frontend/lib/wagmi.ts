'use client';
import { http, createConfig } from 'wagmi';
import { sepolia, mainnet } from 'viem/chains';
import { injected, metaMask } from 'wagmi/connectors';
import { defineChain } from 'viem';

// 本地开发链配置
const localhost = defineChain({
  id: 1337,
  name: 'Localhost',
  network: 'localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  blockExplorers: {
    default: { name: 'Local', url: 'http://localhost:8545' },
  },
});

const isLocalDev = process.env.NEXT_PUBLIC_USE_LOCAL === 'true';

const chainId = isLocalDev ? 1337 : Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);
const rpcUrl = isLocalDev ? (process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545') : (process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org');

// WalletConnect 暂时移除以避免类型不兼容（可后续单独集成）

const chains = [localhost, sepolia, mainnet] as const;

// 构建连接器数组
const connectors = [injected(), metaMask()];

export const wagmiConfig = createConfig({
  chains,
  connectors,
  transports: {
    [localhost.id]: http(rpcUrl),
    [sepolia.id]: http(rpcUrl),
    [mainnet.id]: http(),
  },
  ssr: true,
});
