import './globals.css';
import Providers from '../components/Providers';
import ConnectWallet from '../components/ConnectWallet';

export const metadata = { title: 'AI Proposal Assistant', description: 'Next.js MVP for DAO proposal via AI' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>
          <div className="max-w-6xl mx-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xl font-semibold">AI Proposal Assistant</div>
              <ConnectWallet />
            </div>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
