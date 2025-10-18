'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';

interface TradingChartProps {
  symbol: string;
}

export default function TradingChart({ symbol }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const volumeChartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const volumeChartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [timeframe, setTimeframe] = useState('4h');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current || !volumeChartContainerRef.current) return;

    // 创建主K线图表
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0B0E11' },
        textColor: '#929AA5',
      },
      grid: {
        vertLines: { color: '#1B1E26' },
        horzLines: { color: '#1B1E26' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#2B3139',
      },
      timeScale: {
        borderColor: '#2B3139',
        timeVisible: true,
        visible: false, // 隐藏主图的时间轴
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    chartRef.current = chart;

    // 创建交易量图表（独立）
    const volumeChart = createChart(volumeChartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0B0E11' },
        textColor: '#929AA5',
      },
      grid: {
        vertLines: { color: '#1B1E26' },
        horzLines: { color: '#1B1E26' },
      },
      rightPriceScale: {
        borderColor: '#2B3139',
        scaleMargins: {
          top: 0.1,
          bottom: 0,
        },
      },
      timeScale: {
        borderColor: '#2B3139',
        timeVisible: true,
      },
      width: volumeChartContainerRef.current.clientWidth,
      height: volumeChartContainerRef.current.clientHeight,
    });

    volumeChartRef.current = volumeChart;

    // 添加蜡烛图系列
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#0ECB81',
      downColor: '#F6465D',
      borderVisible: false,
      wickUpColor: '#0ECB81',
      wickDownColor: '#F6465D',
    });

    candlestickSeriesRef.current = candlestickSeries;

    // 添加交易量系列到独立图表
    const volumeSeries = volumeChart.addHistogramSeries({
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    volumeSeriesRef.current = volumeSeries;

    // 生成模拟数据
    const generateData = () => {
      const data = [];
      const volumeData = [];
      let basePrice = 3800;
      const now = Math.floor(Date.now() / 1000);
      const interval = timeframe === '15m' ? 900 : timeframe === '1h' ? 3600 : 14400; // 4h default

      for (let i = 200; i >= 0; i--) {
        const time = (now - i * interval) as any;
        const open = basePrice + (Math.random() - 0.5) * 50;
        const close = open + (Math.random() - 0.5) * 80;
        const high = Math.max(open, close) + Math.random() * 30;
        const low = Math.min(open, close) - Math.random() * 30;
        const volume = Math.random() * 5000 + 1000;

        data.push({
          time,
          open,
          high,
          low,
          close,
        });

        volumeData.push({
          time,
          value: volume,
          color: close > open ? '#0ECB8180' : '#F6465D80',
        });

        basePrice = close;
      }

      return { data, volumeData };
    };

    const { data, volumeData } = generateData();
    candlestickSeries.setData(data);
    volumeSeries.setData(volumeData);

    // 同步时间轴
    chart.timeScale().subscribeVisibleLogicalRangeChange((timeRange) => {
      if (timeRange) {
        volumeChart.timeScale().setVisibleLogicalRange(timeRange);
      }
    });

    volumeChart.timeScale().subscribeVisibleLogicalRangeChange((timeRange) => {
      if (timeRange) {
        chart.timeScale().setVisibleLogicalRange(timeRange);
      }
    });

    // 响应式处理
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
      if (volumeChartContainerRef.current && volumeChartRef.current) {
        volumeChartRef.current.applyOptions({
          width: volumeChartContainerRef.current.clientWidth,
          height: volumeChartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    
    // 初始化后立即调整大小
    setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      volumeChart.remove();
    };
  }, [symbol, timeframe]);

  // 全屏状态变化时重新调整大小
  useEffect(() => {
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
      if (volumeChartContainerRef.current && volumeChartRef.current) {
        volumeChartRef.current.applyOptions({
          width: volumeChartContainerRef.current.clientWidth,
          height: volumeChartContainerRef.current.clientHeight,
        });
      }
    };
    
    setTimeout(handleResize, 100);
  }, [isFullscreen]);

  const timeframes = ['15分钟', '1小时', '4小时', '1日', '1周'];
  const timeframeValues = ['15m', '1h', '4h', '1d', '1w'];

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`flex flex-col h-full bg-[#0B0E11] overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* 图表控制栏 */}
      <div className="h-12 border-b border-[#2B3139] flex items-center px-4 space-x-4 flex-shrink-0">
        <div className="flex items-center space-x-1">
          <button className="p-1.5 hover:bg-[#2B3139] rounded text-gray-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
            </svg>
          </button>
          <div className="h-4 w-px bg-[#2B3139] mx-1"></div>
          {timeframes.map((tf, idx) => (
            <button
              key={tf}
              onClick={() => setTimeframe(timeframeValues[idx])}
              className={`px-2.5 py-1 text-xs rounded hover:bg-[#2B3139] transition-colors ${
                timeframe === timeframeValues[idx]
                  ? 'bg-[#2B3139] text-yellow-500 font-medium'
                  : 'text-gray-400'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
        
        <div className="flex items-center space-x-3 ml-auto text-xs">
          <div className="flex items-center space-x-1">
            <span className="text-gray-400">O</span>
            <span className="text-white">3,880.78</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-400">H</span>
            <span className="text-white">3,892.50</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-400">L</span>
            <span className="text-white">3,875.42</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-400">C</span>
            <span className="text-green-500">3,888.80</span>
          </div>
          <div className="h-4 w-px bg-[#2B3139]"></div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-sm bg-purple-400"></div>
            <span className="text-gray-400">MA7</span>
            <span className="text-purple-400">3,854.46</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-sm bg-blue-400"></div>
            <span className="text-gray-400">MA25</span>
            <span className="text-blue-400">3,949.28</span>
          </div>
          <div className="h-4 w-px bg-[#2B3139]"></div>
          <button 
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-[#2B3139] rounded text-gray-400 hover:text-white transition-colors"
            title={isFullscreen ? '退出全屏' : '全屏显示'}
          >
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* K线图区域 */}
      <div ref={chartContainerRef} className="flex-1 min-h-0" style={{ height: '75%' }} />
      
      {/* 交易量图区域 */}
      <div className="border-t border-[#2B3139] flex-shrink-0" style={{ height: '25%' }}>
        <div className="h-6 flex items-center px-4 text-xs">
          <span className="text-gray-400">Volume SMA 9</span>
          <span className="text-green-500 ml-2">32.32K</span>
        </div>
        <div ref={volumeChartContainerRef} className="h-full" style={{ height: 'calc(100% - 24px)' }} />
      </div>
    </div>
  );
}

