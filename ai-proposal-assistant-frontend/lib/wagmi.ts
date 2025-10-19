'use client';
import { http, createConfig } from 'wagmi';
import { sepolia, mainnet } from 'viem/chains';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org';

// 检查WalletConnect项目ID
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!walletConnectProjectId) {
  console.warn('⚠️ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID 未设置，WalletConnect功能可能无法正常工作');
  console.warn('请访问 https://cloud.walletconnect.com/ 获取项目ID');
}

const chains = [sepolia, mainnet];

// 构建连接器数组
const connectors = [
  injected(),
  metaMask(),
];

// 只有在有projectId时才添加WalletConnect连接器
if (walletConnectProjectId && walletConnectProjectId !== 'your_walletconnect_project_id_here') {
  connectors.push(
    walletConnect({
      projectId: walletConnectProjectId,
    })
  );
} else {
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
