'use client';

import { useState } from 'react';

interface TradingPanelProps {
  symbol: string;
  leverage: number;
  onLeverageChange: (leverage: number) => void;
  isMobile?: boolean;
}

export default function TradingPanel({ 
  symbol, 
  leverage, 
  onLeverageChange,
  isMobile = false
}: TradingPanelProps) {
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [marginType, setMarginType] = useState<'cross' | 'isolated'>('cross');
  const [price, setPrice] = useState('3882.73');
  const [amount, setAmount] = useState('');
  const [total, setTotal] = useState('0');
  const [showLeverageModal, setShowLeverageModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'open' | 'close'>('open'); // 开仓/平仓切换

  const handleAmountChange = (value: string) => {
    setAmount(value);
    const numAmount = parseFloat(value) || 0;
    const numPrice = parseFloat(price) || 0;
    setTotal((numAmount * numPrice).toFixed(2));
  };

  const leverageOptions = [1, 2, 3, 5, 10, 20, 25, 50, 70];

  if (isMobile) {
    // 移动端简化版
    return (
      <div className="h-full bg-[#0B0E11] flex flex-col overflow-hidden">
        {/* 开仓/平仓标签 */}
        <div className="h-12 border-b border-[#2B3139] flex items-center px-4 flex-shrink-0">
          <div className="flex space-x-3">
            <button 
              onClick={() => setActiveTab('open')}
              className={`text-sm font-medium pb-3 ${
                activeTab === 'open' 
                  ? 'text-yellow-500 border-b-2 border-yellow-500' 
                  : 'text-gray-400'
              }`}
            >
              开仓
            </button>
            <button 
              onClick={() => setActiveTab('close')}
              className={`text-sm font-medium pb-3 ${
                activeTab === 'close' 
                  ? 'text-yellow-500 border-b-2 border-yellow-500' 
                  : 'text-gray-400'
              }`}
            >
              平仓
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-3">
          {activeTab === 'open' ? (
            // 开仓界面
            <div className="h-full flex flex-col">
              {/* 杠杆选择 */}
              <div className="mb-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">杠杆倍数</span>
            <button
              onClick={() => setShowLeverageModal(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-[#2B3139] rounded text-yellow-500 font-medium"
            >
              <span>{leverage}x</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* 保证金模式 */}
        <div className="flex space-x-2 mb-3">
          <button
            onClick={() => setMarginType('cross')}
            className={`flex-1 py-1.5 text-xs rounded ${
              marginType === 'cross'
                ? 'bg-[#2B3139] text-white'
                : 'bg-[#1E2329] text-gray-400'
            }`}
          >
            逐仓
          </button>
          <button
            onClick={() => setMarginType('isolated')}
            className={`flex-1 py-1.5 text-xs rounded ${
              marginType === 'isolated'
                ? 'bg-[#2B3139] text-white'
                : 'bg-[#1E2329] text-gray-400'
            }`}
          >
            全仓
          </button>
        </div>

        {/* 订单类型 */}
        <div className="flex space-x-2 mb-3">
          <button
            onClick={() => setOrderType('limit')}
            className={`flex-1 py-1.5 text-xs rounded ${
              orderType === 'limit'
                ? 'bg-[#2B3139] text-white'
                : 'bg-[#1E2329] text-gray-400'
            }`}
          >
            限价
          </button>
          <button
            onClick={() => setOrderType('market')}
            className={`flex-1 py-1.5 text-xs rounded ${
              orderType === 'market'
                ? 'bg-[#2B3139] text-white'
                : 'bg-[#1E2329] text-gray-400'
            }`}
          >
            市价
          </button>
        </div>

        {/* 价格输入 */}
        {orderType === 'limit' && (
          <div className="mb-3">
            <label className="text-xs text-gray-400 mb-1 block">价格</label>
            <div className="relative">
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-[#1E2329] border border-[#2B3139] rounded px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none"
                placeholder="价格"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                USDT
              </span>
            </div>
          </div>
        )}

        {/* 数量输入 */}
        <div className="mb-3">
          <label className="text-xs text-gray-400 mb-1 block">数量</label>
          <div className="relative">
            <input
              type="text"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full bg-[#1E2329] border border-[#2B3139] rounded px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none"
              placeholder="数量"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
              ETH
            </span>
          </div>
        </div>

        {/* 数量百分比 */}
        <div className="flex space-x-2 mb-3">
          {[25, 50, 75, 100].map((percent) => (
            <button
              key={percent}
              onClick={() => handleAmountChange((percent * 0.01).toString())}
              className="flex-1 py-1.5 text-xs bg-[#1E2329] hover:bg-[#2B3139] rounded text-gray-400"
            >
              {percent}%
            </button>
          ))}
        </div>

              {/* 买入/卖出按钮 */}
              <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
                <button className="py-3 bg-green-500 hover:bg-green-600 rounded font-medium text-white text-sm transition-colors">
                  做多
                </button>
                <button className="py-3 bg-red-500 hover:bg-red-600 rounded font-medium text-white text-sm transition-colors">
                  做空
                </button>
              </div>
            </div>
          ) : (
            // 平仓界面
            <div className="h-full flex flex-col">
              <div className="mb-4 p-3 bg-[#1E2329] rounded">
                <div className="text-xs text-gray-400 mb-2">当前持仓</div>
                <div className="text-center py-8 text-gray-500">
                  暂无持仓
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">可平仓位</span>
                  <span className="text-white">0 ETH</span>
                </div>

                {/* 平仓数量 */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">平仓数量</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-[#1E2329] border border-[#2B3139] rounded px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none"
                      placeholder="数量"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                      ETH
                    </span>
                  </div>
                </div>

                {/* 平仓百分比 */}
                <div className="flex space-x-2">
                  {[25, 50, 75, 100].map((percent) => (
                    <button
                      key={percent}
                      onClick={() => setAmount('')}
                      className="flex-1 py-1.5 text-xs bg-[#1E2329] hover:bg-[#2B3139] rounded text-gray-400"
                    >
                      {percent}%
                    </button>
                  ))}
                </div>

                {/* 平仓按钮 */}
                <button 
                  className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 rounded font-medium text-black text-sm transition-colors mt-4"
                  disabled
                >
                  确认平仓
                </button>

                <div className="text-xs text-gray-500 text-center">
                  请先开仓后再进行平仓操作
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 杠杆选择模态框 */}
        {showLeverageModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#181A20] rounded-lg p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">调整杠杆</h3>
                <button
                  onClick={() => setShowLeverageModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">当前杠杆</span>
                  <span className="text-yellow-500 text-xl font-bold">{leverage}x</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {leverageOptions.map((lev) => (
                    <button
                      key={lev}
                      onClick={() => {
                        onLeverageChange(lev);
                        setShowLeverageModal(false);
                      }}
                      className={`py-3 rounded text-sm ${
                        leverage === lev
                          ? 'bg-yellow-500 text-black font-bold'
                          : 'bg-[#2B3139] text-white hover:bg-[#3B4149]'
                      }`}
                    >
                      {lev}x
                    </button>
                  ))}
                </div>

                <div className="pt-4">
                  <input
                    type="range"
                    min="1"
                    max="125"
                    value={leverage}
                    onChange={(e) => onLeverageChange(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 桌面端完整版
  return (
    <div className="h-full bg-[#0B0E11] flex flex-col overflow-hidden">
      {/* 头部标签 */}
      <div className="h-12 border-b border-[#2B3139] flex items-center px-4 flex-shrink-0">
        <div className="flex space-x-3">
          <button 
            onClick={() => setActiveTab('open')}
            className={`text-sm font-medium pb-3 ${
              activeTab === 'open' 
                ? 'text-yellow-500 border-b-2 border-yellow-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            开仓
          </button>
          <button 
            onClick={() => setActiveTab('close')}
            className={`text-sm font-medium pb-3 ${
              activeTab === 'close' 
                ? 'text-yellow-500 border-b-2 border-yellow-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            平仓
          </button>
        </div>
      </div>

      {/* 交易表单 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
        {activeTab === 'open' ? (
          // 开仓表单
          <>
        {/* 订单类型 */}
        <div className="flex space-x-2">
          <button
            onClick={() => setOrderType('limit')}
            className={`flex-1 py-1.5 text-xs rounded ${
              orderType === 'limit'
                ? 'bg-[#2B3139] text-white'
                : 'text-gray-400 hover:bg-[#1E2329]'
            }`}
          >
            限价委托
          </button>
          <button
            onClick={() => setOrderType('market')}
            className={`flex-1 py-1.5 text-xs rounded ${
              orderType === 'market'
                ? 'bg-[#2B3139] text-white'
                : 'text-gray-400 hover:bg-[#1E2329]'
            }`}
          >
            市价委托
          </button>
        </div>

        {/* 保证金模式和杠杆 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setMarginType(marginType === 'cross' ? 'isolated' : 'cross')}
              className="text-xs text-gray-400 hover:text-yellow-500"
            >
              {marginType === 'cross' ? '全仓' : '逐仓'}
            </button>
          </div>
          
          <button
            onClick={() => setShowLeverageModal(true)}
            className="flex items-center space-x-1 text-yellow-500 hover:text-yellow-400 text-sm"
          >
            <span>{leverage}x</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* 可用余额 */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">可用</span>
          <span className="text-white">0 USDT</span>
        </div>

        {/* 价格输入 */}
        {orderType === 'limit' && (
          <div className="space-y-1">
            <label className="text-xs text-gray-400">价格</label>
            <div className="relative">
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-[#1E2329] border border-[#2B3139] rounded px-2 py-1.5 text-sm text-white focus:border-yellow-500 focus:outline-none"
                placeholder="价格"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                USDT
              </span>
            </div>
          </div>
        )}

        {/* 数量输入 */}
        <div className="space-y-1">
          <label className="text-xs text-gray-400">数量</label>
          <div className="relative">
            <input
              type="text"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full bg-[#1E2329] border border-[#2B3139] rounded px-2 py-1.5 text-sm text-white focus:border-yellow-500 focus:outline-none"
              placeholder="数量"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
              ETH
            </span>
          </div>
        </div>

        {/* 数量百分比选择器 */}
        <div className="flex space-x-2">
          {[25, 50, 75, 100].map((percent) => (
            <button
              key={percent}
              onClick={() => handleAmountChange((percent * 0.01).toString())}
              className="flex-1 py-1 text-xs bg-[#1E2329] hover:bg-[#2B3139] rounded text-gray-400"
            >
              {percent}%
            </button>
          ))}
        </div>

        {/* 总计 */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">合计</span>
          <span className="text-white">{total} USDT</span>
        </div>

        {/* 买入/卖出按钮 */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button className="py-2.5 bg-green-500 hover:bg-green-600 rounded font-medium text-white text-sm transition-colors">
            做多
          </button>
          <button className="py-2.5 bg-red-500 hover:bg-red-600 rounded font-medium text-white text-sm transition-colors">
            做空
          </button>
        </div>

          {/* 底部信息 */}
          <div className="pt-2 space-y-1 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>预估强平价</span>
              <span className="text-white">--</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>预估收益率</span>
              <span className="text-green-500">--</span>
            </div>
          </div>
        </>
        ) : (
          // 平仓表单
          <>
            <div className="mb-4 p-3 bg-[#1E2329] rounded">
              <div className="text-xs text-gray-400 mb-2">当前持仓</div>
              <div className="text-center py-6 text-gray-500 text-sm">
                暂无持仓
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">可平仓位</span>
                <span className="text-white">0 ETH</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400">平仓数量</label>
                <div className="relative">
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#1E2329] border border-[#2B3139] rounded px-2 py-1.5 text-sm text-white focus:border-yellow-500 focus:outline-none"
                    placeholder="数量"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    ETH
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                {[25, 50, 75, 100].map((percent) => (
                  <button
                    key={percent}
                    onClick={() => setAmount('')}
                    className="flex-1 py-1 text-xs bg-[#1E2329] hover:bg-[#2B3139] rounded text-gray-400"
                  >
                    {percent}%
                  </button>
                ))}
              </div>

              <button 
                className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 rounded font-medium text-black text-sm transition-colors mt-4"
                disabled
              >
                确认平仓
              </button>

              <div className="text-xs text-gray-500 text-center">
                请先开仓后再进行平仓操作
              </div>
            </div>
          </>
        )}
      </div>

      {/* 杠杆选择模态框 */}
      {showLeverageModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#181A20] rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">调整杠杆</h3>
              <button
                onClick={() => setShowLeverageModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">当前杠杆</span>
                <span className="text-yellow-500">{leverage}x</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {leverageOptions.map((lev) => (
                  <button
                    key={lev}
                    onClick={() => {
                      onLeverageChange(lev);
                      setShowLeverageModal(false);
                    }}
                    className={`py-2 rounded text-sm ${
                      leverage === lev
                        ? 'bg-yellow-500 text-black'
                        : 'bg-[#2B3139] text-white hover:bg-[#3B4149]'
                    }`}
                  >
                    {lev}x
                  </button>
                ))}
              </div>

              <div className="pt-4">
                <input
                  type="range"
                  min="1"
                  max="125"
                  value={leverage}
                  onChange={(e) => onLeverageChange(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <button
                onClick={() => setShowLeverageModal(false)}
                className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 rounded text-black font-medium"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

