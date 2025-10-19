'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import {
  CONTRACTS,
  checkTokenRateProvider,
  updateTokenRateProvider,
  updatePoolCapacity,
  getPoolInfo,
  waitForTransaction,
  checkContract,
  POOL_MANAGER_ABI,
  publicClient
} from '@/lib/simple-position';
import Link from 'next/link';
import { keccak256, toHex, parseEther, formatEther } from 'viem';

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [tokenAddress, setTokenAddress] = useState<string>('');
  const [rateProvider, setRateProvider] = useState<string>('0x0000000000000000000000000000000000000000');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentRate, setCurrentRate] = useState<{ rate: string; provider: string } | null>(null);
  const [contractInfo, setContractInfo] = useState<{ exists: boolean; hasAdminRole: boolean | null } | null>(null);
  
  // 池子容量相关状态
  const [poolAddress, setPoolAddress] = useState<string>(CONTRACTS.AaveFundingPool);
  const [collateralCapacity, setCollateralCapacity] = useState<string>('100000');
  const [debtCapacity, setDebtCapacity] = useState<string>('100000');
  const [currentPoolInfo, setCurrentPoolInfo] = useState<{ 
    collateralCapacity: string; 
    debtCapacity: string;
  } | null>(null);

  // 预设代币
  const PRESET_TOKENS = [
    { name: 'WRMB', address: CONTRACTS.WRMB },
    { name: 'USDC', address: CONTRACTS.USDC }
  ];

  const handleVerifyContract = async () => {
    if (!address) {
      setStatus('❌ 请先连接钱包');
      return;
    }

    setIsLoading(true);
    setStatus('🔍 验证合约和权限...\n');

    try {
      // 1. 检查合约是否存在
      setStatus(prev => prev + '\n📋 检查 PoolManager 合约...');
      const exists = await checkContract(CONTRACTS.PoolManager, 'PoolManager');
      
      if (!exists) {
        setStatus(prev => prev + '\n❌ PoolManager 合约不存在或地址错误！');
        setStatus(prev => prev + `\n合约地址: ${CONTRACTS.PoolManager}`);
        setContractInfo({ exists: false, hasAdminRole: null });
        setIsLoading(false);
        return;
      }

      setStatus(prev => prev + '\n✅ 合约存在');

      // 2. 检查管理员权限
      setStatus(prev => prev + '\n\n🔑 检查管理员权限...');
      
      try {
        // DEFAULT_ADMIN_ROLE = 0x0000000000000000000000000000000000000000000000000000000000000000
        const adminRole = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;
        
        const hasRole = await publicClient.readContract({
          address: CONTRACTS.PoolManager,
          abi: POOL_MANAGER_ABI,
          functionName: 'hasRole',
          args: [adminRole, address]
        }) as boolean;

        if (hasRole) {
          setStatus(prev => prev + '\n✅ 你拥有管理员权限！');
          setContractInfo({ exists: true, hasAdminRole: true });
        } else {
          setStatus(prev => prev + '\n❌ 你没有管理员权限');
          setStatus(prev => prev + '\n⚠️ 只有合约管理员才能设置汇率');
          setStatus(prev => prev + `\n当前地址: ${address}`);
          setContractInfo({ exists: true, hasAdminRole: false });
        }
      } catch (roleError: any) {
        setStatus(prev => prev + `\n⚠️ 无法检查权限: ${roleError.message}`);
        setStatus(prev => prev + '\n可能合约不支持 hasRole 函数');
        setContractInfo({ exists: true, hasAdminRole: null });
      }

    } catch (error: any) {
      setStatus(prev => prev + `\n\n❌ 验证失败: ${error.message}`);
      setContractInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckRate = async () => {
    if (!tokenAddress || !address) {
      setStatus('❌ 请输入代币地址并连接钱包');
      return;
    }

    setIsLoading(true);
    setStatus('🔍 检查汇率设置...');

    try {
      const rateInfo = await checkTokenRateProvider(tokenAddress as `0x${string}`);
      setCurrentRate({
        rate: rateInfo.rate.toString(),
        provider: rateInfo.provider
      });

      if (rateInfo.rate === 0n) {
        setStatus('✅ 检查完成\n⚠️ 该代币尚未设置汇率');
      } else {
        setStatus(`✅ 检查完成\n当前汇率: ${rateInfo.rate.toString()}\n提供者: ${rateInfo.provider}`);
      }
    } catch (error: any) {
      setStatus(`❌ 检查失败: ${error.message}`);
      setCurrentRate(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetRate = async () => {
    if (!tokenAddress || !address) {
      setStatus('❌ 请输入代币地址并连接钱包');
      return;
    }

    setIsLoading(true);
    setStatus('🚀 开始设置汇率提供者...\n');

    try {
      setStatus(prev => prev + '\n📝 请在MetaMask中确认交易...');
      
      const txHash = await updateTokenRateProvider(
        tokenAddress as `0x${string}`,
        rateProvider as `0x${string}`,
        address
      );

      setStatus(prev => prev + `\n✅ 交易已发送: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`);
      setStatus(prev => prev + '\n⏳ 等待确认...');

      const result = await waitForTransaction(txHash);

      if (result === 'success') {
        setStatus(prev => prev + '\n\n🎉 汇率提供者设置成功！');
        setStatus(prev => prev + `\n\n在区块浏览器查看:\nhttps://sepolia.etherscan.io/tx/${txHash}`);
        
        // 重新检查
        await handleCheckRate();
      } else {
        setStatus(prev => prev + '\n\n❌ 交易失败');
      }
    } catch (error: any) {
      if (error.message?.includes('AccessControlUnauthorizedAccount')) {
        setStatus(prev => prev + '\n\n❌ 权限不足！只有合约管理员才能设置汇率');
      } else {
        setStatus(prev => prev + `\n\n❌ 设置失败: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckPoolCapacity = async () => {
    if (!poolAddress) {
      setStatus('❌ 请输入池子地址');
      return;
    }

    setIsLoading(true);
    setStatus('🔍 检查池子容量...');

    try {
      const poolInfo = await getPoolInfo(poolAddress as `0x${string}`);
      setCurrentPoolInfo({
        collateralCapacity: formatEther(poolInfo.collateralCapacity),
        debtCapacity: formatEther(poolInfo.debtCapacity)
      });

      setStatus('✅ 检查完成\n');
      setStatus(prev => prev + `当前抵押品容量: ${formatEther(poolInfo.collateralCapacity)} Token\n`);
      setStatus(prev => prev + `当前债务容量: ${formatEther(poolInfo.debtCapacity)} fxUSD`);
    } catch (error: any) {
      setStatus(`❌ 检查失败: ${error.message}`);
      setCurrentPoolInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePoolCapacity = async () => {
    if (!poolAddress || !address) {
      setStatus('❌ 请输入池子地址并连接钱包');
      return;
    }

    if (!collateralCapacity || !debtCapacity) {
      setStatus('❌ 请输入容量值');
      return;
    }

    setIsLoading(true);
    setStatus('🚀 开始更新池子容量...\n');

    try {
      setStatus(prev => prev + '\n📝 请在MetaMask中确认交易...');
      
      const collateralWei = parseEther(collateralCapacity);
      const debtWei = parseEther(debtCapacity);
      
      const txHash = await updatePoolCapacity(
        poolAddress as `0x${string}`,
        collateralWei,
        debtWei,
        address
      );

      setStatus(prev => prev + `\n✅ 交易已发送: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`);
      setStatus(prev => prev + '\n⏳ 等待确认...');

      const result = await waitForTransaction(txHash);

      if (result === 'success') {
        setStatus(prev => prev + '\n\n🎉 池子容量更新成功！');
        setStatus(prev => prev + `\n\n在区块浏览器查看:\nhttps://sepolia.etherscan.io/tx/${txHash}`);
        
        // 重新检查
        await handleCheckPoolCapacity();
      } else {
        setStatus(prev => prev + '\n\n❌ 交易失败');
      }
    } catch (error: any) {
      if (error.message?.includes('AccessControlUnauthorizedAccount')) {
        setStatus(prev => prev + '\n\n❌ 权限不足！只有合约管理员才能更新池子容量');
      } else {
        setStatus(prev => prev + `\n\n❌ 更新失败: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOneClickSetup = async () => {
    if (!address) {
      setStatus('❌ 请先连接钱包');
      return;
    }

    setIsLoading(true);
    setStatus('🚀 开始一键初始化...\n');
    setStatus(prev => prev + '这将完成以下操作：\n');
    setStatus(prev => prev + '1️⃣ 设置 WRMB 汇率\n');
    setStatus(prev => prev + '2️⃣ 设置 USDC 汇率\n');
    setStatus(prev => prev + '3️⃣ 更新池子容量\n\n');

    try {
      const zeroAddress = '0x0000000000000000000000000000000000000000' as `0x${string}`;
      
      // 步骤 1: 设置 WRMB 汇率
      setStatus(prev => prev + '━━━━━━━━━━━━━━━━━━━━━━\n');
      setStatus(prev => prev + '1️⃣ 设置 WRMB 汇率...\n');
      
      try {
        const rateTx1 = await updateTokenRateProvider(CONTRACTS.WRMB, zeroAddress, address);
        setStatus(prev => prev + `📝 交易已发送: ${rateTx1.slice(0, 10)}...\n`);
        setStatus(prev => prev + '⏳ 等待确认...\n');
        
        await waitForTransaction(rateTx1);
        setStatus(prev => prev + '✅ WRMB 汇率设置成功\n\n');
      } catch (e: any) {
        setStatus(prev => prev + `⚠️ WRMB 汇率设置失败: ${e.message}\n\n`);
      }

      // 步骤 2: 设置 USDC 汇率
      setStatus(prev => prev + '━━━━━━━━━━━━━━━━━━━━━━\n');
      setStatus(prev => prev + '2️⃣ 设置 USDC 汇率...\n');
      
      try {
        const rateTx2 = await updateTokenRateProvider(CONTRACTS.USDC, zeroAddress, address);
        setStatus(prev => prev + `📝 交易已发送: ${rateTx2.slice(0, 10)}...\n`);
        setStatus(prev => prev + '⏳ 等待确认...\n');
        
        await waitForTransaction(rateTx2);
        setStatus(prev => prev + '✅ USDC 汇率设置成功\n\n');
      } catch (e: any) {
        setStatus(prev => prev + `⚠️ USDC 汇率设置失败: ${e.message}\n\n`);
      }

      // 步骤 3: 更新池子容量
      setStatus(prev => prev + '━━━━━━━━━━━━━━━━━━━━━━\n');
      setStatus(prev => prev + '3️⃣ 更新池子容量...\n');
      
      try {
        const capacityTx = await updatePoolCapacity(
          CONTRACTS.AaveFundingPool,
          parseEther('100000'), // 100000 Token
          parseEther('100000'), // 100000 fxUSD
          address
        );
        setStatus(prev => prev + `📝 交易已发送: ${capacityTx.slice(0, 10)}...\n`);
        setStatus(prev => prev + '⏳ 等待确认...\n');
        
        await waitForTransaction(capacityTx);
        setStatus(prev => prev + '✅ 池子容量更新成功\n\n');
      } catch (e: any) {
        setStatus(prev => prev + `⚠️ 池子容量更新失败: ${e.message}\n\n`);
      }

      setStatus(prev => prev + '━━━━━━━━━━━━━━━━━━━━━━\n');
      setStatus(prev => prev + '🎉 初始化完成！\n\n');
      setStatus(prev => prev + '现在用户可以正常开仓了！\n');
      setStatus(prev => prev + '请前往 /simple-open 页面测试开仓功能。');

    } catch (error: any) {
      setStatus(prev => prev + `\n\n❌ 初始化失败: ${error.message}`);
      if (error.message?.includes('AccessControlUnauthorizedAccount')) {
        setStatus(prev => prev + '\n\n⚠️ 你没有管理员权限！');
        setStatus(prev => prev + '\n请使用部署合约的账户连接钱包。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link 
            href="/"
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <span>←</span>
            <span>返回首页</span>
          </Link>
        </div>

        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
            🔑 管理员工具
          </h1>
          <p className="text-gray-400">管理代币汇率提供者设置（仅管理员）</p>
        </div>

        {/* 连接状态 */}
        <div className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className={`w-2 h-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full mr-2`}></span>
            连接状态
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">状态</span>
              <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                {isConnected ? '✅ 已连接' : '❌ 未连接'}
              </span>
            </div>
            {isConnected && (
              <div className="flex justify-between">
                <span className="text-gray-400">钱包地址</span>
                <span className="text-sm font-mono text-blue-400">{address?.slice(0, 10)}...{address?.slice(-8)}</span>
              </div>
            )}
          </div>
        </div>

        {/* 合约地址与验证 */}
        <div className="bg-[#1E2329] rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold">📋 PoolManager 地址</h2>
              <code className="text-xs text-green-400 break-all block mt-2">{CONTRACTS.PoolManager}</code>
            </div>
            <button
              onClick={handleVerifyContract}
              disabled={!isConnected || isLoading}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-all text-sm"
            >
              🔍 验证合约
            </button>
          </div>
          
          {/* 合约验证信息 */}
          {contractInfo && (
            <div className={`mt-4 p-4 rounded-lg border ${
              contractInfo.hasAdminRole === true 
                ? 'bg-green-500/10 border-green-500/30' 
                : contractInfo.hasAdminRole === false
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-yellow-500/10 border-yellow-500/30'
            }`}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">合约状态:</span>
                  <span className={contractInfo.exists ? 'text-green-400' : 'text-red-400'}>
                    {contractInfo.exists ? '✅ 已部署' : '❌ 未部署'}
                  </span>
                </div>
                {contractInfo.hasAdminRole !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">管理员权限:</span>
                    <span className={contractInfo.hasAdminRole ? 'text-green-400' : 'text-red-400'}>
                      {contractInfo.hasAdminRole ? '✅ 拥有' : '❌ 没有'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 设置汇率 */}
        <div className="bg-[#1E2329] rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">⚙️ 设置汇率提供者</h2>

          <div className="space-y-6">
            {/* 预设代币 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                快速选择
              </label>
              <div className="flex space-x-3">
                {PRESET_TOKENS.map(token => (
                  <button
                    key={token.address}
                    onClick={() => setTokenAddress(token.address)}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-all"
                  >
                    {token.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 代币地址 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                代币地址
              </label>
              <input
                type="text"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-[#2B3139] border border-[#3B4149] rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
              />
            </div>

            {/* 汇率提供者地址 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                汇率提供者地址
              </label>
              <input
                type="text"
                value={rateProvider}
                onChange={(e) => setRateProvider(e.target.value)}
                placeholder="0x0000000000000000000000000000000000000000"
                className="w-full bg-[#2B3139] border border-[#3B4149] rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
              />
              <p className="text-xs text-gray-400 mt-2">
                💡 使用 0x0000...0000 让合约使用默认汇率计算（推荐）
              </p>
            </div>

            {/* 当前汇率信息 */}
            {currentRate && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-blue-400 font-semibold mb-2">当前设置</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">汇率 (rate):</span>
                    <span className="text-white font-mono">{currentRate.rate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">提供者:</span>
                    <span className="text-white font-mono text-xs">{currentRate.provider.slice(0, 10)}...{currentRate.provider.slice(-8)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex space-x-4">
              <button
                onClick={handleCheckRate}
                disabled={!isConnected || isLoading}
                className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg font-semibold transition-all"
              >
                🔍 检查当前设置
              </button>
              <button
                onClick={handleSetRate}
                disabled={!isConnected || isLoading}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed rounded-lg font-semibold transition-all shadow-lg"
              >
                {isLoading ? '⏳ 处理中...' : '🔧 设置汇率提供者'}
              </button>
            </div>
          </div>
        </div>

        {/* 更新池子容量 */}
        <div className="bg-[#1E2329] rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">📊 更新池子容量</h2>

          <div className="space-y-6">
            {/* 池子地址 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                池子地址
              </label>
              <input
                type="text"
                value={poolAddress}
                onChange={(e) => setPoolAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-[#2B3139] border border-[#3B4149] rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all"
              />
              <p className="text-xs text-gray-400 mt-2">
                当前默认: {CONTRACTS.AaveFundingPool}
              </p>
            </div>

            {/* 抵押品容量 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                抵押品容量 (Token数量)
              </label>
              <input
                type="text"
                value={collateralCapacity}
                onChange={(e) => setCollateralCapacity(e.target.value)}
                placeholder="100000"
                className="w-full bg-[#2B3139] border border-[#3B4149] rounded-lg px-4 py-3 text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all"
              />
              <p className="text-xs text-gray-400 mt-2">
                建议: 100000 Token（根据实际情况调整）
              </p>
            </div>

            {/* 债务容量 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                债务容量 (fxUSD数量)
              </label>
              <input
                type="text"
                value={debtCapacity}
                onChange={(e) => setDebtCapacity(e.target.value)}
                placeholder="100000"
                className="w-full bg-[#2B3139] border border-[#3B4149] rounded-lg px-4 py-3 text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all"
              />
              <p className="text-xs text-gray-400 mt-2">
                建议: 100000 fxUSD（根据实际情况调整）
              </p>
            </div>

            {/* 当前池子信息 */}
            {currentPoolInfo && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-green-400 font-semibold mb-2">当前容量</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">抵押品容量:</span>
                    <span className="text-white font-mono">{currentPoolInfo.collateralCapacity} Token</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">债务容量:</span>
                    <span className="text-white font-mono">{currentPoolInfo.debtCapacity} fxUSD</span>
                  </div>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex space-x-4">
              <button
                onClick={handleCheckPoolCapacity}
                disabled={!isConnected || isLoading}
                className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg font-semibold transition-all"
              >
                🔍 检查当前容量
              </button>
              <button
                onClick={handleUpdatePoolCapacity}
                disabled={!isConnected || isLoading}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed rounded-lg font-semibold transition-all shadow-lg"
              >
                {isLoading ? '⏳ 处理中...' : '📊 更新池子容量'}
              </button>
            </div>
          </div>
        </div>

        {/* 状态显示 */}
        {status && (
          <div className="bg-[#1E2329] rounded-xl p-6 mb-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-3">📊 执行状态</h3>
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-black/30 p-4 rounded-lg overflow-auto max-h-96">
              {status}
            </pre>
          </div>
        )}

        {/* 使用说明 */}
        <div className="mt-8 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
          <h3 className="text-yellow-400 font-semibold mb-3">⚠️ 重要提示</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• 此功能仅限 PoolManager 合约管理员使用</li>
            <li>• 普通用户调用会失败并显示权限错误</li>
            <li>• 建议使用 0x0000...0000 作为汇率提供者，让合约自动计算</li>
            <li>• 每个代币只需设置一次，之后所有用户都可以使用</li>
            <li>• 设置完成后，用户才能在该代币上开仓</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

