'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { parseAbi, formatUnits } from 'viem';
import { publicClient, walletClient, getMeta } from '@/lib/position';

const MOCK_STETH_ABI = parseAbi([
  'function faucet() external',
  'function mint(uint256 amount) external',
  'function balanceOf(address) view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)'
]);

export default function FaucetPage() {
  const { address, isConnected } = useAccount();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<string>('');
  const [customAmount, setCustomAmount] = useState('10');

  const meta = getMeta();
  const mockStETH = meta.tokens.STETH;

  // 检查余额
  const checkBalance = async () => {
    if (!address) {
      setStatus('❌ 请先连接钱包');
      return;
    }

    try {
      setLoading(true);
      setStatus('🔍 正在查询余额...');

      const bal = await publicClient.readContract({
        address: mockStETH,
        abi: MOCK_STETH_ABI,
        functionName: 'balanceOf',
        args: [address]
      }) as bigint;

      const formatted = formatUnits(bal, 18);
      setBalance(formatted);
      setStatus(`✅ 当前余额: ${formatted} stETH`);
    } catch (error) {
      setStatus(`❌ 查询失败: ${error instanceof Error ? error.message : '未知错误'}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 领取固定数量（100 stETH）
  const claimFaucet = async () => {
    if (!address) {
      setStatus('❌ 请先连接钱包');
      return;
    }

    try {
      setLoading(true);
      setStatus('⏳ 正在领取 100 stETH...');

      const hash = await walletClient.writeContract({
        address: mockStETH,
        abi: MOCK_STETH_ABI,
        functionName: 'faucet',
        account: address
      });

      setStatus(`⏳ 交易已发送: ${hash}\n等待确认...`);

      await publicClient.waitForTransactionReceipt({ hash });

      setStatus('✅ 成功领取 100 stETH！正在更新余额...');

      // 等待1秒后查询余额
      setTimeout(checkBalance, 1000);

    } catch (error: any) {
      if (error.message?.includes('User denied')) {
        setStatus('❌ 用户取消了交易');
      } else {
        setStatus(`❌ 领取失败: ${error.message || '未知错误'}`);
      }
      console.error('详细错误:', error);
    } finally {
      setLoading(false);
    }
  };

  // 自定义数量铸造
  const mintCustom = async () => {
    if (!address) {
      setStatus('❌ 请先连接钱包');
      return;
    }

    if (!customAmount || parseFloat(customAmount) <= 0) {
      setStatus('❌ 请输入有效的数量');
      return;
    }

    try {
      setLoading(true);
      const amount = BigInt(parseFloat(customAmount) * 1e18);
      setStatus(`⏳ 正在铸造 ${customAmount} stETH...`);

      const hash = await walletClient.writeContract({
        address: mockStETH,
        abi: MOCK_STETH_ABI,
        functionName: 'mint',
        args: [amount],
        account: address
      });

      setStatus(`⏳ 交易已发送: ${hash}\n等待确认...`);

      await publicClient.waitForTransactionReceipt({ hash });

      setStatus(`✅ 成功铸造 ${customAmount} stETH！正在更新余额...`);

      setTimeout(checkBalance, 1000);

    } catch (error: any) {
      if (error.message?.includes('User denied')) {
        setStatus('❌ 用户取消了交易');
      } else {
        setStatus(`❌ 铸造失败: ${error.message || '未知错误'}`);
      }
      console.error('详细错误:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🚰 stETH 测试水龙头</h1>
          <p className="text-gray-600">免费领取测试用的 Mock stETH 代币</p>
        </div>

        {/* 钱包状态卡片 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">💼</span> 钱包状态
          </h2>
          {isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-green-700 font-medium">✅ 已连接</span>
                <span className="text-xs text-gray-600 font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-500 text-xs mb-1">网络</div>
                  <div className="font-semibold">Sepolia ({meta.chainId})</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-500 text-xs mb-1">余额</div>
                  <div className="font-semibold">{balance || '未查询'} stETH</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-red-600 font-medium">❌ 未连接钱包</p>
              <p className="text-sm text-gray-600 mt-1">请先连接 MetaMask 钱包到 Sepolia 测试网</p>
            </div>
          )}
        </div>

        {/* 合约信息 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">📋</span> 合约信息
          </h2>
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500 text-xs mb-1">Mock stETH 合约地址</div>
              <div className="font-mono text-gray-800 break-all">{mockStETH}</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-blue-900 font-medium text-xs">
                📍 在 Sepolia Etherscan 查看:
                <a
                  href={`https://sepolia.etherscan.io/address/${mockStETH}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:underline"
                >
                  点击查看 →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 操作区域 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">⚡</span> 领取代币
          </h2>

          <div className="space-y-4">
            {/* 查询余额 */}
            <button
              onClick={checkBalance}
              disabled={loading || !isConnected}
              className="w-full px-6 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-all transform hover:scale-[1.02]"
            >
              {loading ? '⏳ 查询中...' : '🔍 查询余额'}
            </button>

            <div className="border-t pt-4">
              {/* 快速领取 100 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  快速领取（固定数量）
                </label>
                <button
                  onClick={claimFaucet}
                  disabled={loading || !isConnected}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-semibold transition-all transform hover:scale-[1.02] shadow-lg"
                >
                  {loading ? '⏳ 处理中...' : '🎁 领取 100 stETH'}
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  点击后会调用 faucet() 函数，自动铸造 100 个测试代币
                </p>
              </div>

              {/* 自定义数量 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  自定义数量
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    step="1"
                    min="0"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="输入数量"
                    disabled={loading}
                  />
                  <button
                    onClick={mintCustom}
                    disabled={loading || !isConnected}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-all"
                  >
                    {loading ? '⏳' : '铸造'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  调用 mint(amount) 函数，可以铸造任意数量的测试代币
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 状态显示 */}
        {status && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold mb-3 flex items-center text-gray-800">
              <span className="mr-2">📊</span> 操作状态
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {status}
              </pre>
            </div>
          </div>
        )}

        {/* 下一步提示 */}
        <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-green-900 mb-3 flex items-center">
            <span className="mr-2">✅</span> 领取成功后
          </h3>
          <ol className="text-sm text-green-800 space-y-2 list-decimal list-inside">
            <li>前往 <a href="/test-approve" className="font-semibold underline hover:text-green-600">测试授权页面</a> 测试 ensureApprove 函数</li>
            <li>测试完整的开仓流程</li>
            <li>如需更多代币，可随时返回此页面领取</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
