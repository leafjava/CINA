'use client';
import ChatPanel from '../components/ChatPanel';
import ProposalDraftPanel from '../components/ProposalDraftPanel';

export default function HomePage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[70vh]">
      <ChatPanel />
      <ProposalDraftPanel />
    </div>
  );
}
