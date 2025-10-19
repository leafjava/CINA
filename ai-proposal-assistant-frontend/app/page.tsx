'use client';
import Link from 'next/link';
import ConnectWallet from '../components/ConnectWallet';
import Poster from '../components/ui/poster/poster';
import Spline from '@splinetool/react-spline/next';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* 背景动画效果 */}
      {/* <Poster /> */}
      <Spline
        style={{position:'absolute',transform:'scale(2.5)'}}
        scene="/scene.splinecode" 
      />


      
      {/* 动态背景粒子 */}
      {/* <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
        <div className="absolute top-60 right-40 w-1 h-1 bg-pink-400 rounded-full animate-pulse"></div>
        <div className="absolute bottom-60 right-10 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
      </div> */}

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">CI</span>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              CINA
            </div>
          </div>
          <ConnectWallet />
        </div>
        
        {/* 主要内容区域 */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-indigo-400 via-white-500 to-pink-500 bg-clip-text text-transparent leading-tight drop-shadow-lg">
            DeFi 交易助手
          </h1>
          <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed">
            智能合约交易平台，支持杠杆交易、仓位管理，让您的 DeFi 投资更加高效
          </p>
        </div>

        {/* 功能卡片区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {/* 合约交易卡片 */}
          <Link href="/trading" className="group">
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 hover:from-slate-700/50 hover:to-slate-800/70 hover:border-slate-600/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-slate-500/20 relative overflow-hidden">
              {/* 微妙的发光效果 */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-500/80 to-orange-500/80 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-amber-500/20">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">合约交易</h3>
                </div>
                <p className="text-gray-300 mb-4 text-sm leading-relaxed">执行智能合约交易，支持杠杆操作</p>
                <div className="flex items-center text-amber-400 group-hover:text-amber-300 transition-colors">
                  <span className="text-sm font-medium">开始交易</span>
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* 交易仓位卡片 */}
          <Link href="/positions" className="group">
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 hover:from-slate-700/50 hover:to-slate-800/70 hover:border-slate-600/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-slate-500/20 relative overflow-hidden">
              {/* 微妙的发光效果 */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500/80 to-blue-500/80 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-cyan-500/20">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">交易仓位</h3>
                </div>
                <p className="text-gray-300 mb-4 text-sm leading-relaxed">查看和管理您的交易仓位</p>
                <div className="flex items-center text-cyan-400 group-hover:text-cyan-300 transition-colors">
                  <span className="text-sm font-medium">查看仓位</span>
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* 数据分析卡片 */}
          {/* <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/10 opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-violet-500/80 to-purple-500/80 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-violet-500/20">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">数据分析</h3>
              </div>
              <p className="text-gray-300 mb-4 text-sm leading-relaxed">实时市场数据和分析报告</p>
              <div className="flex items-center text-violet-400">
                <span className="text-sm font-medium">即将推出</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div> */}
        </div>

        {/* 底部统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-slate-800/30 to-slate-900/50 backdrop-blur-md border border-slate-700/40 rounded-xl p-6 text-center shadow-lg hover:shadow-slate-500/10 transition-all duration-300">
            <div className="text-3xl font-bold text-emerald-400 mb-2">100%</div>
            <div className="text-gray-300">交易成功率</div>
          </div>
          <div className="bg-gradient-to-r from-slate-800/30 to-slate-900/50 backdrop-blur-md border border-slate-700/40 rounded-xl p-6 text-center shadow-lg hover:shadow-slate-500/10 transition-all duration-300">
            <div className="text-3xl font-bold text-cyan-400 mb-2">24/7</div>
            <div className="text-gray-300">全天候服务</div>
          </div>
          {/* <div className="bg-gradient-to-r from-slate-800/30 to-slate-900/50 backdrop-blur-md border border-slate-700/40 rounded-xl p-6 text-center shadow-lg hover:shadow-slate-500/10 transition-all duration-300">
            <div className="text-3xl font-bold text-violet-400 mb-2">0.1%</div>
            <div className="text-gray-300">交易手续费</div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
