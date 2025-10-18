'use client';

import TradingChart from '@/components/TradingChart';
import OrderBook from '@/components/OrderBook';
import TradingPanel from '@/components/TradingPanel';
import { useState } from 'react';

export default function TradingPage() {
  const [symbol, setSymbol] = useState('ETHUSDT');
  const [leverage, setLeverage] = useState(20);

  return (
    <div className="h-screen bg-[#0B0E11] text-white flex flex-col overflow-hidden">
      {/* 顶部导航栏 */}
      <div className="h-14 bg-[#181A20] border-b border-[#2B3139] flex items-center px-4 flex-shrink-0">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-lg">{symbol}</span>
            <span className="bg-yellow-500/20 text-yellow-500 text-xs px-2 py-0.5 rounded">永续合约</span>
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
            <div>
              <div className="text-gray-400 text-xs">标记价格</div>
              <div className="text-white font-medium">3,888.56</div>
            </div>
            <div className="h-8 w-px bg-[#2B3139]"></div>
            <div>
              <div className="text-gray-400 text-xs">指数价格</div>
              <div className="text-white font-medium">3,888.11</div>
            </div>
            <div className="h-8 w-px bg-[#2B3139]"></div>
            <div>
              <div className="text-gray-400 text-xs">24h涨跌</div>
              <div className="text-green-500 font-medium">+97.98 +2.58%</div>
            </div>
            <div className="h-8 w-px bg-[#2B3139]"></div>
            <div>
              <div className="text-gray-400 text-xs">24h最高</div>
              <div className="text-white font-medium">3,926.00</div>
            </div>
            <div className="h-8 w-px bg-[#2B3139]"></div>
            <div>
              <div className="text-gray-400 text-xs">24h最低</div>
              <div className="text-white font-medium">3,712.51</div>
            </div>
            <div className="h-8 w-px bg-[#2B3139]"></div>
            <div>
              <div className="text-gray-400 text-xs">24h成交量(ETH)</div>
              <div className="text-white font-medium">3,933,780.122</div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* 左侧：K线图 */}
        <div className="flex-1 flex flex-col min-w-0">
          <TradingChart symbol={symbol} />
        </div>

        {/* 右侧：订单簿 + 交易面板 */}
        <div className="w-[380px] flex flex-col border-l border-[#2B3139] flex-shrink-0">
          {/* 订单簿 */}
          <div className="h-[50%] border-b border-[#2B3139] min-h-0">
            <OrderBook symbol={symbol} />
          </div>

          {/* 交易面板 */}
          <div className="h-[50%] min-h-0">
            <TradingPanel 
              symbol={symbol} 
              leverage={leverage}
              onLeverageChange={setLeverage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

