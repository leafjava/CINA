'use client';
import Link from 'next/link';
import ChatPanel from '../components/ChatPanel';
import ProposalDraftPanel from '../components/ProposalDraftPanel';

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* 导航区域 */}
      <div className="flex justify-center space-x-4">
        <Link 
          href="/positions" 
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          交易仓位
        </Link>
        <Link 
          href="/proposals" 
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          提案管理
        </Link>
      </div>

      {/* 原有内容 */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[70vh]">
        <ChatPanel />
        <ProposalDraftPanel />
      </div> */}
    </div>
  );
}
