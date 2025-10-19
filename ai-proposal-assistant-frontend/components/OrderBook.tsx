'use client';

import { useEffect, useState } from 'react';

interface OrderBookProps {
  symbol: string;
}

interface Order {
  price: number;
  amount: number;
  total: number;
}

// 不同合约的基础价格
const getBasePrice = (symbol: string): number => {
  const prices: { [key: string]: number } = {
    'BTCUSDT': 106961.2,
    'ETHUSDT': 3889.08,
    'BNBUSDT': 689.45,
    'SOLUSDT': 238.67,
    'XRPUSDT': 2.84,
    'ADAUSDT': 1.08,
    'DOGEUSDT': 0.38,
    'AVAXUSDT': 42.5,
    'MATICUSDT': 0.52,
    'DOTUSDT': 7.25,
    'LINKUSDT': 23.8,
    'UNIUSDT': 14.5,
    'ATOMUSDT': 10.2,
    'LTCUSDT': 108.5,
    'ETCUSDT': 28.9,
    'NEARUSDT': 5.45,
    'APTUSDT': 12.3,
    'ARBUSDT': 0.89,
    'OPUSDT': 2.15,
    'SUIUSDT': 4.28,
  };
  return prices[symbol] || 100;
};

export default function OrderBook({ symbol }: OrderBookProps) {
  const [asks, setAsks] = useState<Order[]>([]);
  const [bids, setBids] = useState<Order[]>([]);
  const [currentPrice, setCurrentPrice] = useState(() => getBasePrice(symbol));

  useEffect(() => {
    // 重置价格
    setCurrentPrice(getBasePrice(symbol));
    
    // 生成模拟订单簿数据
    const generateOrders = () => {
      const newAsks: Order[] = [];
      const newBids: Order[] = [];
      const basePrice = getBasePrice(symbol);
      const priceStep = basePrice > 1000 ? 0.1 : (basePrice > 100 ? 0.01 : 0.0001);

      // 生成卖单（asks）- 价格从高到低
      for (let i = 10; i >= 1; i--) {
        const price = basePrice + i * priceStep;
        const amount = Math.random() * 50 + 5;
        const total = price * amount;
        newAsks.push({ price, amount, total });
      }

      // 生成买单（bids）- 价格从高到低
      for (let i = 0; i < 10; i++) {
        const price = basePrice - i * priceStep;
        const amount = Math.random() * 50 + 5;
        const total = price * amount;
        newBids.push({ price, amount, total });
      }

      setAsks(newAsks);
      setBids(newBids);
    };

    generateOrders();

    // 模拟实时更新
    const interval = setInterval(() => {
      generateOrders();
      const currentBasePrice = getBasePrice(symbol);
      const priceChange = currentBasePrice > 1000 ? (Math.random() - 0.5) * 5 : 
                         currentBasePrice > 100 ? (Math.random() - 0.5) * 0.5 : 
                         (Math.random() - 0.5) * 0.001;
      setCurrentPrice(prev => prev + priceChange);
    }, 2000);

    return () => clearInterval(interval);
  }, [symbol]);

  const maxTotal = Math.max(
    ...asks.map(o => o.total),
    ...bids.map(o => o.total)
  );

  const OrderRow = ({ 
    order, 
    type 
  }: { 
    order: Order; 
    type: 'ask' | 'bid' 
  }) => {
    const percentage = (order.total / maxTotal) * 100;
    
    return (
      <div className="relative h-5 hover:bg-[#2B3139] cursor-pointer group">
        {/* 背景条 */}
        <div
          className={`absolute inset-y-0 right-0 ${
            type === 'ask' ? 'bg-red-500/10' : 'bg-green-500/10'
          }`}
          style={{ width: `${percentage}%` }}
        />
        
        {/* 内容 */}
        <div className="relative flex items-center justify-between px-3 text-xs h-full">
          <span className={type === 'ask' ? 'text-red-400' : 'text-green-400'}>
            {order.price > 1000 ? order.price.toFixed(1) : 
             order.price > 1 ? order.price.toFixed(2) : 
             order.price.toFixed(4)}
          </span>
          <span className="text-gray-300">
            {order.amount.toFixed(3)}
          </span>
          <span className="text-gray-400">
            {order.total.toFixed(0)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#0B0E11]">
      {/* 头部 */}
      <div className="h-12 border-b border-[#2B3139] flex items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium">订单簿</span>
          <button className="text-xs text-gray-400 hover:text-white">
            0.01
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-1 hover:bg-[#2B3139] rounded">
            <div className="w-4 h-4 flex flex-col justify-center space-y-0.5">
              <div className="h-0.5 bg-red-400"></div>
              <div className="h-0.5 bg-green-400"></div>
            </div>
          </button>
        </div>
      </div>

      {/* 表头 */}
      <div className="h-8 flex items-center justify-between px-3 text-xs text-gray-500">
        <span>价格(USDT)</span>
        <span>数量(ETH)</span>
        <span>合计(ETH)</span>
      </div>

      {/* 订单簿内容 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 卖单区域 */}
        <div className="flex-1 flex flex-col-reverse overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
          {asks.map((order, idx) => (
            <OrderRow key={`ask-${idx}`} order={order} type="ask" />
          ))}
        </div>

        {/* 当前价格 */}
        <div className="h-10 border-y border-[#2B3139] flex items-center justify-between px-3 bg-[#181A20]">
          <div className="flex items-center space-x-2">
            <span className="text-green-400 text-lg font-semibold">
              {currentPrice > 1000 ? currentPrice.toFixed(1) : 
               currentPrice > 1 ? currentPrice.toFixed(2) : 
               currentPrice.toFixed(4)}
            </span>
            <span className="text-xs text-green-400">↑</span>
          </div>
          <span className="text-xs text-gray-400">
            ${currentPrice > 1000 ? currentPrice.toFixed(1) : 
              currentPrice > 1 ? currentPrice.toFixed(2) : 
              currentPrice.toFixed(4)}
          </span>
        </div>

        {/* 买单区域 */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
          {bids.map((order, idx) => (
            <OrderRow key={`bid-${idx}`} order={order} type="bid" />
          ))}
        </div>
      </div>

      {/* 底部信息 */}
      <div className="h-10 border-t border-[#2B3139] flex items-center justify-between px-3 text-xs">
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-gray-400">最新成交</span>
          </div>
        </div>
        <button className="text-yellow-500 hover:text-yellow-400">
          更多 →
        </button>
      </div>
    </div>
  );
}

