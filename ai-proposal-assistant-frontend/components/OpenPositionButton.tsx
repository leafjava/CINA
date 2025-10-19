'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { parseEther, formatEther, parseUnits } from 'viem';
import { 
  getMeta, 
  ensureApprove, 
  openPositionFlashLoan, 
  openLeveragePosition,
  watchTx, 
  getPositions,
  getTokenBalance,
  type OpenPositionParams,
  type LeverageOpenPositionParams,
  type Position
} from '@/lib/position';
import { operateOpenPosition, getOperateConfig } from '@/lib/position';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface OpenPositionButtonProps {
  onSuccess?: (positions: Position[]) => void;
  onError?: (error: string) => void;
}

export default function OpenPositionButton({ onSuccess, onError }: OpenPositionButtonProps) {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [collateralAmount, setCollateralAmount] = useState('1.0'); // 默认1个stETH
  const [leverage, setLeverage] = useState('3.0'); // 默认3倍杠杆
  const [status, setStatus] = useState<string>('');
  
  // 新增：一步到位杠杆开仓状态
  const [wrmbAmount, setWrmbAmount] = useState('1000.0'); // 默认1000 WRMB
  const [wbtcAmount, setWbtcAmount] = useState('0.1'); // 默认0.1 WBTC
  const [tradingMode, setTradingMode] = useState<'traditional' | 'leverage'>('leverage'); // 交易模式

  const handleOpenPosition = async () => {
    if (!isConnected || !address) {
      onError?.('请先连接钱包');
      return;
    }

    setIsLoading(true);
    setStatus('');

    try {
      const meta = getMeta();
      const user = address as `0x${string}`;
      const { poolManager, pool } = getOperateConfig();
      
      // 在 Sepolia 环境下，通过 PoolManager 的 operate 开仓（使用 WRMB 作为抵押）
      if (meta.chainId === 11155111) {
        setStatus('Sepolia: 使用 WRMB 作为抵押，通过 PoolManager operate 开仓...');

        // 使用 WRMB 金额（18 位小数）
        const baseAmountStr = wrmbAmount;
        const collateralWrmb = parseEther(baseAmountStr || '0');

        // 调试信息
        console.log('=== 开仓调试信息 ===');
        console.log('用户地址:', user);
        console.log('PoolManager:', poolManager);
        console.log('Pool:', pool);
        console.log('WRMB代币:', meta.tokens.WRMB);
        console.log('抵押金额:', collateralWrmb.toString());

        // 检查WRMB余额
        setStatus('检查WRMB余额...');
        const wrmbBalance = await getTokenBalance(meta.tokens.WRMB as `0x${string}`, user);
        console.log('WRMB余额:', wrmbBalance.toString());
        
        if (wrmbBalance < collateralWrmb) {
          throw new Error(`WRMB余额不足！需要: ${collateralWrmb.toString()}, 当前: ${wrmbBalance.toString()}`);
        }

        // 授权 WRMB 给 PoolManager
        setStatus('授权 WRMB 给 PoolManager...');
        await ensureApprove(
          meta.tokens.WRMB as `0x${string}`,
          user,
          poolManager,
          collateralWrmb
        );

        // 借款金额：按 50% LTV（示例），与抵押同单位
        const debtAmountWrmb = collateralWrmb / 2n;
        console.log('债务金额:', debtAmountWrmb.toString());

        setStatus('发送 operate 开仓交易...');
        const { hash } = await operateOpenPosition({
          user,
          poolManager,
          pool,
          collateralDelta: collateralWrmb,
          debtDelta: debtAmountWrmb,
        });
        setStatus(`交易已发送: ${hash}`);

        setStatus('等待交易确认...');
        const result = await watchTx(hash);
        if (result === 'success') {
          setStatus('开仓成功！');
          setStatus('获取最新仓位信息...');
          const positions = await getPositions(user);
          onSuccess?.(positions);
          setStatus(`开仓成功！交易哈希: ${hash}`);
        } else {
          throw new Error(`交易失败: ${result}`);
        }

        return; // 已处理完 Sepolia 流程
      }
      
      if (tradingMode === 'leverage') {
        // 一步到位杠杆开仓流程
        await handleLeveragePosition(meta, user);
      } else {
        // 传统开仓流程
        await handleTraditionalPosition(meta, user);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '开仓失败';
      setStatus(`错误: ${errorMessage}`);
      onError?.(errorMessage);
      console.error('开仓失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeveragePosition = async (meta: any, address: `0x${string}`) => {
    setStatus('开始一步到位杠杆开仓...');
    
    // 1. 跳过WRMB余额检查，直接使用输入值
    const wrmbAmountWei = parseEther(wrmbAmount);

    console.log('81授权WRMB...')

    // 2. 授权WRMB
    setStatus('授权WRMB...');
    await ensureApprove(
      meta.tokens.WRMB as `0x${string}`,
      address,
      meta.diamond as `0x${string}`,
      wrmbAmountWei
    );

    // 3. 计算参数
    const leverageMultiplier = parseFloat(leverage);
    const wbtcAmountWei = parseEther(wbtcAmount);
    const minFxUSDMint = wbtcAmountWei * BigInt(Math.floor(leverageMultiplier * 10000)) / 10000n;
    const minWbtcOut = wbtcAmountWei * 95n / 100n; // 5%滑点保护

    // 4. 构造一步到位杠杆开仓参数
    const leverageParams: LeverageOpenPositionParams = {
      user: address,
      wrmbAmount: wrmbAmountWei,
      wbtcAmount: wbtcAmountWei,
      leverageMultiplier: leverageMultiplier,
      minFxUSDMint: minFxUSDMint,
      minWbtcOut: minWbtcOut,
      swapData: '0x' // 暂时不进行DEX交换
    };

    // 5. 发送交易
    setStatus('发送一步到位杠杆开仓交易...');
    const txHash = await openLeveragePosition(leverageParams);
    setStatus(`交易已发送: ${txHash}`);

    // 6. 等待确认
    setStatus('等待交易确认...');
    const result = await watchTx(txHash);

    if (result === 'success') {
      setStatus('一步到位杠杆开仓成功！');
      
      // 7. 获取最新仓位信息
      setStatus('获取最新仓位信息...');
      const positions = await getPositions(address);
      
      onSuccess?.(positions);
      setStatus(`一步到位杠杆开仓成功！交易哈希: ${txHash}`);
    } else {
      throw new Error(`交易失败: ${result}`);
    }
  };

  const handleTraditionalPosition = async (meta: any, address: `0x${string}`) => {
    setStatus('开始传统开仓（operate）...');

    // 1. 检查stETH余额
    setStatus('检查stETH余额...');
    const stethBalance = await getTokenBalance(meta.tokens.STETH as `0x${string}`, address);
    const collateralAmountWei = parseEther(collateralAmount);

    if (stethBalance < collateralAmountWei) {
      throw new Error(`stETH余额不足，当前余额: ${formatEther(stethBalance)}`);
    }

    // 2. 授权 stETH 给 PoolManager/Router（使用 diamond 作为 spender 以保持一致）
    setStatus('检查并授权stETH...');
    await ensureApprove(
      meta.tokens.STETH as `0x${string}`,
      address,
      meta.diamond as `0x${string}`,
      collateralAmountWei
    );

    // 3. 计算债务金额（根据杠杆倍数）
    // 假设：collateral 作为 USDC 类似 1:1 估值，debt 为 collateral * (leverage - 1)
    const leverageFloat = Math.max(1, parseFloat(leverage) || 1);
    const debtPortion = leverageFloat > 1 ? leverageFloat - 1 : 0;
    const debtAmountWei = BigInt(Math.floor(Number(collateralAmountWei) * debtPortion));

    // 4. 读取 operate 配置
    const { poolManager, pool } = getOperateConfig();

    // 5. 发送 operate 交易（开新仓）
    setStatus('发送 operate 开仓交易...');
    const { hash: txHash } = await operateOpenPosition({
      user: address,
      poolManager,
      pool,
      collateralDelta: collateralAmountWei,
      debtDelta: debtAmountWei,
    });
    setStatus(`交易已发送: ${txHash}`);

    // 6. 等待交易确认
    setStatus('等待交易确认...');
    const result = await watchTx(txHash);

    if (result === 'success') {
      setStatus('开仓成功！');

      // 7. 获取最新仓位信息
      setStatus('获取最新仓位信息...');
      const positions = await getPositions(address);

      onSuccess?.(positions);
      setStatus(`开仓成功！交易哈希: ${txHash}`);
    } else {
      throw new Error(`交易失败: ${result}`);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <p className="text-gray-600">请先连接钱包</p>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-black">开仓交易</h3>
      
      {/* 交易模式选择 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          交易模式
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="leverage"
              checked={tradingMode === 'leverage'}
              onChange={(e) => setTradingMode(e.target.value as 'leverage')}
              className="mr-2"
              disabled={isLoading}
            />
            <span className="text-black">一步到位杠杆开仓 (WRMB → WBTC)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="traditional"
              checked={tradingMode === 'traditional'}
              onChange={(e) => setTradingMode(e.target.value as 'traditional')}
              className="mr-2"
              disabled={isLoading}
            />
            <span className="text-black">传统开仓 (stETH抵押)</span>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        {tradingMode === 'leverage' ? (
          // 一步到位杠杆开仓界面
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WRMB数量
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={wrmbAmount}
                onChange={(e) => setWrmbAmount(e.target.value)}
                placeholder="输入WRMB数量"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目标WBTC数量
              </label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={wbtcAmount}
                onChange={(e) => setWbtcAmount(e.target.value)}
                placeholder="输入目标WBTC数量"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                杠杆倍数
              </label>
              <Input
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={leverage}
                onChange={(e) => setLeverage(e.target.value)}
                placeholder="输入杠杆倍数"
                disabled={isLoading}
              />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">一步到位杠杆开仓流程：</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. 用WRMB买WBTC（自有本金）</li>
                <li>2. 闪电贷临时借入更多WBTC</li>
                <li>3. 把「自有WBTC + 闪电贷WBTC」一起存入金库作抵押，铸出FXUSD</li>
                <li>4. 卖出FXUSD → USDC → 买WBTC</li>
                <li>5. 用这部分买到的WBTC归还闪电贷（含手续费）</li>
                <li>6. 交易结束：闪电贷清零，金库里留下更多WBTC作为抵押，账户背上FXUSD债务</li>
              </ol>
            </div>
          </>
        ) : (
          // 传统开仓界面
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                抵押物数量 (stETH)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={collateralAmount}
                onChange={(e) => setCollateralAmount(e.target.value)}
                placeholder="输入stETH数量"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                杠杆倍数
              </label>
              <Input
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={leverage}
                onChange={(e) => setLeverage(e.target.value)}
                placeholder="输入杠杆倍数"
                disabled={isLoading}
              />
            </div>
          </>
        )}

        <Button
          onClick={handleOpenPosition}
          disabled={isLoading || (tradingMode === 'leverage' ? (!wrmbAmount || !wbtcAmount || !leverage) : (!collateralAmount || !leverage))}
          className="w-full"
        >
          {isLoading ? '处理中...' : (tradingMode === 'leverage' ? '一步到位杠杆开仓' : '传统开仓')}
        </Button>

        {status && (
          <div
            className={`p-3 rounded-md text-sm ${
              status.includes('成功')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : status.includes('错误')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            } whitespace-normal break-words`}
          >
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
