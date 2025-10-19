'use client';
import { http, createConfig } from 'wagmi';
import { sepolia, mainnet } from 'viem/chains';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org';

// 检查WalletConnect项目ID
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!walletConnectProjectId) {
  console.warn('⚠️ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID 未设置，WalletConnect功能可能无法正常工作');
  console.warn('请访问 https://cloud.walletconnect.com/ 获取项目ID');
}

// 强制使用 Sepolia 和 Mainnet
const chains = [sepolia, mainnet] as const;

// 构建连接器数组 - 根据配置决定是否包含WalletConnect
const connectors = walletConnectProjectId && walletConnectProjectId !== 'your_walletconnect_project_id_here'
  ? [
      injected(),
      metaMask(),
      walletConnect({
        projectId: walletConnectProjectId,
      })
    ]
  : [
      injected(),
      metaMask(),
    ];

if (!walletConnectProjectId || walletConnectProjectId === 'your_walletconnect_project_id_here') {
  console.warn('WalletConnect连接器未启用，请配置有效的项目ID');
}

export const wagmiConfig = createConfig({
  chains,
  connectors,
  transports: {
    [sepolia.id]: http(rpcUrl),
    [mainnet.id]: http(),
  },
  ssr: true,
});
