import { createPublicClient, createWalletClient, custom, parseAbi, encodeFunctionData, encodeAbiParameters, http, defineChain } from 'viem';
import { sepolia } from 'viem/chains';

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

// 1. 基础配置 - getMeta
export type Meta = {
  chainId: number;
  diamond: `0x${string}`;
  tokens: {
    STETH: `0x${string}`;
    FXUSD: `0x${string}`;
    USDC: `0x${string}`;
    WBTC: `0x${string}`;  // 添加WBTC支持
    WRMB: `0x${string}`;  // 添加WRMB支持
    USDT: `0x${string}`;  // 添加USDT支持
  };
};

// export const META: Meta = {
//   chainId: 421614, // Arbitrum Sepolia
//   diamond: '0xB8B3e6C7D0f0A9754F383107A6CCEDD8F19343Ec' as `0x${string}`, // 使用CINA部署的Diamond合约地址
//   // diamond: '0x2F1Cdbad93806040c353Cc87a5a48142348B6AfD' as `0x${string}`, // 使用CINA部署的Diamond合约地址
//   tokens: { 
//     STETH: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84' as `0x${string}`, // Arbitrum Sepolia stETH地址
//     FXUSD: '0x085a1b6da46ae375b35dea9920a276ef571e209c' as `0x${string}`, // CINA部署的FxUSD地址
//     USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8' as `0x${string}` // Arbitrum Sepolia USDC地址
//   }
// };

// 本地开发配置：仅由环境变量控制
const isLocalDev = process.env.NEXT_PUBLIC_USE_LOCAL === 'true';

console.log('isLocalDev', isLocalDev)

export const META: Meta = {
  chainId: isLocalDev ? 1337 : 11155111, // 本地开发使用1337，否则使用Sepolia测试网
  // 优先读取环境变量，未设置则回退到默认值
  diamond: (
    (process.env.NEXT_PUBLIC_DIAMOND_ADDRESS as `0x${string}` | undefined) ?? (
      isLocalDev
        ? '0x5FbDB2315678afecb367f032d93F642f64180aa3'
        : '0x2F1Cdbad93806040c353Cc87a5a48142348B6AfD'
    )
  ) as `0x${string}`,
  tokens: {
    STETH: (
      (process.env.NEXT_PUBLIC_STETH_ADDRESS as `0x${string}` | undefined) ?? (
        isLocalDev
          ? '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
          : '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'
      )
    ) as `0x${string}`,
    FXUSD: (
      (process.env.NEXT_PUBLIC_FXUSD_ADDRESS as `0x${string}` | undefined) ?? (
        isLocalDev
          ? '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'
          : '0x085a1b6da46ae375b35dea9920a276ef571e209c'
      )
    ) as `0x${string}`,
    USDC: (
      (process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}` | undefined) ?? (
        isLocalDev
          ? '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
          : '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
      )
    ) as `0x${string}`,
    WBTC: (
      (process.env.NEXT_PUBLIC_WBTC_ADDRESS as `0x${string}` | undefined) ?? (
        isLocalDev
          ? '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
          : '0x29f2D40B0605204364af54EC677bD022dA425d03'
      )
    ) as `0x${string}`,
    WRMB: (
      (process.env.NEXT_PUBLIC_WRMB_ADDRESS as `0x${string}` | undefined) ?? (
        isLocalDev
          ? '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
          : '0x795751385c9ab8f832fda7f69a83e3804ee1d7f3'
      )
    ) as `0x${string}`,
    USDT: (
      (process.env.NEXT_PUBLIC_USDT_ADDRESS as `0x${string}` | undefined) ?? (
        isLocalDev
          ? '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
          : '0x29f2D40B0605204364af54EC677bD022dA425d03'
      )
    ) as `0x${string}`
  }
};

export function getMeta(): Meta {
  console.log('🔍 配置调试信息:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('NEXT_PUBLIC_USE_LOCAL:', process.env.NEXT_PUBLIC_USE_LOCAL);
  console.log('isLocalDev:', isLocalDev);
  console.log('当前链ID:', META.chainId);
  console.log('Diamond地址:', META.diamond);
  console.log('WRMB地址:', META.tokens.WRMB);
  console.log('当前配置:', META);
  return META;
}

// 创建客户端 - 添加备用RPC和错误处理
const createTransport = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return custom(window.ethereum);
  }

  // 本地开发使用本地RPC，否则使用Sepolia
  const rpcUrl = isLocalDev
    ? 'http://127.0.0.1:8545'
    : 'https://rpc.sepolia.org';

  return http(rpcUrl);
};

const selectedChain = isLocalDev ? localhost : sepolia;
console.log('🔗 Viem客户端链配置:', selectedChain.id, selectedChain.name);

export const publicClient = createPublicClient({
  chain: selectedChain,
  transport: createTransport()
});

export const walletClient = createWalletClient({
  chain: selectedChain,
  transport: createTransport()
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

// 统一交易发送（无自定义 gas 限制）
// 让底层客户端/钱包自动估算与设置

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
    let currentAllowance: bigint = 0n;
    try {
      currentAllowance = await publicClient.readContract({
        address: token,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [owner, spender]
      }) as bigint;
    } catch (readErr) {
      console.warn('[ensureApprove] 读取 allowance 失败，按 0 处理并继续发送 approve:', readErr);
      currentAllowance = 0n;
    }

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

    // ERC20 approve通常需要较少gas，让节点估算
    const estimatedGas = await estimateGasWithBuffer(owner, token, data);

    const txParams: any = {
      account: owner,
      to: token,
      data,
      value: 0n,
    };

    // 设置gas限制，ERC20 approve通常很少超过100k gas
    if (estimatedGas !== undefined) {
      // 对于ERC20 approve，限制在200k以内
      const safeGasLimit = estimatedGas > 200000n ? 200000n : estimatedGas;
      txParams.gas = safeGasLimit;
      console.log(`ERC20 approve gas限制: ${safeGasLimit.toString()}`);
    } else {
      // 如果估算失败，使用ERC20 approve的标准gas
      txParams.gas = 100000n;
      console.log('ERC20 approve估算失败，使用标准gas: 100000');
    }

    const hash = await walletClient.sendTransaction(txParams);

    console.log('授权交易已发送:', hash);

    // 在本地开发环境中，可以跳过等待确认以提高速度
    if (isLocalDev) {
      console.log('本地开发模式：跳过等待交易确认');
      return;
    }

    // 添加超时和错误处理
    try {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 30000, // 30秒超时
        confirmations: 1
      });
      console.log('授权交易已确认:', receipt.status);
    } catch (error) {
      console.warn('等待交易确认超时或失败:', error);
      // 不抛出错误，继续执行
    }
  } catch (error) {
    console.error('授权失败:', error);
    throw error;
  }
}

// Position Facet ABI - 匹配MockDiamond合约
export const POSITION_FACET_ABI = parseAbi([
  'function openOrAddPositionFlashLoanV2((address,uint256,address,bytes),address,uint256,uint256,bytes)',
  'function closeOrRemovePositionFlashLoanV2(address,uint256,address,uint256,address,bytes)',
  'function getPosition(uint256 tokenId) view returns (uint256 collateralAmount, uint256 debtAmount)',
  'function getPositionDebtRatio(uint256 tokenId) view returns (uint256)',
  'function getNextPositionId() view returns (uint32)',
  'function testFunction() view returns (string)',
  // 添加事件查询支持
  'event PositionOpened(uint256 indexed tokenId, address indexed owner, address collateralToken, uint256 collateralAmount)',
  'event PositionClosed(uint256 indexed tokenId, address indexed owner)'
]);

// Pool ABI - 用于查询仓位信息
export const POOL_ABI = parseAbi([
  'function getPosition(uint256 tokenId) view returns (uint256 rawColls, uint256 rawDebts)',
  'function getPositionDebtRatio(uint256 tokenId) view returns (uint256 debtRatio)',
  'function getNextPositionId() view returns (uint32)',
  'function collateralToken() view returns (address)',
  'function fxUSD() view returns (address)'
]);

// PoolManager ABI - 通过 operate 开仓/变更仓位
export const POOL_MANAGER_ABI = parseAbi([
  'function operate(address pool,uint256 positionId,int256 collateralDelta,int256 debtDelta)',
]);

// 获取 operate 所需的 PoolManager 与默认池地址
export function getOperateConfig(): { poolManager: `0x${string}`; pool: `0x${string}` } {
  const envPoolManager = process.env.NEXT_PUBLIC_POOL_MANAGER_ADDRESS as `0x${string}` | undefined;
  const envDefaultPool = process.env.NEXT_PUBLIC_DEFAULT_POOL_ADDRESS as `0x${string}` | undefined;

  if (envPoolManager && envDefaultPool) {
    return { poolManager: envPoolManager, pool: envDefaultPool };
  }

  // 默认：
  // - 本地：使用 Mock 部署的 Diamond 作为路由/管理器，占位池使用 FXUSD 地址（仅本地演示）
  // - Sepolia：使用测试脚本中的地址
  if (META.chainId === 1337) {
    return {
      poolManager: META.diamond,
      pool: META.tokens.USDC // 本地演示环境占位，建议通过环境变量覆盖
    } as { poolManager: `0x${string}`; pool: `0x${string}` };
  }

  // Sepolia 测试网默认配置（来自 v01/scripts/test-sepolia-deployment.ts）
  return {
    poolManager: '0xbb644076500ea106d9029b382c4d49f56225cb82' as `0x${string}`,
    pool: '0xAb20B978021333091CA307BB09E022Cec26E8608' as `0x${string}` // AaveFundingPool
  };
}

// 4. openPositionFlashLoan - 开仓交易
export type OpenPositionParams = {
  user: `0x${string}`;
  collateralToken: `0x${string}`;     // STETH 或 WBTC
  collateralAmount: bigint;           // 以最小单位
  targetLeverageBps: number;          // 3.0x -> 30000
  minMintFxUSD: bigint;               // 含滑点
  dexSwapData?: `0x${string}`;        // 没路由就 '0x'
};

// 新增：一步到位杠杆开仓参数
export type LeverageOpenPositionParams = {
  user: `0x${string}`;
  wrmbAmount: bigint;                 // WRMB数量
  wbtcAmount: bigint;                 // 目标WBTC数量
  leverageMultiplier: number;        // 杠杆倍数
  minFxUSDMint: bigint;               // 最小铸造FXUSD数量
  minWbtcOut: bigint;                 // 最小WBTC输出
  swapData?: `0x${string}`;           // DEX交换数据
};

// operate 开仓参数（PoolManager）
export type OperateOpenPositionParams = {
  user: `0x${string}`;
  poolManager: `0x${string}`;
  pool: `0x${string}`;
  collateralDelta: bigint; // 正数表示增加抵押
  debtDelta: bigint;       // 正数表示增加债务（借入 fxUSD）
  positionId?: bigint;     // 可选；不传则读取 nextPositionId
};

export async function openPositionFlashLoan(params: OpenPositionParams): Promise<`0x${string}`> {
  try {
    // 注意：这里需要根据CINA项目的实际接口进行调整
    // 当前实现是一个简化的版本，实际需要调用openOrAddPositionFlashLoanV2
    const data = encodeFunctionData({
      abi: POSITION_FACET_ABI,
      functionName: 'openOrAddPositionFlashLoanV2',
      args: [
        // 第一个参数是元组 (address tokenIn, uint256 amountIn, address tokenOut, bytes swapData)
        [
          params.collateralToken,
          params.collateralAmount,
          META.tokens.FXUSD,
          params.dexSwapData ?? '0x'
        ] as const,
        '0x0000000000000000000000000000000000000000', // address pool - 需要从配置中获取
        0n, // uint256 positionId - 新开仓为0
        params.collateralAmount, // uint256
        '0x' // bytes data
      ]
    });

    // 使用节点估算gas，如果失败则让钱包自动处理
    const estimatedGas = await estimateGasWithBuffer(params.user, META.diamond, data);

    const txParams: any = {
      account: params.user,
      to: META.diamond,
      data,
      value: 0n,
    };

    // 设置gas限制，确保不超过网络上限
    if (estimatedGas !== undefined) {
      // 双重保险：确保gas不超过15M（远低于16.7M限制）
      const safeGasLimit = estimatedGas > 15000000n ? 15000000n : estimatedGas;
      txParams.gas = safeGasLimit;
      console.log(`设置gas限制: ${safeGasLimit.toString()}`);
    } else {
      // 如果估算失败，设置一个保守的固定值
      txParams.gas = 8000000n;
      console.log('估算失败，使用保守gas限制: 8000000');
    }

    const hash = await walletClient.sendTransaction(txParams);

    console.log('开仓交易已发送:', hash);
    return hash;
  } catch (error) {
    console.error('开仓交易失败:', error);
    throw error;
  }
}

// 新增：一步到位杠杆开仓函数
export async function openLeveragePosition(params: LeverageOpenPositionParams): Promise<`0x${string}`> {
  try {
    console.log('开始一步到位杠杆开仓流程...');

    // 1. 检查WRMB余额
    const wrmbBalance = await getTokenBalance(META.tokens.WRMB, params.user);
    if (wrmbBalance < params.wrmbAmount) {
      throw new Error(`WRMB余额不足，当前余额: ${wrmbBalance.toString()}`);
    }
    console.log('213')
    // 2. 授权WRMB给Diamond合约
    await ensureApprove(
      META.tokens.WRMB,
      params.user,
      META.diamond,
      params.wrmbAmount
    );
    console.log('221')

    // 3. 构造闪电贷开仓参数
    // 流程：WRMB买WBTC -> 闪电贷借WBTC -> 存入金库抵押 -> 铸FXUSD -> 卖FXUSD买WBTC -> 还闪电贷
    const flashLoanAmount = params.wbtcAmount * BigInt(Math.floor(params.leverageMultiplier * 10000)) / 10000n;

    const data = encodeFunctionData({
      abi: POSITION_FACET_ABI,
      functionName: 'openOrAddPositionFlashLoanV2',
      args: [
        // 第一个参数是元组 (address tokenIn, uint256 amountIn, address tokenOut, bytes swapData)
        [
          META.tokens.WRMB,        // address tokenIn: WRMB
          params.wrmbAmount,       // uint256 amountIn: WRMB数量
          META.tokens.WBTC,        // address tokenOut: WBTC
          params.swapData ?? '0x'  // bytes swapData: 交换数据
        ] as const,
        '0x0000000000000000000000000000000000000000' as `0x${string}`, // address pool - WBTC池地址
        0n, // uint256 positionId - 新开仓为0
        flashLoanAmount, // uint256 - 闪电贷借入的WBTC数量
        encodeAbiParameters([
          { type: 'bytes32' },
          { type: 'uint256' },
          { type: 'address' },
          { type: 'bytes' }
        ], [
          '0x0000000000000000000000000000000000000000000000000000000000000000', // miscData
          params.minFxUSDMint, // 最小铸造FXUSD数量
          '0x0000000000000000000000000000000000000000', // swapTarget
          encodeAbiParameters([{ type: 'uint256' }], [BigInt(Math.floor(params.leverageMultiplier * 100))]) // 杠杆倍数编码
        ])
      ]
    });

    console.log('255', params.user, META.diamond, data)

    // 使用节点估算gas，如果失败则让钱包自动处理
    const estimatedGas = await estimateGasWithBuffer(params.user, META.diamond, data);

    const txParams: any = {
      account: params.user,
      to: META.diamond,
      data,
      value: 0n,
    };

    // 设置gas限制，确保不超过网络上限
    if (estimatedGas !== undefined) {
      // 双重保险：确保gas不超过15M（远低于16.7M限制）
      const safeGasLimit = estimatedGas > 15000000n ? 15000000n : estimatedGas;
      txParams.gas = safeGasLimit;
      console.log(`设置gas限制: ${safeGasLimit.toString()}`);
    } else {
      // 如果估算失败，设置一个保守的固定值
      txParams.gas = 8000000n;
      console.log('估算失败，使用保守gas限制: 8000000');
    }

    const hash = await walletClient.sendTransaction(txParams);

    console.log('264')

    console.log('一步到位杠杆开仓交易已发送:', hash);
    return hash;
  } catch (error) {
    console.error('一步到位杠杆开仓失败:', error);
    throw error;
  }
}

// 新增：通过 PoolManager 的 operate 开仓/加仓
export async function operateOpenPosition(params: OperateOpenPositionParams): Promise<{ hash: `0x${string}`; positionId: bigint }> {
  try {
    // PoolManager 没有 nextPositionId，对新开仓直接传 0，由合约返回实际 positionId
    const positionId = params.positionId ?? 0n;

    const data = encodeFunctionData({
      abi: POOL_MANAGER_ABI,
      functionName: 'operate',
      args: [
        params.pool,
        positionId,
        params.collateralDelta as unknown as bigint, // int256 编码由 ABI 处理
        params.debtDelta as unknown as bigint
      ]
    });

    // 使用节点估算gas，如果失败则让钱包自动处理
    const estimatedGas = await estimateGasWithBuffer(params.user, params.poolManager, data);

    const txParams: any = {
      account: params.user,
      to: params.poolManager,
      data,
      value: 0n,
    };

    // 设置gas限制，确保不超过网络上限
    if (estimatedGas !== undefined) {
      // 双重保险：确保gas不超过15M（远低于16.7M限制）
      const safeGasLimit = estimatedGas > 15000000n ? 15000000n : estimatedGas;
      txParams.gas = safeGasLimit;
      console.log(`设置gas限制: ${safeGasLimit.toString()}`);
    } else {
      // 如果估算失败，设置一个保守的固定值
      txParams.gas = 8000000n;
      console.log('估算失败，使用保守gas限制: 8000000');
    }

    const hash = await walletClient.sendTransaction(txParams);

    return { hash, positionId };
  } catch (error) {
    console.error('operate 开仓失败:', error);
    throw error;
  }
}

// 5. watchTx - 等待回执
export async function watchTx(hash: `0x${string}`): Promise<"success" | `revert:${string}`> {
  try {
    console.log('等待交易确认:', hash);
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      timeout: 60000, // 60秒超时
      confirmations: 1
    });
    console.log('交易确认状态:', receipt.status);
    return receipt.status === 'success' ? 'success' : (`revert:${receipt.transactionHash}` as const);
  } catch (error) {
    console.error('等待交易回执失败:', error);
    // 返回失败状态而不是抛出错误
    return `revert:${hash}` as const;
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

// 通过事件查询获取用户仓位
export async function getPositions(owner: `0x${string}`): Promise<Position[]> {
  try {
    console.log(`getPositions address:${META.diamond} args:${owner}`);

    // 详细诊断网络连接
    await diagnoseNetworkConnection();

    // 由于CINA项目中没有直接的getPositions函数，我们使用事件查询
    console.log('使用事件查询方式获取仓位（演示版本）');

    // 尝试查询PositionOpened事件
    try {
      const openedEvents = await publicClient.getLogs({
        address: META.diamond,
        event: parseAbi(['event PositionOpened(uint256 indexed tokenId, address indexed owner, address collateralToken, uint256 collateralAmount)'])[0],
        args: {
          owner: owner
        },
        fromBlock: 'earliest',
        toBlock: 'latest'
      });

      console.log('找到开仓事件:', openedEvents.length);

      // 尝试查询PositionClosed事件
      const closedEvents = await publicClient.getLogs({
        address: META.diamond,
        event: parseAbi(['event PositionClosed(uint256 indexed tokenId, address indexed owner)'])[0],
        args: {
          owner: owner
        },
        fromBlock: 'earliest',
        toBlock: 'latest'
      });

      console.log('找到平仓事件:', closedEvents.length);

      // 计算活跃仓位（开仓但未平仓的）
      const closedTokenIds = new Set(closedEvents.map(event => event.args.tokenId));
      const activePositions = openedEvents
        .filter(event => !closedTokenIds.has(event.args.tokenId))
        .filter(event =>
          event.args.tokenId !== undefined &&
          event.args.collateralToken !== undefined &&
          event.args.collateralAmount !== undefined
        )
        .map(event => ({
          id: event.args.tokenId!,
          collateralToken: event.args.collateralToken!,
          collateralAmount: event.args.collateralAmount!,
          debtAmount: 0n, // 需要从合约查询实际债务
          healthFactor: 0n // 需要从合约查询实际健康因子
        }));

      console.log('活跃仓位数量:', activePositions.length);
      return activePositions;

    } catch (eventError) {
      console.log('事件查询失败，使用演示模式:', eventError);

      // 如果事件查询失败，返回空数组（演示模式）
      return [];
    }

  } catch (error) {
    console.error('获取仓位失败:', error);

    // 网络错误时返回空数组而不是抛出错误
    if (error instanceof Error) {
      if (error.message.includes('InternalRpcError') ||
        error.message.includes('403') ||
        error.message.includes('Non-200 status code')) {
        console.warn('网络连接问题，返回空仓位列表');
        return [];
      }

      if (error.message.includes('returned no data')) {
        console.warn('合约函数调用失败，返回空仓位列表');
        return [];
      } else if (error.message.includes('invalid address')) {
        console.warn('无效的合约地址，返回空仓位列表');
        return [];
      }
    }

    // 对于其他错误，也返回空数组而不是抛出错误
    console.warn('获取仓位时发生未知错误，返回空仓位列表');
    return [];
  }
}

// 辅助函数：获取代币余额
export async function getTokenBalance(token: `0x${string}`, owner: `0x${string}`): Promise<bigint> {
  try {
    console.log('🔍 获取代币余额调试信息:');
    console.log('代币地址:', token);
    console.log('所有者地址:', owner);
    console.log('当前链ID:', await publicClient.getChainId());

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

// 智能gas估算函数 - 让节点估算，加缓冲但严格限制在网络上限内
export async function estimateGasWithBuffer(
  account: `0x${string}`,
  to: `0x${string}`,
  data: `0x${string}`,
  value: bigint = 0n
): Promise<bigint | undefined> {
  try {
    const estimatedGas = await publicClient.estimateGas({
      account,
      to,
      data,
      value,
    });

    console.log(`节点估算gas: ${estimatedGas.toString()}`);

    // 网络限制（Sepolia实际限制，留一些余量）
    const networkGasLimit = 16000000n; // 16M，比实际限制16.7M稍低一些

    // 如果估算的gas已经接近或超过网络限制，直接返回限制值
    if (estimatedGas >= networkGasLimit) {
      console.warn(`估算gas ${estimatedGas.toString()} 接近网络限制，使用安全限制 ${networkGasLimit.toString()}`);
      return networkGasLimit;
    }

    // 添加10%缓冲（更保守）
    const gasWithBuffer = (estimatedGas * 110n) / 100n;

    // 再次检查缓冲后是否超限
    if (gasWithBuffer > networkGasLimit) {
      console.warn(`缓冲后gas ${gasWithBuffer.toString()} 超过限制，使用网络限制 ${networkGasLimit.toString()}`);
      return networkGasLimit;
    }

    console.log(`Gas估算: ${estimatedGas.toString()} -> ${gasWithBuffer.toString()} (含10%缓冲)`);
    return gasWithBuffer;
  } catch (error) {
    console.warn('Gas估算失败，将让钱包自动估算:', error);
    return undefined; // 返回undefined让钱包自己估算
  }
}

// 新增：网络连接诊断
export async function diagnoseNetworkConnection(): Promise<void> {
  try {
    console.log('=== 开始网络诊断 ===');

    // 1. 检查当前链ID
    try {
      const chainId = await publicClient.getChainId();
      console.log('当前链ID:', chainId);
      console.log('配置链ID:', META.chainId);
      console.log('链ID匹配:', chainId === META.chainId);
    } catch (error) {
      console.warn('获取链ID失败:', error);
    }

    // 2. 检查最新区块
    try {
      const blockNumber = await publicClient.getBlockNumber();
      console.log('最新区块号:', blockNumber.toString());
    } catch (error) {
      console.warn('获取区块号失败:', error);
    }

    // 3. 检查合约代码
    try {
      const code = await publicClient.getBytecode({ address: META.diamond });
      console.log('合约代码长度:', code ? code.length : 0);
      console.log('合约代码存在:', code && code !== '0x');
    } catch (error) {
      console.warn('获取合约代码失败:', error);
    }

    // 4. 检查地址格式
    console.log('合约地址格式:', META.diamond);
    console.log('地址长度:', META.diamond.length);
    console.log('地址格式正确:', META.diamond.startsWith('0x') && META.diamond.length === 42);

    console.log('=== 网络诊断完成 ===');

  } catch (error) {
    console.warn('网络诊断部分失败:', error);
    // 不抛出错误，让程序继续运行
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
