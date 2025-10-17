'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { getPositions, type Position } from '@/lib/position';

export default function PositionList() {
  const { address, isConnected } = useAccount();
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const loadPositions = async () => {
    if (!isConnected || !address) return;

    setIsLoading(true);
    setError('');

    try {
      const userPositions = await getPositions(address);
      setPositions(userPositions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取仓位失败';
      setError(errorMessage);
      console.error('获取仓位失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      loadPositions();
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <p className="text-gray-600">请先连接钱包查看仓位</p>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">我的仓位</h3>
        <button
          onClick={loadPositions}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? '刷新中...' : '刷新'}
        </button>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-red-50 text-red-700 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {isLoading && positions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          加载仓位信息中...
        </div>
      ) : positions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无仓位
        </div>
      ) : (
        <div className="space-y-4">
          {positions.map((position) => (
            <div key={position.id.toString()} className="p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">仓位ID</p>
                  <p className="font-medium">{position.id.toString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">抵押物代币</p>
                  <p className="font-medium">{position.collateralToken}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">抵押物数量</p>
                  <p className="font-medium">{formatEther(position.collateralAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">债务数量</p>
                  <p className="font-medium">{formatEther(position.debtAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">健康因子</p>
                  <p className={`font-medium ${
                    position.healthFactor > 1500000n 
                      ? 'text-green-600' 
                      : position.healthFactor > 1000000n 
                      ? 'text-yellow-600' 
                      : 'text-red-600'
                  }`}>
                    {(Number(position.healthFactor) / 1000000).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">杠杆倍数</p>
                  <p className="font-medium">
                    {position.collateralAmount > 0n 
                      ? (Number(position.debtAmount + position.collateralAmount) / Number(position.collateralAmount)).toFixed(2)
                      : '0'
                    }x
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
