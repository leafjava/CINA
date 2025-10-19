'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import {
  ensureApprove,
  getMeta,
  getTokenBalance,
  ERC20_ABI,
  publicClient
} from '@/lib/position';

export default function TestApprovePage() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('1');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [allowance, setAllowance] = useState<string>('');
  const [balance, setBalance] = useState<string>('');

  const meta = getMeta();

  // 检查当前授权额度
  const checkAllowance = async () => {
    if (!address) {
      setStatus('❌ 请先连接钱包');
      return;
    }

    try {
      setLoading(true);
      setStatus('🔍 正在检查授权额度...');

      const currentAllowance = await publicClient.readContract({
        address: meta.tokens.STETH,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, meta.diamond]
      }) as bigint;

      const formattedAllowance = (Number(currentAllowance) / 1e18).toFixed(4);
      setAllowance(formattedAllowance);
      setStatus(`✅ 当前授权额度: ${formattedAllowance} STETH`);
    } catch (error) {
      setStatus(`❌ 检查授权额度失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 检查代币余额
  const checkBalance = async () => {
    if (!address) {
      setStatus('❌ 请先连接钱包');
      return;
    }

    try {
      setLoading(true);
      setStatus('🔍 正在检查余额...');

      const bal = await getTokenBalance(meta.tokens.STETH, address);
      const formattedBalance = (Number(bal) / 1e18).toFixed(4);
      setBalance(formattedBalance);
      setStatus(`✅ STETH 余额: ${formattedBalance}`);
    } catch (error) {
      setStatus(`❌ 检查余额失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试 ensureApprove
  const testEnsureApprove = async () => {
    if (!address) {
      setStatus('❌ 请先连接钱包');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setStatus('❌ 请输入有效的数量');
      return;
    }

    try {
      setLoading(true);
      const amountWei = parseUnits(amount, 18);

      // 步骤1: 检查当前授权
      setStatus('📋 步骤1: 检查当前授权额度...');
      const currentAllowance = await publicClient.readContract({
        address: meta.tokens.STETH,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, meta.diamond]
      }) as bigint;

      setStatus(`📋 当前授权额度: ${(Number(currentAllowance) / 1e18).toFixed(4)} STETH`);

      await new Promise(resolve => setTimeout(resolve, 1000));

      // 步骤2: 执行 ensureApprove
      setStatus(`⚙️ 步骤2: 执行 ensureApprove (${amount} STETH)...`);
      await ensureApprove(
        meta.tokens.STETH,
        address,
        meta.diamond,
        amountWei
      );

      await new Promise(resolve => setTimeout(resolve, 1000));

      // 步骤3: 验证结果
      setStatus('✅ 步骤3: 验证授权结果...');
      const newAllowance = await publicClient.readContract({
        address: meta.tokens.STETH,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, meta.diamond]
      }) as bigint;

      const formattedNew = (Number(newAllowance) / 1e18).toFixed(4);
      setAllowance(formattedNew);

      setStatus(`
✅ 测试成功！
━━━━━━━━━━━━━━━━━━━━━
📊 测试结果:
  • 授权前: ${(Number(currentAllowance) / 1e18).toFixed(4)} STETH
  • 授权后: ${formattedNew} STETH
  • 授权目标: ${meta.diamond}
━━━━━━━━━━━━━━━━━━━━━
      `);

    } catch (error) {
      setStatus(`❌ 测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
      console.error('详细错误:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 ensureApprove 测试页面</h1>

        {/* 钱包状态 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">钱包状态</h2>
          {isConnected ? (
            <div className="space-y-2">
              <p className="text-green-600">✅ 已连接钱包</p>
              <p className="text-sm text-gray-600 font-mono break-all">地址: {address}</p>
              <p className="text-sm text-gray-600">链ID: {meta.chainId} (Sepolia)</p>
            </div>
          ) : (
            <p className="text-red-600">❌ 未连接钱包，请先连接</p>
          )}
        </div>

        {/* 合约配置 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">合约配置</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold">Diamond合约:</span>
              <p className="font-mono text-gray-600 break-all">{meta.diamond}</p>
            </div>
            <div>
              <span className="font-semibold">STETH代币:</span>
              <p className="font-mono text-gray-600 break-all">{meta.tokens.STETH}</p>
            </div>
          </div>
        </div>

        {/* 快速检查 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">快速检查</h2>
          <div className="flex gap-4 mb-4">
            <button
              onClick={checkAllowance}
              disabled={loading || !isConnected}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              检查授权额度
            </button>
            <button
              onClick={checkBalance}
              disabled={loading || !isConnected}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
            >
              检查STETH余额
            </button>
          </div>
          {allowance && (
            <p className="text-sm text-gray-700">当前授权: <span className="font-semibold">{allowance} STETH</span></p>
          )}
          {balance && (
            <p className="text-sm text-gray-700">账户余额: <span className="font-semibold">{balance} STETH</span></p>
          )}
        </div>

        {/* 测试区域 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">测试 ensureApprove</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              授权数量 (STETH):
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.1"
              min="0"
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="例如: 1.0"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              建议使用较小的数值进行测试，如 0.001 或 1
            </p>
          </div>

          <button
            onClick={testEnsureApprove}
            disabled={loading || !isConnected}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 font-semibold"
          >
            {loading ? '⏳ 执行中...' : '🚀 开始测试'}
          </button>
        </div>

        {/* 状态显示 */}
        {status && (
          <div className="bg-gray-100 rounded-lg p-6">
            <h3 className="font-semibold mb-2">测试状态:</h3>
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
              {status}
            </pre>
          </div>
        )}

        {/* 说明 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📖 测试说明:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>确保钱包已连接到 Sepolia 测试网</li>
            <li>确保账户有一定数量的 STETH 代币（测试网）</li>
            <li>输入要授权的数量（会授权给 Diamond 合约）</li>
            <li>点击"开始测试"按钮</li>
            <li>确认钱包弹出的交易签名请求</li>
            <li>等待交易确认（大约 15-30 秒）</li>
            <li>查看测试结果</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
