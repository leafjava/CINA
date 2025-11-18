'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import ConnectWallet from '@/components/ConnectWallet';

// 验证者数据接口
interface Validator {
  name: string;
  description: string;
  staked: number;
  yourStaked: string | number;
  uptime: number;
  apr: number;
  status: string;
  commission: number;
}

// 模拟验证者数据
const validators: Validator[] = [
  {
    name: 'GalaxyDigital',
    description: 'Galaxy is a digital asset and blockchain leader...',
    staked: 1993262,
    yourStaked: '-',
    uptime: 28.12,
    apr: 0.61,
    status: '当前',
    commission: 5.00,
  },
  {
    name: 'Flowdex',
    description: 'Flowdesk is a leading global l...',
    staked: 1995174,
    yourStaked: '-',
    uptime: 100.00,
    apr: 2.29,
    status: '当前',
    commission: 0.00,
  },
  {
    name: 'LiquidSpirit x Rekt Gang',
    description: 'Collaboration between LiquidSp...',
    staked: 2526932,
    yourStaked: '-',
    uptime: 100.00,
    apr: 2.22,
    status: '当前',
    commission: 3.00,
  },
  {
    name: 'Hyperbeat x P2P x Hypio',
    description: 'Hyperbeat x P2P.org x Hypio is...',
    staked: 3621741,
    yourStaked: '-',
    uptime: 100.00,
    apr: 2.24,
    status: '当前',
    commission: 2.00,
  },
  {
    name: 'Purrposeful x HyBridge x PiP',
    description: 'Securing the network, bridging...',
    staked: 4539505,
    yourStaked: '-',
    uptime: 100.00,
    apr: 2.25,
    status: '当前',
    commission: 1.75,
  },
  {
    name: 'Your APR Maximizer HyperMaker...',
    description: 'Maximizing APR for stakers...',
    staked: 4758074,
    yourStaked: '-',
    uptime: 100.00,
    apr: 2.29,
    status: '当前',
    commission: 0.00,
  },
];

export default function StakingPage() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'performance' | 'rewards' | 'actions'>('performance');
  const [timeFilter, setTimeFilter] = useState('7D');

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 顶部标题和描述区域 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold text-green-500 mb-4">质押</h1>
            <p className="text-gray-400 text-sm md:text-base max-w-3xl">
              Hyperliquid L1是一个证明权益(PoS)区块链,质押者将本土代币 HYPE 委托给验证者以赚取质押奖励。
              当验证者成功参与共识时,质押者才会收到奖励,因此质押者应只委托给有信誉和可靠的验证者。
            </p>
          </div>
          <div className="flex-shrink-0">
            {!isConnected ? (
              <ConnectWallet />
            ) : (
              <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                建立连接
              </button>
            )}
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 左侧面板 - 质押概览 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 质押统计卡片 */}
            <div className="bg-[#101217] border border-[#20242c] rounded-xl p-6">
              <div className="space-y-4">
                <div>
                  <div className="text-gray-400 text-sm mb-1">总质押量</div>
                  <div className="text-3xl font-bold text-white">
                    {formatNumber(420296444)}
                  </div>
                </div>
                <div className="border-t border-[#20242c] pt-4">
                  <div className="text-gray-400 text-sm mb-1">您的质押</div>
                  <div className="text-2xl font-semibold text-white">
                    {formatNumber(0)}
                  </div>
                </div>
              </div>
            </div>

            {/* 标签页导航 */}
            <div className="bg-[#101217] border border-[#20242c] rounded-xl p-6">
              <div className="flex space-x-6 border-b border-[#20242c] mb-4">
                <button
                  onClick={() => setActiveTab('performance')}
                  className={`pb-3 px-2 transition-colors ${
                    activeTab === 'performance'
                      ? 'text-green-500 border-b-2 border-green-500'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  验证者表现
                </button>
                <button
                  onClick={() => setActiveTab('rewards')}
                  className={`pb-3 px-2 transition-colors ${
                    activeTab === 'rewards'
                      ? 'text-green-500 border-b-2 border-green-500'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  质押奖励历史
                </button>
                <button
                  onClick={() => setActiveTab('actions')}
                  className={`pb-3 px-2 transition-colors ${
                    activeTab === 'actions'
                      ? 'text-green-500 border-b-2 border-green-500'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  质押行动历史
                </button>
              </div>

              {/* 标签页内容 */}
              <div className="mt-4">
                {activeTab === 'performance' && (
                  <div className="text-gray-400 text-sm">
                    验证者表现数据将在这里显示
                  </div>
                )}
                {activeTab === 'rewards' && (
                  <div className="text-gray-400 text-sm">
                    质押奖励历史将在这里显示
                  </div>
                )}
                {activeTab === 'actions' && (
                  <div className="text-gray-400 text-sm">
                    质押行动历史将在这里显示
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧面板 - 质押余额 */}
          <div className="lg:col-span-1">
            <div className="bg-[#101217] border border-[#20242c] rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">质押余额</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">可转入质押钱包</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">0.00000000 HYPE</span>
                    <div className="w-6 h-6 bg-purple-500/20 rounded flex items-center justify-center">
                      <span className="text-purple-400 text-xs font-bold">P</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">可用于质押</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">0.00000000 HYPE</span>
                    <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center">
                      <span className="text-blue-400 text-xs font-bold">A</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">总质押量</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">0.00000000 HYPE</span>
                    <div className="w-6 h-6 bg-green-500/20 rounded flex items-center justify-center">
                      <span className="text-green-400 text-xs font-bold">A+</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#20242c]">
                  <span className="text-gray-400 text-sm">待处理的转账至现货余额</span>
                  <span className="text-white font-medium">0.00000000 HYPE</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 验证者列表表格 */}
        <div className="bg-[#101217] border border-[#20242c] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#20242c] flex justify-between items-center">
            <h2 className="text-lg font-semibold">验证者列表</h2>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-[#0A0B0D] border border-[#20242c] text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="7D">7D</option>
              <option value="30D">30D</option>
              <option value="90D">90D</option>
            </select>
          </div>

          {/* 表格 - 桌面端 */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0A0B0D] border-b border-[#20242c]">
                <tr>
                  <th className="text-left p-4 text-gray-400 text-sm font-medium">名称</th>
                  <th className="text-left p-4 text-gray-400 text-sm font-medium">描述</th>
                  <th className="text-right p-4 text-gray-400 text-sm font-medium">质押</th>
                  <th className="text-right p-4 text-gray-400 text-sm font-medium">您的质押</th>
                  <th className="text-right p-4 text-gray-400 text-sm font-medium">运行时间</th>
                  <th className="text-right p-4 text-gray-400 text-sm font-medium">预计年化收益率</th>
                  <th className="text-center p-4 text-gray-400 text-sm font-medium">状态</th>
                  <th className="text-right p-4 text-gray-400 text-sm font-medium">佣金</th>
                </tr>
              </thead>
              <tbody>
                {validators.map((validator, index) => (
                  <tr
                    key={index}
                    className="border-b border-[#20242c] hover:bg-[#0A0B0D]/50 transition-colors cursor-pointer"
                  >
                    <td className="p-4 text-white font-medium">{validator.name}</td>
                    <td className="p-4 text-gray-400 text-sm max-w-xs truncate">
                      {validator.description}
                    </td>
                    <td className="p-4 text-right text-white">
                      {formatNumber(validator.staked)}
                    </td>
                    <td className="p-4 text-right text-gray-400">
                      {validator.yourStaked === '-' ? '-' : formatNumber(Number(validator.yourStaked))}
                    </td>
                    <td className="p-4 text-right">
                      <span className={validator.uptime === 100 ? 'text-green-500' : 'text-yellow-500'}>
                        {validator.uptime.toFixed(2)}%
                      </span>
                    </td>
                    <td className="p-4 text-right text-green-500 font-medium">
                      {validator.apr.toFixed(2)}%
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">
                        {validator.status}
                      </span>
                    </td>
                    <td className="p-4 text-right text-gray-400">
                      {validator.commission.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 移动端卡片视图 */}
          <div className="md:hidden divide-y divide-[#20242c]">
            {validators.map((validator, index) => (
              <div key={index} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-medium mb-1">{validator.name}</h3>
                    <p className="text-gray-400 text-xs">{validator.description}</p>
                  </div>
                  <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">
                    {validator.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-400 text-xs mb-1">质押</div>
                    <div className="text-white">{formatNumber(validator.staked)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">您的质押</div>
                    <div className="text-gray-400">
                      {validator.yourStaked === '-' ? '-' : formatNumber(Number(validator.yourStaked))}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">运行时间</div>
                    <div className={validator.uptime === 100 ? 'text-green-500' : 'text-yellow-500'}>
                      {validator.uptime.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">预计年化收益率</div>
                    <div className="text-green-500 font-medium">{validator.apr.toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">佣金</div>
                    <div className="text-gray-400">{validator.commission.toFixed(2)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部链接 */}
        <div className="mt-8 flex flex-wrap justify-end gap-4 text-sm text-gray-400">
          <a href="#" className="hover:text-white transition-colors">文档D0发持</a>
          <a href="#" className="hover:text-white transition-colors">条款</a>
          <a href="#" className="hover:text-white transition-colors">隐私政策</a>
        </div>
      </div>
    </div>
  );
}
