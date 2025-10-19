'use client';
import Link from 'next/link';
import ChatPanel from '../components/ChatPanel';
import ProposalDraftPanel from '../components/ProposalDraftPanel';
import ConnectWallet from '../components/ConnectWallet';

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-semibold">AI Proposal Assistant</div>
        <ConnectWallet />
      </div>
      
      <div className="space-y-8">
        {/* 导航区域 */}
        <div className="flex flex-wrap justify-center gap-4">
        <Link 
          href="/trading" 
          className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors font-medium"
        >
          合约交易
        </Link>
        <Link 
          href="/positions" 
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          交易仓位
        </Link>
        <Link 
          href="/simple-open" 
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-colors font-medium"
        >
          💰 简单开仓
        </Link>
        <Link 
          href="/proposals" 
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          提案管理
        </Link>
        <Link 
          href="/flashloan" 
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors font-medium"
        >
          ⚡ 闪电贷测试
        </Link>
        <Link 
          href="/admin" 
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:from-red-600 hover:to-orange-600 transition-colors font-medium"
        >
          🔑 管理员工具
        </Link>
      </div>

        {/* 原有内容 */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[70vh]">
          <ChatPanel />
          <ProposalDraftPanel />
        </div> */}
      </div>
    </div>
  );
}
