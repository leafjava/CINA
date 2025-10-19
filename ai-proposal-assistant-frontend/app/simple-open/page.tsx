'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import {
  CONTRACTS,
  getUSDCBalance,
  getWRMBBalance,
  getTokenBalance,
  approveUSDC,
  approveWRMB,
  approveToken,
  getNextPositionId,
  getPoolInfo,
  simpleOpenPosition,
  waitForTransaction,
  getPositionInfo,
  checkContract,
  type SimpleOpenPositionParams
} from '@/lib/simple-position';
import Link from 'next/link';

// 代币配置
const TOKENS = {
  USDC: {
    address: CONTRACTS.USDC,
    symbol: 'USDC',
    decimals: 6,
    defaultAmount: '10'
  },
  WRMB: {
    address: CONTRACTS.WRMB,
    symbol: 'WRMB',
    decimals: 18,
    defaultAmount: '1000'
  }
};

export default function SimpleOpenPage() {
  const { address, isConnected } = useAccount();
  const [selectedToken, setSelectedToken] = useState<'USDC' | 'WRMB'>('WRMB');
  const [collateralAmount, setCollateralAmount] = useState('1000');
  const [ltv, setLtv] = useState('50'); // Loan-to-Value 比率
  const [positionId, setPositionId] = useState('1'); // 手动指定 Position ID
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState('');
  const [positionInfo, setPositionInfo] = useState<any>(null);

  const currentToken = TOKENS[selectedToken];

  // 切换代币时更新默认金额
  const handleTokenChange = (token: 'USDC' | 'WRMB') => {
    setSelectedToken(token);
    setCollateralAmount(TOKENS[token].defaultAmount);
    setTokenBalance('');
  };

  // 检查代币余额
  const checkBalance = async () => {
    if (!address) return;
    try {
      setStatus(`正在查询${currentToken.symbol}余额...`);
      const balance = await getTokenBalance(currentToken.address, address);
      const formatted = formatUnits(balance, currentToken.decimals);
      setTokenBalance(formatted);
      setStatus(`${currentToken.symbol}余额: ${formatted}`);
    } catch (error: any) {
      setStatus(`查询失败: ${error.message}`);
    }
  };

  // 计算债务金额
  const calculateDebtAmount = () => {
    const collateral = parseFloat(collateralAmount || '0');
    const ltvRatio = parseFloat(ltv || '0') / 100;
    return (collateral * ltvRatio).toFixed(2);
  };

  // 执行开仓
  const handleOpenPosition = async () => {
    if (!address) {
      setStatus('❌ 请先连接钱包');
      return;
    }

    if (!collateralAmount || parseFloat(collateralAmount) <= 0) {
      setStatus('❌ 请输入有效的抵押品数量');
      return;
    }

    setIsLoading(true);
    setStatus('🚀 开始开仓流程...\n');

    try {
      // 0. 检查合约部署状态
      setStatus(prev => prev + '\n🔍 检查合约部署状态...');
      const poolManagerExists = await checkContract(CONTRACTS.PoolManager, 'PoolManager');
      const poolExists = await checkContract(CONTRACTS.AaveFundingPool, 'AaveFundingPool');
      
      if (!poolManagerExists) {
        setStatus(prev => prev + '\n❌ PoolManager合约未部署或地址错误！');
        setStatus(prev => prev + `\n合约地址: ${CONTRACTS.PoolManager}`);
        setIsLoading(false);
        return;
      }
      
      if (!poolExists) {
        setStatus(prev => prev + '\n❌ AaveFundingPool合约未部署或地址错误！');
        setStatus(prev => prev + `\n合约地址: ${CONTRACTS.AaveFundingPool}`);
        setIsLoading(false);
        return;
      }
      
      setStatus(prev => prev + '\n✅ 合约检查通过');

      // 1. 检查代币余额
      setStatus(prev => prev + `\n\n📊 检查${currentToken.symbol}余额...`);
      const balance = await getTokenBalance(currentToken.address, address);
      const collateralWei = parseUnits(collateralAmount, currentToken.decimals);
      
      if (balance < collateralWei) {
        setStatus(prev => prev + `\n❌ ${currentToken.symbol}余额不足！\n当前: ${formatUnits(balance, currentToken.decimals)} ${currentToken.symbol}\n需要: ${collateralAmount} ${currentToken.symbol}`);
        setIsLoading(false);
        return;
      }

      setStatus(prev => prev + `\n✅ 余额充足: ${formatUnits(balance, currentToken.decimals)} ${currentToken.symbol}`);

      // 2. 授权代币
      setStatus(prev => prev + `\n\n📝 授权${currentToken.symbol}给PoolManager...`);
      await approveToken(currentToken.address, address, collateralWei, currentToken.symbol);
      setStatus(prev => prev + '\n✅ 授权成功');

      // 3. 使用指定的 Position ID
      const posId = BigInt(positionId);
      setStatus(prev => prev + `\n\n🔢 使用 Position ID: ${posId}`);

      // 4. 计算债务金额
      const ltvRatio = parseFloat(ltv) / 100;
      const debtAmount = collateralWei * BigInt(Math.floor(ltvRatio * 10000)) / 10000n;
      // 如果抵押品不是18 decimals，需要转换到18 decimals (fxUSD)
      const decimalsDiff = 18 - currentToken.decimals;
      const debtWei = decimalsDiff > 0 
        ? debtAmount * (10n ** BigInt(decimalsDiff))
        : debtAmount / (10n ** BigInt(-decimalsDiff));
      
      setStatus(prev => prev + '\n\n📐 计算参数:');
      setStatus(prev => prev + `\n   抵押品: ${collateralAmount} ${currentToken.symbol}`);
      setStatus(prev => prev + `\n   LTV: ${ltv}%`);
      setStatus(prev => prev + `\n   债务: ${formatUnits(debtWei, 18)} fxUSD`);

      // 5. 获取池子信息
      setStatus(prev => prev + '\n\n🏊 检查池子状态...');
      try {
        const poolInfo = await getPoolInfo(CONTRACTS.AaveFundingPool);
        setStatus(prev => prev + '\n✅ 池子信息:');
        setStatus(prev => prev + `\n   抵押品容量: ${formatUnits(poolInfo.collateralCapacity, currentToken.decimals)} ${currentToken.symbol}`);
        setStatus(prev => prev + `\n   债务容量: ${formatUnits(poolInfo.debtCapacity, 18)} fxUSD`);
      } catch (e: any) {
        setStatus(prev => prev + `\n⚠️ 无法读取池子信息: ${e.message}`);
      }

      // 6. 执行开仓
      setStatus(prev => prev + '\n\n📤 发送开仓交易，请在MetaMask中确认...');
      
      const params: SimpleOpenPositionParams = {
        user: address,
        pool: CONTRACTS.AaveFundingPool,
        positionId: posId,
        collateralAmount: collateralWei,
        debtAmount: debtWei,
        collateralToken: currentToken.symbol,
        collateralDecimals: currentToken.decimals
      };

      const txHash = await simpleOpenPosition(params);
      
      setStatus(prev => prev + `\n✅ 交易已发送: ${txHash}`);
      setStatus(prev => prev + `\n\n⏳ 等待交易确认...`);

      // 7. 等待确认
      const result = await waitForTransaction(txHash);
      
      if (result === 'success') {
        setStatus(prev => prev + '\n\n🎉 开仓成功！');
        setStatus(prev => prev + `\n\n在Sepolia Etherscan查看:\nhttps://sepolia.etherscan.io/tx/${txHash}`);

        // 8. 查询仓位信息
        setStatus(prev => prev + '\n\n📋 查询仓位信息...');
        try {
          const position = await getPositionInfo(CONTRACTS.AaveFundingPool, posId);
          setPositionInfo({
            id: posId,
            collateral: formatUnits(position.collateral, currentToken.decimals),
            debt: formatUnits(position.debt, 18),
            tokenSymbol: currentToken.symbol
          });
          setStatus(prev => prev + '\n✅ 仓位已创建:');
          setStatus(prev => prev + `\n   Position ID: ${posId}`);
          setStatus(prev => prev + `\n   抵押品: ${formatUnits(position.collateral, currentToken.decimals)} ${currentToken.symbol}`);
          setStatus(prev => prev + `\n   债务: ${formatUnits(position.debt, 18)} fxUSD`);
        } catch (e: any) {
          setStatus(prev => prev + `\n⚠️ 查询仓位失败: ${e.message}`);
        }
      } else {
        setStatus(prev => prev + '\n\n❌ 交易失败 (reverted)');
      }

    } catch (error: any) {
      console.error('开仓失败:', error);
      let errorMsg = '\n\n❌ 开仓失败\n\n';
      
      if (error.message?.includes('User rejected')) {
        errorMsg += '用户取消了交易';
      } else if (error.message?.includes('insufficient funds')) {
        errorMsg += '账户ETH余额不足支付gas费';
      } else if (error.message?.includes('revert')) {
        errorMsg += `合约执行失败: ${error.message}\n\n`;
        errorMsg += '可能的原因:\n';
        errorMsg += '   - Price Oracle 未设置或返回无效价格\n';
        errorMsg += '   - 池子参数配置不正确\n';
        errorMsg += '   - Debt ratio 超出允许范围\n';
        errorMsg += '   - 池子未正确初始化';
      } else {
        errorMsg += `错误: ${error.message || error.shortMessage || error.toString()}`;
      }
      
      setStatus(prev => prev + errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-white">
      <div className="max-w-5xl mx-auto p-6">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="text-blue-400 hover:text-blue-300 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>返回首页</span>
          </Link>
        </div>

        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            💰 简单开仓
          </h1>
          <p className="text-gray-400">使用 PoolManager.operate 进行简单开仓</p>
        </div>

        {/* 连接状态 */}
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
                  <span className="text-gray-400 text-sm">{currentToken.symbol}余额</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-medium">{tokenBalance || '--'} {currentToken.symbol}</span>
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

        {/* 合约地址 */}
        <div className="bg-[#1E2329] rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">📋 合约配置</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 bg-[#2B3139] rounded">
              <span className="text-gray-400">PoolManager</span>
              <code className="text-xs text-blue-400">{CONTRACTS.PoolManager}</code>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#2B3139] rounded">
              <span className="text-gray-400">AaveFundingPool</span>
              <code className="text-xs text-purple-400">{CONTRACTS.AaveFundingPool}</code>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#2B3139] rounded">
              <span className="text-gray-400">USDC</span>
              <code className="text-xs text-green-400">{CONTRACTS.USDC}</code>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#2B3139] rounded">
              <span className="text-gray-400">WRMB</span>
              <code className="text-xs text-orange-400">{CONTRACTS.WRMB}</code>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#2B3139] rounded">
              <span className="text-gray-400">测试网络</span>
              <span className="text-yellow-400 font-medium">Sepolia</span>
            </div>
          </div>
        </div>

        {/* 开仓参数 */}
        <div className="bg-[#1E2329] rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">🎯 开仓参数</h2>
          
          <div className="space-y-6">
            {/* 代币选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                抵押品代币
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleTokenChange('USDC')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                    selectedToken === 'USDC'
                      ? 'bg-green-500 text-white'
                      : 'bg-[#2B3139] text-gray-400 hover:bg-[#343B45]'
                  }`}
                >
                  USDC
                </button>
                <button
                  onClick={() => handleTokenChange('WRMB')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                    selectedToken === 'WRMB'
                      ? 'bg-orange-500 text-white'
                      : 'bg-[#2B3139] text-gray-400 hover:bg-[#343B45]'
                  }`}
                >
                  WRMB
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                选择用作抵押品的代币
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                抵押品数量 ({currentToken.symbol})
              </label>
              <input
                type="text"
                value={collateralAmount}
                onChange={(e) => setCollateralAmount(e.target.value)}
                placeholder={currentToken.defaultAmount}
                className="w-full bg-[#2B3139] border border-[#3B4149] rounded-lg px-4 py-3 text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all"
              />
              <p className="text-xs text-gray-400 mt-2">
                建议: {currentToken.defaultAmount} {currentToken.symbol} (测试用)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                LTV 比率 (%)
              </label>
              <input
                type="text"
                value={ltv}
                onChange={(e) => setLtv(e.target.value)}
                placeholder="50"
                className="w-full bg-[#2B3139] border border-[#3B4149] rounded-lg px-4 py-3 text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all"
              />
              <p className="text-xs text-gray-400 mt-2">
                借款金额 = 抵押品数量 × LTV比率
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Position ID
              </label>
              <input
                type="text"
                value={positionId}
                onChange={(e) => setPositionId(e.target.value)}
                placeholder="1"
                className="w-full bg-[#2B3139] border border-[#3B4149] rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
              />
              <p className="text-xs text-gray-400 mt-2">
                指定要使用的 Position ID（通常从 1 开始）
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-blue-400 font-semibold mb-2">💡 计算结果</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">抵押品:</span>
                  <span className="font-medium">{collateralAmount || '0'} {currentToken.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">LTV:</span>
                  <span className="font-medium">{ltv || '0'}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">将铸造:</span>
                  <span className="font-medium text-green-400">{calculateDebtAmount()} fxUSD</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleOpenPosition}
              disabled={!isConnected || isLoading}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
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
                '💰 开仓'
              )}
            </button>
          </div>
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

        {/* 仓位信息 */}
        {positionInfo && (
          <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-xl p-6 border border-green-500/30">
            <h3 className="text-xl font-semibold mb-4 text-green-400">🎉 仓位已创建</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1E2329]/80 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Position ID</div>
                <div className="text-2xl font-bold text-white">{positionInfo.id}</div>
              </div>
              <div className="bg-[#1E2329]/80 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">抵押品</div>
                <div className="text-2xl font-bold text-blue-400">{positionInfo.collateral} {positionInfo.tokenSymbol}</div>
              </div>
              <div className="bg-[#1E2329]/80 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">债务</div>
                <div className="text-2xl font-bold text-green-400">{positionInfo.debt} fxUSD</div>
              </div>
            </div>
          </div>
        )}

        {/* 开仓流程说明 */}
        <div className="bg-[#1E2329] rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">📖 开仓流程</h2>
          <div className="space-y-4">
            {[
              { step: 1, title: '选择代币', desc: '选择USDC或WRMB作为抵押品' },
              { step: 2, title: '检查余额', desc: '确认代币余额充足' },
              { step: 3, title: '授权代币', desc: '授权PoolManager使用代币' },
              { step: 4, title: '获取PositionID', desc: '从PoolManager获取下一个ID' },
              { step: 5, title: '计算参数', desc: '根据LTV计算债务金额' },
              { step: 6, title: '执行开仓', desc: '调用PoolManager.operate()' },
              { step: 7, title: '等待确认', desc: '等待交易在链上确认' },
              { step: 8, title: '查询仓位', desc: '获取新创建的仓位信息' }
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start space-x-4 p-4 bg-[#2B3139] rounded-lg hover:bg-[#343B45] transition-colors">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center font-bold">
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

