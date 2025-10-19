import { createPublicClient, createWalletClient, custom, parseAbi, encodeFunctionData, http } from 'viem';
import { sepolia } from 'viem/chains';

// Aave V3 Sepolia测试网地址
// 官方文档: https://docs.aave.com/developers/deployed-contracts/v3-testnet-addresses
export const AAVE_POOL_ADDRESS = '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951' as `0x${string}`;
export const WBTC_ADDRESS = '0x29f2D40B0605204364af54EC677bD022dA425d03' as `0x${string}`;

// Aave Pool ABI - flashLoanSimple方法
// 参考: https://docs.aave.com/developers/core-contracts/pool#flashloansimple
const POOL_ABI = parseAbi([
  'function flashLoanSimple(address receiverAddress, address asset, uint256 amount, bytes calldata params, uint16 referralCode) external',
  'function FLASHLOAN_PREMIUM_TOTAL() external view returns (uint128)',
]);

// ERC20 ABI
const ERC20_ABI = parseAbi([
  'function balanceOf(address account) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
]);

// 创建客户端
const publicClient = createPublicClient({
  chain: sepolia,
  transport: typeof window !== 'undefined' && window.ethereum
    ? custom(window.ethereum)
    : http()
});

const walletClient = createWalletClient({
  chain: sepolia,
  transport: typeof window !== 'undefined' && window.ethereum
    ? custom(window.ethereum)
    : http()
});

/**
 * 获取WBTC余额
 */
export async function getWBTCBalance(address: `0x${string}`): Promise<bigint> {
  try {
    const balance = await publicClient.readContract({
      address: WBTC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address]
    });
    return balance as bigint;
  } catch (error) {
    console.error('获取WBTC余额失败:', error);
    throw new Error('无法获取WBTC余额');
  }
}

/**
 * 授权WBTC给接收合约
 */
export async function approveWBTCToReceiver(
  owner: `0x${string}`,
  receiver: `0x${string}`,
  amount: bigint
): Promise<void> {
  try {
    const currentAllowance = await publicClient.readContract({
      address: WBTC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [owner, receiver]
    }) as bigint;

    if (currentAllowance >= amount) {
      console.log('授权额度充足');
      return;
    }

    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [receiver, amount]
    });

    const hash = await walletClient.sendTransaction({
      account: owner,
      to: WBTC_ADDRESS,
      data,
      value: 0n
    });

    await publicClient.waitForTransactionReceipt({ hash });
    console.log('WBTC授权成功');
  } catch (error) {
    console.error('授权失败:', error);
    throw new Error('WBTC授权失败');
  }
}

/**
 * 获取闪电贷手续费率
 * 默认是0.05% (5 basis points)
 */
export async function getFlashLoanPremium(): Promise<bigint> {
  try {
    const premium = await publicClient.readContract({
      address: AAVE_POOL_ADDRESS,
      abi: POOL_ABI,
      functionName: 'FLASHLOAN_PREMIUM_TOTAL'
    });
    return premium as bigint;
  } catch (error) {
    console.error('获取手续费率失败，使用默认值0.05%');
    return 5n; // 默认5个基点 = 0.05%
  }
}

/**
 * 计算闪电贷手续费
 */
export async function getFlashLoanFee(amount: bigint): Promise<bigint> {
  const premium = await getFlashLoanPremium();
  // 手续费 = 金额 * 费率 / 10000
  // 例如: 1 WBTC * 5 / 10000 = 0.0005 WBTC
  return (amount * premium) / 10000n;
}

/**
 * 执行闪电贷参数
 */
export type FlashLoanParams = {
  receiverAddress: `0x${string}`; // 接收合约地址
  asset: `0x${string}`;            // 借入资产地址（WBTC）
  amount: bigint;                  // 借入数量（wei单位）
  params: `0x${string}`;           // 传递给executeOperation的自定义数据
  referralCode: number;            // 推荐码（通常为0）
  initiator: `0x${string}`;        // 发起者地址
};

/**
 * 执行简单闪电贷
 * 参考文档: https://docs.aave.com/developers/guides/flash-loans
 * 
 * 流程：
 * 1. 用户调用Pool.flashLoanSimple()
 * 2. Pool转账资产到接收合约
 * 3. Pool调用接收合约的executeOperation()
 * 4. 接收合约执行自定义逻辑
 * 5. 接收合约授权Pool提取本金+手续费
 * 6. Pool自动扣款
 * 7. 交易完成（一个区块内完成）
 */
export async function executeSimpleFlashLoan(params: FlashLoanParams): Promise<`0x${string}`> {
  try {
    console.log('=== 开始执行闪电贷 ===');
    console.log('接收合约:', params.receiverAddress);
    console.log('资产:', params.asset);
    console.log('金额:', params.amount.toString());

    // 构造flashLoanSimple调用
    const data = encodeFunctionData({
      abi: POOL_ABI,
      functionName: 'flashLoanSimple',
      args: [
        params.receiverAddress,  // 接收合约地址
        params.asset,            // 借入资产（WBTC）
        params.amount,           // 借入数量
        params.params,           // 自定义数据
        params.referralCode      // 推荐码
      ]
    });

    // 发送交易
    const hash = await walletClient.sendTransaction({
      account: params.initiator,
      to: AAVE_POOL_ADDRESS,
      data,
      value: 0n,
      gas: 500000n // 闪电贷需要较多gas
    });

    console.log('闪电贷交易已发送:', hash);
    return hash;
  } catch (error: any) {
    console.error('执行闪电贷失败:', error);
    throw error;
  }
}

/**
 * 检查地址是否是合约
 */
export async function isContract(address: `0x${string}`): Promise<boolean> {
  try {
    const code = await publicClient.getBytecode({ address });
    return code !== undefined && code !== '0x';
  } catch (error) {
    console.error('检查合约失败:', error);
    return false;
  }
}

/**
 * 验证接收合约是否有足够余额支付手续费
 */
export async function verifyReceiverHasEnoughBalance(
  receiverAddress: `0x${string}`,
  borrowAmount: bigint
): Promise<{ hasEnough: boolean; balance: bigint; required: bigint; fee: bigint }> {
  try {
    const balance = await getWBTCBalance(receiverAddress);
    const fee = await getFlashLoanFee(borrowAmount);
    const required = fee; // 只需要手续费，借款金额会由Pool提供
    
    return {
      hasEnough: balance >= required,
      balance,
      required,
      fee
    };
  } catch (error) {
    console.error('验证余额失败:', error);
    throw error;
  }
}

/**
 * 全面验证闪电贷参数
 */
export async function validateFlashLoanParams(
  receiverAddress: `0x${string}`,
  borrowAmount: bigint
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // 1. 检查接收地址是否是合约
    console.log('检查接收地址是否为合约...');
    const isContractAddress = await isContract(receiverAddress);
    if (!isContractAddress) {
      errors.push('❌ 接收地址不是合约地址！请先部署FlashLoan接收合约。');
    }

    // 2. 检查合约WBTC余额
    console.log('检查合约WBTC余额...');
    const verification = await verifyReceiverHasEnoughBalance(receiverAddress, borrowAmount);
    if (!verification.hasEnough) {
      errors.push(
        `❌ 接收合约WBTC余额不足！\n` +
        `当前余额: ${(Number(verification.balance) / 1e8).toFixed(8)} WBTC\n` +
        `需要至少: ${(Number(verification.required) / 1e8).toFixed(8)} WBTC 来支付手续费`
      );
    }

    // 3. 检查借款金额是否合理
    if (borrowAmount <= 0n) {
      errors.push('❌ 借款金额必须大于0');
    }

  } catch (error: any) {
    errors.push(`❌ 验证过程出错: ${error.message}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

