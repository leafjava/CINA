import './globals.css';
import Providers from '../components/Providers';

export const metadata = { 
  title: 'AI Proposal Assistant', 
  description: 'Next.js MVP for DAO proposal via AI'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head></head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
