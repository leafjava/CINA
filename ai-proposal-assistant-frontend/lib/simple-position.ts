import { createPublicClient, createWalletClient, custom, parseAbi, encodeFunctionData, http, formatUnits } from 'viem';
import { sepolia } from 'viem/chains';

// Sepolia 部署的合约地址
export const CONTRACTS = {
  PoolManager: '0xbb644076500ea106d9029b382c4d49f56225cb82' as `0x${string}`,
  AaveFundingPool: '0xAb20B978021333091CA307BB09E022Cec26E8608' as `0x${string}`,
  FxUSD: '0x085a1b6da46ae375b35dea9920a276ef571e209c' as `0x${string}`,
  USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as `0x${string}`,
  WRMB: '0x795751385c9ab8f832fda7f69a83e3804ee1d7f3' as `0x${string}`,
  Router: '0xB8B3e6C7D0f0A9754F383107A6CCEDD8F19343Ec' as `0x${string}`,
};

// PoolManager ABI - 基于 Hardhat 测试脚本
export const POOL_MANAGER_ABI = parseAbi([
  'function operate(address pool, uint256 positionId, int256 collateralAmount, int256 debtAmount) external',
  'function nextPositionId() view returns (uint256)',
  'function getPosition(address pool, uint256 positionId) view returns (uint256, uint256)',
  'function getPoolInfo(address pool) view returns (uint256, uint256, address, address)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function updateRateProvider(address token, address rateProvider) external',
  'function tokenRates(address token) view returns (uint256, address)',
  'function updatePoolCapacity(address pool, uint256 collateralCapacity, uint256 debtCapacity) external',
]);

// ERC20 ABI
export const ERC20_ABI = parseAbi([
  'function balanceOf(address account) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
]);

// 创建客户端 - 强制使用 Sepolia 测试网
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org';

const createTransport = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return custom(window.ethereum);
  }
  return http(rpcUrl);
};

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: createTransport()
});

export const walletClient = createWalletClient({
  chain: sepolia,
  transport: createTransport()
});

/**
 * 获取代币余额
 */
export async function getTokenBalance(
  tokenAddress: `0x${string}`,
  address: `0x${string}`
): Promise<bigint> {
  try {
    const balance = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address]
    });
    return balance as bigint;
  } catch (error) {
    console.error('获取代币余额失败:', error);
    throw new Error('无法获取代币余额');
  }
}

/**
 * 获取 USDC 余额
 */
export async function getUSDCBalance(address: `0x${string}`): Promise<bigint> {
  return getTokenBalance(CONTRACTS.USDC, address);
}

/**
 * 获取 WRMB 余额
 */
export async function getWRMBBalance(address: `0x${string}`): Promise<bigint> {
  return getTokenBalance(CONTRACTS.WRMB, address);
}

/**
 * 授权代币给 PoolManager
 */
export async function approveToken(
  tokenAddress: `0x${string}`,
  owner: `0x${string}`,
  amount: bigint,
  tokenSymbol: string = 'Token'
): Promise<void> {
  try {
    const currentAllowance = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [owner, CONTRACTS.PoolManager]
    }) as bigint;

    if (currentAllowance >= amount) {
      console.log(`${tokenSymbol}授权充足`);
      return;
    }

    console.log(`开始授权${tokenSymbol}...`);
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.PoolManager, amount]
    });

    const hash = await walletClient.sendTransaction({
      account: owner,
      to: tokenAddress,
      data,
      value: 0n
    });

    console.log('授权交易已发送:', hash);
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`${tokenSymbol}授权成功`);
  } catch (error) {
    console.error('授权失败:', error);
    throw new Error(`${tokenSymbol}授权失败`);
  }
}

/**
 * 授权 USDC 给 PoolManager
 */
export async function approveUSDC(
  owner: `0x${string}`,
  amount: bigint
): Promise<void> {
  return approveToken(CONTRACTS.USDC, owner, amount, 'USDC');
}

/**
 * 授权 WRMB 给 PoolManager
 */
export async function approveWRMB(
  owner: `0x${string}`,
  amount: bigint
): Promise<void> {
  return approveToken(CONTRACTS.WRMB, owner, amount, 'WRMB');
}

/**
 * 检查合约是否部署
 */
export async function checkContract(address: `0x${string}`, name: string): Promise<boolean> {
  try {
    const code = await publicClient.getBytecode({ address });
    const exists = code !== undefined && code !== '0x';
    console.log(`${name} 合约检查:`, {
      address,
      exists,
      codeLength: code?.length
    });
    return exists;
  } catch (error) {
    console.error(`检查${name}合约失败:`, error);
    return false;
  }
}

/**
 * 检查代币是否已设置汇率提供者
 */
export async function checkTokenRateProvider(tokenAddress: `0x${string}`): Promise<{ rate: bigint; provider: string }> {
  try {
    const result = await publicClient.readContract({
      address: CONTRACTS.PoolManager,
      abi: POOL_MANAGER_ABI,
      functionName: 'tokenRates',
      args: [tokenAddress]
    });
    
    const [rate, provider] = result as [bigint, string];
    console.log(`代币 ${tokenAddress} 汇率信息:`, { rate: rate.toString(), provider });
    
    return { rate, provider };
  } catch (error) {
    console.error('检查代币汇率失败:', error);
    throw error;
  }
}

/**
 * 更新代币汇率提供者
 * @param tokenAddress 代币地址
 * @param rateProvider 汇率提供者地址（传 0x0000000000000000000000000000000000000000 使用默认汇率）
 * @param userAddress 用户地址
 */
export async function updateTokenRateProvider(
  tokenAddress: `0x${string}`,
  rateProvider: `0x${string}`,
  userAddress: `0x${string}`
): Promise<`0x${string}`> {
  try {
    const hash = await walletClient.writeContract({
      account: userAddress,
      address: CONTRACTS.PoolManager,
      abi: POOL_MANAGER_ABI,
      functionName: 'updateRateProvider',
      args: [tokenAddress, rateProvider]
    });
    
    console.log('更新汇率提供者交易已发送:', hash);
    return hash;
  } catch (error) {
    console.error('更新汇率提供者失败:', error);
    throw error;
  }
}

/**
 * 更新池子容量
 * @param poolAddress 池子地址
 * @param collateralCapacity 抵押品容量（bigint）
 * @param debtCapacity 债务容量（bigint）
 * @param userAddress 用户地址
 */
export async function updatePoolCapacity(
  poolAddress: `0x${string}`,
  collateralCapacity: bigint,
  debtCapacity: bigint,
  userAddress: `0x${string}`
): Promise<`0x${string}`> {
  try {
    const hash = await walletClient.writeContract({
      account: userAddress,
      address: CONTRACTS.PoolManager,
      abi: POOL_MANAGER_ABI,
      functionName: 'updatePoolCapacity',
      args: [poolAddress, collateralCapacity, debtCapacity]
    });
    
    console.log('更新池子容量交易已发送:', hash);
    return hash;
  } catch (error) {
    console.error('更新池子容量失败:', error);
    throw error;
  }
}

/**
 * 获取下一个 Position ID
 */
export async function getNextPositionId(): Promise<number> {
  try {
    // 先检查合约是否存在
    const exists = await checkContract(CONTRACTS.PoolManager, 'PoolManager');
    if (!exists) {
      throw new Error('PoolManager合约未部署或地址错误');
    }

    const nextId = await publicClient.readContract({
      address: CONTRACTS.PoolManager,
      abi: POOL_MANAGER_ABI,
      functionName: 'nextPositionId'
    });
    
    console.log('下一个PositionID:', nextId);
    return Number(nextId);
  } catch (error: any) {
    console.error('获取下一个PositionID失败:', error);
    
    // 提供更详细的错误信息
    if (error.message?.includes('reverted')) {
      throw new Error('PoolManager合约函数调用失败，可能合约ABI不匹配或合约未正确初始化');
    } else if (error.message?.includes('未部署')) {
      throw error;
    } else {
      throw new Error(`无法获取PositionID: ${error.shortMessage || error.message}`);
    }
  }
}

/**
 * 获取池子信息
 */
export async function getPoolInfo(pool: `0x${string}`) {
  try {
    const result = await publicClient.readContract({
      address: CONTRACTS.PoolManager,
      abi: POOL_MANAGER_ABI,
      functionName: 'getPoolInfo',
      args: [pool]
    });
    
    // 返回值是数组 [collateralCapacity, debtCapacity, gauge, rewarder]
    const info = result as [bigint, bigint, `0x${string}`, `0x${string}`];
    
    return {
      collateralCapacity: info[0],
      debtCapacity: info[1],
      gauge: info[2],
      rewarder: info[3]
    };
  } catch (error) {
    console.error('获取池子信息失败:', error);
    throw error;
  }
}

/**
 * 获取仓位信息
 */
export async function getPositionInfo(
  pool: `0x${string}`,
  positionId: bigint
): Promise<{ collateral: bigint; debt: bigint }> {
  try {
    const result = await publicClient.readContract({
      address: CONTRACTS.PoolManager,
      abi: POOL_MANAGER_ABI,
      functionName: 'getPosition',
      args: [pool, positionId]
    });

    // 返回值是数组 [collateral, debt]
    const position = result as [bigint, bigint];

    return {
      collateral: position[0],
      debt: position[1]
    };
  } catch (error) {
    console.error('获取仓位信息失败:', error);
    throw error;
  }
}

/**
 * 开仓参数
 */
export type SimpleOpenPositionParams = {
  user: `0x${string}`;
  pool: `0x${string}`;
  positionId: bigint;
  collateralAmount: bigint; // 抵押品数量 (根据代币decimals)
  debtAmount: bigint;       // fxUSD 数量 (18 decimals)
  collateralToken?: string;  // 抵押品代币符号（用于日志）
  collateralDecimals?: number; // 抵押品decimals
};

/**
 * 简单开仓 - 使用 PoolManager.operate
 */
export async function simpleOpenPosition(
  params: SimpleOpenPositionParams
): Promise<`0x${string}`> {
  try {
    console.log('=== 开始简单开仓 ===');
    console.log('Pool:', params.pool);
    console.log('Position ID:', params.positionId);
    console.log('Collateral:', formatUnits(params.collateralAmount, 6), 'USDC');
    console.log('Debt:', formatUnits(params.debtAmount, 18), 'fxUSD');

    const data = encodeFunctionData({
      abi: POOL_MANAGER_ABI,
      functionName: 'operate',
      args: [
        params.pool,
        BigInt(params.positionId),
        BigInt(params.collateralAmount), // int256
        BigInt(params.debtAmount)        // int256
      ]
    });

    const hash = await walletClient.sendTransaction({
      account: params.user,
      to: CONTRACTS.PoolManager,
      data,
      value: 0n,
      gas: 500000n
    });

    console.log('开仓交易已发送:', hash);
    return hash;
  } catch (error: any) {
    console.error('开仓失败:', error);
    throw error;
  }
}

/**
 * 等待交易确认
 */
export async function waitForTransaction(
  hash: `0x${string}`
): Promise<'success' | 'reverted'> {
  try {
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt.status === 'success' ? 'success' : 'reverted';
  } catch (error) {
    console.error('等待交易失败:', error);
    throw error;
  }
}

