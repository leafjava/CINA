'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { 
  getMeta, 
  ensureApprove, 
  openPositionFlashLoan, 
  watchTx, 
  getPositions,
  getTokenBalance,
  type OpenPositionParams,
  type Position
} from '@/lib/position';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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

  const handleOpenPosition = async () => {
    if (!isConnected || !address) {
      onError?.('请先连接钱包');
      return;
    }

    setIsLoading(true);
    setStatus('');

    try {
      // 1. 获取基础配置
      setStatus('获取配置信息...');
      const meta = getMeta();
      
      // 2. 检查stETH余额
      setStatus('检查stETH余额...');
      const stethBalance = await getTokenBalance(meta.tokens.STETH, address);
      const collateralAmountWei = parseEther(collateralAmount);
      
      if (stethBalance < collateralAmountWei) {
        throw new Error(`stETH余额不足，当前余额: ${formatEther(stethBalance)}`);
      }

      // 3. 确保授权
      setStatus('检查并授权stETH...');
      await ensureApprove(
        meta.tokens.STETH,
        address,
        meta.diamond,
        collateralAmountWei
      );

      // 4. 计算最小铸造FXUSD数量（这里简化处理，实际应该调用quote接口）
      const leverageBps = Math.floor(parseFloat(leverage) * 10000); // 3.0 -> 30000
      const minMintFxUSD = collateralAmountWei * BigInt(leverageBps) / 10000n; // 简化计算

      // 5. 构造开仓参数
      const openPosParams: OpenPositionParams = {
        user: address,
        collateralToken: meta.tokens.STETH,
        collateralAmount: collateralAmountWei,
        targetLeverageBps: leverageBps,
        minMintFxUSD: minMintFxUSD,
        dexSwapData: '0x' // 暂时不进行DEX交换
      };

      // 6. 发送开仓交易
      setStatus('发送开仓交易...');
      const txHash = await openPositionFlashLoan(openPosParams);
      setStatus(`交易已发送: ${txHash}`);

      // 7. 等待交易确认
      setStatus('等待交易确认...');
      const result = await watchTx(txHash);

      if (result === 'success') {
        setStatus('开仓成功！');
        
        // 8. 获取最新仓位信息
        setStatus('获取最新仓位信息...');
        const positions = await getPositions(address);
        
        onSuccess?.(positions);
        setStatus(`开仓成功！交易哈希: ${txHash}`);
      } else {
        throw new Error(`交易失败: ${result}`);
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

  if (!isConnected) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <p className="text-gray-600">请先连接钱包</p>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">开仓交易</h3>
      
      <div className="space-y-4">
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

        <Button
          onClick={handleOpenPosition}
          disabled={isLoading || !collateralAmount || !leverage}
          className="w-full"
        >
          {isLoading ? '处理中...' : '开仓'}
        </Button>

        {status && (
          <div className={`p-3 rounded-md text-sm ${
            status.includes('成功') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : status.includes('错误') 
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
