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
  // diamond: '0xB8B3e6C7D0f0A9754F383107A6CCEDD8F19343Ec' as `0x${string}`, // 使用CINA部署的Diamond合约地址
  diamond: '0x2F1Cdbad93806040c353Cc87a5a48142348B6AfD' as `0x${string}`, // 使用CINA部署的Diamond合约地址
  tokens: { 
    STETH: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84' as `0x${string}`, // Arbitrum Sepolia stETH地址
    FXUSD: '0x085a1b6da46ae375b35dea9920a276ef571e209c' as `0x${string}`, // CINA部署的FxUSD地址
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

// Position Facet ABI - 基于CINA项目的实际接口
export const POSITION_FACET_ABI = parseAbi([
  'function openOrAddPositionFlashLoanV2((address,uint256,address,bytes),address,uint256,uint256,bytes)',
  'function closeOrRemovePositionFlashLoanV2((address,uint256,address,bytes),uint256,address,uint256,uint256,bytes)',
  // 注意：CINA项目中没有直接的getPositions函数，需要通过Pool合约查询
  'function getPosition(uint256 tokenId) view returns (uint256 rawColls, uint256 rawDebts)',
  'function getPositionDebtRatio(uint256 tokenId) view returns (uint256 debtRatio)',
  'function getNextPositionId() view returns (uint32)'
]);

// Pool ABI - 用于查询仓位信息
export const POOL_ABI = parseAbi([
  'function getPosition(uint256 tokenId) view returns (uint256 rawColls, uint256 rawDebts)',
  'function getPositionDebtRatio(uint256 tokenId) view returns (uint256 debtRatio)',
  'function getNextPositionId() view returns (uint32)',
  'function collateralToken() view returns (address)',
  'function fxUSD() view returns (address)'
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
    // 注意：这里需要根据CINA项目的实际接口进行调整
    // 当前实现是一个简化的版本，实际需要调用openOrAddPositionFlashLoanV2
    const data = encodeFunctionData({
      abi: POSITION_FACET_ABI,
      functionName: 'openOrAddPositionFlashLoanV2',
      args: [
        // 这里需要根据CINA项目的实际参数结构进行调整
        {
          tokenIn: params.collateralToken,
          amountIn: params.collateralAmount,
          tokenOut: META.tokens.FXUSD,
          minAmountOut: params.minMintFxUSD,
          swapTarget: '0x0000000000000000000000000000000000000000',
          swapData: params.dexSwapData ?? '0x'
        },
        '0x0000000000000000000000000000000000000000', // pool address - 需要从配置中获取
        0, // positionId - 新开仓为0
        params.collateralAmount,
        '0x' // data
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

// 注意：CINA项目中没有直接的getPositions函数
// 这里提供一个临时的实现，返回空数组
// 实际实现需要遍历所有可能的position ID或使用事件查询
export async function getPositions(owner: `0x${string}`): Promise<Position[]> {
  try {
    console.log(`getPositions address:${META.diamond} args:${owner}`)
    
    // 首先验证合约地址
    const verification = await verifyContract();
    if (!verification.isValid) {
      throw new Error(verification.message);
    }
    
    // 注意：CINA项目中没有直接的getPositions函数
    // 这里返回空数组作为临时解决方案
    // 实际实现需要：
    // 1. 查询用户拥有的NFT token IDs
    // 2. 对每个token ID调用getPosition函数
    // 3. 或者通过事件查询历史开仓记录
    
    console.log('注意：CINA项目中没有直接的getPositions函数，返回空数组');
    console.log('合约验证结果:', verification.message);
    return [];
    
  } catch (error) {
    console.error('获取仓位失败:', error);
    
    // 提供更详细的错误信息
    if (error instanceof Error) {
      if (error.message.includes('returned no data')) {
        throw new Error(`合约函数调用失败：合约地址 ${META.diamond} 可能不包含 getPositions 函数，或者该函数未正确部署。请检查合约地址和ABI配置。`);
      } else if (error.message.includes('invalid address')) {
        throw new Error(`无效的合约地址：${META.diamond}。请检查合约地址配置。`);
      } else if (error.message.includes('验证合约')) {
        throw new Error(`合约验证失败：${error.message}`);
      }
    }
    
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

// 新增：验证合约地址和函数是否存在
export async function verifyContract(): Promise<{ isValid: boolean; message: string }> {
  try {
    // 检查合约地址是否有效
    const code = await publicClient.getBytecode({ address: META.diamond });
    if (!code || code === '0x') {
      return {
        isValid: false,
        message: `合约地址 ${META.diamond} 无效或未部署合约`
      };
    }

    // 尝试调用一个简单的view函数来验证合约是否可访问
    try {
      // 这里可以尝试调用Diamond合约的facets函数来验证
      await publicClient.readContract({
        address: META.diamond,
        abi: parseAbi(['function facets() view returns ((address,bytes4[])[])']),
        functionName: 'facets'
      });
    } catch (error) {
      return {
        isValid: false,
        message: `合约地址 ${META.diamond} 存在但无法访问，可能是网络问题或合约未正确部署`
      };
    }

    return {
      isValid: true,
      message: `合约地址 ${META.diamond} 验证成功`
    };
  } catch (error) {
    return {
      isValid: false,
      message: `验证合约时发生错误: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}

// 新增：获取单个仓位信息
export async function getPosition(poolAddress: `0x${string}`, positionId: bigint): Promise<Position | null> {
  try {
    const [rawColls, rawDebts] = await publicClient.readContract({
      address: poolAddress,
      abi: POOL_ABI,
      functionName: 'getPosition',
      args: [positionId]
    }) as [bigint, bigint];

    const debtRatio = await publicClient.readContract({
      address: poolAddress,
      abi: POOL_ABI,
      functionName: 'getPositionDebtRatio',
      args: [positionId]
    }) as bigint;

    const collateralToken = await publicClient.readContract({
      address: poolAddress,
      abi: POOL_ABI,
      functionName: 'collateralToken'
    }) as `0x${string}`;

    return {
      id: positionId,
      collateralToken,
      collateralAmount: rawColls,
      debtAmount: rawDebts,
      healthFactor: debtRatio
    };
  } catch (error) {
    console.error('获取单个仓位失败:', error);
    return null;
  }
}
