import { createPublicClient, createWalletClient, custom, parseAbi, encodeFunctionData } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

// 1. 基础配置 - getMeta
export type Meta = {
  chainId: number;
  diamond: `0x${string}`;
  tokens: { 
    STETH: `0x${string}`; 
    FXUSD: `0x${string}`;
    USDC: `0x${string}`;  // 添加USDC支持
  };
};

export const META: Meta = {
  chainId: 421614, // Arbitrum Sepolia
  diamond: '0x2F1Cdbad93806040c353Cc87a5a48142348B6AfD' as `0x${string}`, // 需要替换为实际的Diamond合约地址
  tokens: { 
    STETH: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84' as `0x${string}`, // 需要替换为实际的stETH地址
    FXUSD: '0x085a1b6da46ae375b35dea9920a276ef571e209c' as `0x${string}`, // 需要替换为实际的FXUSD地址
    USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8' as `0x${string}` // Arbitrum Sepolia USDC地址
  }
};

export function getMeta(): Meta {
  return META;
}

// 创建客户端
export const publicClient = createPublicClient({ 
  chain: arbitrumSepolia, 
  transport: custom(typeof window !== 'undefined' ? window.ethereum! : undefined) 
});

export const walletClient = createWalletClient({ 
  chain: arbitrumSepolia, 
  transport: custom(typeof window !== 'undefined' ? window.ethereum! : undefined) 
});

// ERC20 ABI
export const ERC20_ABI = parseAbi([
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
]);

// 3. deadline - 统一过期时间
export function deadline(afterSec = 1200): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + afterSec);
}

// 2. ensureApprove - 抵押物授权
export async function ensureApprove(
  token: `0x${string}`,
  owner: `0x${string}`,
  spender: `0x${string}`,
  amount: bigint
): Promise<void> {
  try {
    const currentAllowance = await publicClient.readContract({
      address: token,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [owner, spender]
    }) as bigint;

    if (currentAllowance >= amount) {
      console.log('授权充足，无需重新授权');
      return;
    }

    console.log('授权不足，开始授权...');
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amount]
    });

    const hash = await walletClient.sendTransaction({
      to: token,
      data,
      value: 0n
    });

    console.log('授权交易已发送:', hash);
    await publicClient.waitForTransactionReceipt({ hash });
    console.log('授权交易已确认');
  } catch (error) {
    console.error('授权失败:', error);
    throw error;
  }
}

// Position Facet ABI
export const POSITION_FACET_ABI = parseAbi([
  'function openPositionFlashLoan(address collateralToken, uint256 collateralAmount, uint256 targetLeverageBps, uint256 minMintFxUSD, bytes dexSwapData, uint256 deadline)',
  'function getPositions(address owner) view returns (tuple(uint256 id, address collateralToken, uint256 collateralAmount, uint256 debtAmount, uint256 healthFactor)[])',
  'function getPosition(uint256 positionId) view returns (tuple(uint256 id, address collateralToken, uint256 collateralAmount, uint256 debtAmount, uint256 healthFactor))'
]);

// 4. openPositionFlashLoan - 开仓交易
export type OpenPositionParams = {
  user: `0x${string}`;
  collateralToken: `0x${string}`;     // STETH
  collateralAmount: bigint;           // 以最小单位
  targetLeverageBps: number;          // 3.0x -> 30000
  minMintFxUSD: bigint;               // 含滑点
  dexSwapData?: `0x${string}`;        // 没路由就 '0x'
};

export async function openPositionFlashLoan(params: OpenPositionParams): Promise<`0x${string}`> {
  try {
    const data = encodeFunctionData({
      abi: POSITION_FACET_ABI,
      functionName: 'openPositionFlashLoan',
      args: [
        params.collateralToken,
        params.collateralAmount,
        BigInt(params.targetLeverageBps),
        params.minMintFxUSD,
        params.dexSwapData ?? '0x',
        deadline()
      ]
    });

    const hash = await walletClient.sendTransaction({
      to: META.diamond,
      data,
      value: 0n
    });

    console.log('开仓交易已发送:', hash);
    return hash;
  } catch (error) {
    console.error('开仓交易失败:', error);
    throw error;
  }
}

// 5. watchTx - 等待回执
export async function watchTx(hash: `0x${string}`): Promise<"success" | `revert:${string}`> {
  try {
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt.status === 'success' ? 'success' : (`revert:${receipt.transactionHash}` as const);
  } catch (error) {
    console.error('等待交易回执失败:', error);
    throw error;
  }
}

// 6. getPositions - 获取仓位
export type Position = {
  id: bigint;
  collateralToken: `0x${string}`;
  collateralAmount: bigint;
  debtAmount: bigint;
  healthFactor: bigint;
};

export async function getPositions(owner: `0x${string}`): Promise<Position[]> {
  try {
    const positions = await publicClient.readContract({
      address: META.diamond,
      abi: POSITION_FACET_ABI,
      functionName: 'getPositions',
      args: [owner]
    }) as Position[];

    return positions;
  } catch (error) {
    console.error('获取仓位失败:', error);
    throw error;
  }
}

// 辅助函数：获取代币余额
export async function getTokenBalance(token: `0x${string}`, owner: `0x${string}`): Promise<bigint> {
  try {
    return await publicClient.readContract({
      address: token,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [owner]
    }) as bigint;
  } catch (error) {
    console.error('获取代币余额失败:', error);
    throw error;
  }
}

// 辅助函数：获取代币信息
export async function getTokenInfo(token: `0x${string}`) {
  try {
    const [name, symbol, decimals] = await Promise.all([
      publicClient.readContract({ address: token, abi: ERC20_ABI, functionName: 'name' }),
      publicClient.readContract({ address: token, abi: ERC20_ABI, functionName: 'symbol' }),
      publicClient.readContract({ address: token, abi: ERC20_ABI, functionName: 'decimals' })
    ]);

    return { name, symbol, decimals };
  } catch (error) {
    console.error('获取代币信息失败:', error);
    throw error;
  }
}
