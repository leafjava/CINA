'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { 
  executeSimpleFlashLoan,
  getWBTCBalance,
  approveWBTCToReceiver,
  WBTC_ADDRESS,
  AAVE_POOL_ADDRESS,
  getFlashLoanFee,
  validateFlashLoanParams,
  isContract
} from '@/lib/flashloan';

export default function FlashLoanPage() {
  const { address, isConnected } = useAccount();
  const [receiverContract, setReceiverContract] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('0.001');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [wbtcBalance, setWbtcBalance] = useState('');

  // 检查WBTC余额
  const checkBalance = async () => {
    if (!address) return;
    try {
      const balance = await getWBTCBalance(address);
      const formatted = formatUnits(balance, 8); // WBTC有8位小数
      setWbtcBalance(formatted);
      setStatus(`WBTC余额: ${formatted}`);
    } catch (error: any) {
      setStatus(`查询失败: ${error.message}`);
    }
  };

  // 执行闪电贷
  const handleFlashLoan = async () => {
    if (!address || !receiverContract) {
      setStatus('❌ 请连接钱包并输入接收合约地址');
      return;
    }

    // 验证地址格式
    if (!receiverContract.startsWith('0x') || receiverContract.length !== 42) {
      setStatus('❌ 接收合约地址格式不正确！应该是42位的0x开头的地址');
      return;
    }

    setIsLoading(true);
    setStatus('🚀 开始闪电贷流程...\n');

    try {
      // 1. 解析借款金额
      const amountWei = parseUnits(borrowAmount, 8); // WBTC是8位小数
      setStatus(prev => prev + `\n📊 借款金额: ${borrowAmount} WBTC`);

      // 2. 预检查 - 这是关键！
      setStatus(prev => prev + '\n\n🔍 正在进行预检查...');
      const validation = await validateFlashLoanParams(
        receiverContract as `0x${string}`,
        amountWei
      );

      if (!validation.valid) {
        setStatus(
          '❌ 预检查失败！\n\n' + 
          validation.errors.join('\n\n') +
          '\n\n💡 请按照以下步骤操作：\n' +
          '1️⃣ 使用Remix部署contracts/SimpleFlashLoan.sol到Sepolia\n' +
          '2️⃣ 从Aave水龙头获取测试WBTC: https://staging.aave.com/faucet/\n' +
          '3️⃣ 向合约转入至少0.001 WBTC用于支付手续费\n' +
          '4️⃣ 重新尝试'
        );
        setIsLoading(false);
        return;
      }

      setStatus(prev => prev + '\n✅ 预检查通过！');

      // 3. 计算手续费
      const fee = await getFlashLoanFee(amountWei);
      const feeFormatted = formatUnits(fee, 8);
      setStatus(prev => prev + `\n💰 手续费(0.05%): ${feeFormatted} WBTC`);

      // 4. 检查接收合约余额（再次确认）
      const receiverBalance = await getWBTCBalance(receiverContract as `0x${string}`);
      const receiverBalanceFormatted = formatUnits(receiverBalance, 8);
      setStatus(prev => prev + `\n📦 接收合约余额: ${receiverBalanceFormatted} WBTC`);

      // 5. 执行闪电贷
      setStatus(prev => prev + '\n\n📤 发送闪电贷交易，请在MetaMask中确认...');
      const txHash = await executeSimpleFlashLoan({
        receiverAddress: receiverContract as `0x${string}`,
        asset: WBTC_ADDRESS,
        amount: amountWei,
        params: '0x',
        referralCode: 0,
        initiator: address
      });

      setStatus(
        `✅ 闪电贷交易已发送！\n\n` +
        `交易哈希: ${txHash}\n\n` +
        `在Sepolia Etherscan查看:\n` +
        `https://sepolia.etherscan.io/tx/${txHash}\n\n` +
        `⏳ 等待交易确认（约15-30秒）...`
      );
    } catch (error: any) {
      console.error('闪电贷失败:', error);
      let errorMsg = '❌ 闪电贷执行失败\n\n';
      
      if (error.message?.includes('User rejected')) {
        errorMsg += '用户取消了交易';
      } else if (error.message?.includes('insufficient funds')) {
        errorMsg += '账户ETH余额不足支付gas费';
      } else {
        errorMsg += `错误: ${error.message || error.shortMessage || error.toString()}`;
      }
      
      setStatus(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-white">
      <div className="max-w-5xl mx-auto p-6">
        {/* 顶部返回 */}
        <div className="mb-6">
          <a 
            href="/" 
            className="text-blue-400 hover:text-blue-300 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>返回首页</span>
          </a>
        </div>

        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            ⚡ Aave V3 闪电贷测试
          </h1>
          <p className="text-gray-400">在Sepolia测试网体验无抵押借贷 - 一借一还</p>
        </div>

        {/* 连接状态卡片 */}
        <div className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            连接状态
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-400 text-sm">钱包状态</span>
              <div className={`text-lg font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? '✅ 已连接' : '❌ 未连接'}
              </div>
            </div>
            {isConnected && (
              <>
                <div>
                  <span className="text-gray-400 text-sm">钱包地址</span>
                  <div className="text-sm font-mono text-blue-400 truncate">{address}</div>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">WBTC余额</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-medium">{wbtcBalance || '--'}</span>
                    <button
                      onClick={checkBalance}
                      className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-xs text-blue-400"
                    >
                      刷新
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Aave配置信息 */}
        <div className="bg-[#1E2329] rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">📋 Aave V3 配置</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 bg-[#2B3139] rounded">
              <span className="text-gray-400">Pool合约</span>
              <code className="text-xs text-blue-400">{AAVE_POOL_ADDRESS}</code>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#2B3139] rounded">
              <span className="text-gray-400">WBTC地址</span>
              <code className="text-xs text-purple-400">{WBTC_ADDRESS}</code>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#2B3139] rounded">
              <span className="text-gray-400">闪电贷手续费</span>
              <span className="text-yellow-400 font-medium">0.05%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#2B3139] rounded">
              <span className="text-gray-400">测试网络</span>
              <span className="text-green-400 font-medium">Sepolia</span>
            </div>
          </div>
        </div>

        {/* 重要提示 */}
        <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl p-6 mb-6">
          <h3 className="text-yellow-400 font-bold text-lg mb-3 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            前置要求
          </h3>
          <ul className="space-y-2 text-sm text-gray-200">
            <li className="flex items-start">
              <span className="text-yellow-400 mr-2">1.</span>
              <span><strong>部署FlashLoan接收合约</strong> - 必须实现IFlashLoanSimpleReceiver接口</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-400 mr-2">2.</span>
              <span><strong>向合约转入WBTC</strong> - 至少需要手续费金额（借款的0.05%）</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-400 mr-2">3.</span>
              <span><strong>获取测试WBTC</strong> - 访问 <a href="https://staging.aave.com/faucet/" target="_blank" className="text-blue-400 underline">Aave水龙头</a></span>
            </li>
          </ul>
        </div>

        {/* 接收合约地址输入 */}
        <div className="bg-[#1E2329] rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">🔧 FlashLoan接收合约</h2>
          <input
            type="text"
            value={receiverContract}
            onChange={(e) => setReceiverContract(e.target.value)}
            placeholder="0x... (已部署的FlashLoan接收合约地址)"
            className="w-full bg-[#2B3139] border border-[#3B4149] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
          />
          <p className="text-xs text-gray-400 mt-2">
            💡 提示: 需要先部署实现了IFlashLoanSimpleReceiver接口的合约
          </p>
        </div>

        {/* 借款参数 */}
        <div className="bg-[#1E2329] rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">💎 借款参数</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              借款数量（WBTC）
            </label>
            <input
              type="text"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
              className="w-full bg-[#2B3139] border border-[#3B4149] rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all"
            />
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-gray-400">建议测试金额: 0.001 WBTC</span>
              <span className="text-yellow-400">
                手续费: {(parseFloat(borrowAmount || '0') * 0.0005).toFixed(6)} WBTC
              </span>
            </div>
          </div>

          <button
            onClick={handleFlashLoan}
            disabled={!isConnected || !receiverContract || isLoading}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                执行中...
              </span>
            ) : (
              '⚡ 执行闪电贷'
            )}
          </button>
        </div>

        {/* 状态显示 */}
        {status && (
          <div className="bg-[#1E2329] rounded-xl p-6 mb-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></span>
              执行状态
            </h3>
            <pre className="text-sm text-gray-300 whitespace-pre-wrap break-all bg-[#0B0E11] p-4 rounded-lg font-mono">
              {status}
            </pre>
          </div>
        )}

        {/* 工作流程 */}
        <div className="bg-[#1E2329] rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">📖 闪电贷工作流程</h2>
          <div className="space-y-4">
            {[
              { step: 1, title: '请求借款', desc: '你的合约调用Pool.flashLoanSimple()' },
              { step: 2, title: '转账', desc: 'Pool将WBTC转给接收合约' },
              { step: 3, title: '执行操作', desc: 'Pool调用executeOperation()，你可以执行任意逻辑' },
              { step: 4, title: '授权还款', desc: '合约授权Pool提取本金+手续费' },
              { step: 5, title: '自动扣款', desc: 'Pool自动提取欠款' },
              { step: 6, title: '完成', desc: '交易在一个区块内完成✅' }
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start space-x-4 p-4 bg-[#2B3139] rounded-lg hover:bg-[#343B45] transition-colors">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold">
                  {step}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white mb-1">{title}</div>
                  <div className="text-sm text-gray-400">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

