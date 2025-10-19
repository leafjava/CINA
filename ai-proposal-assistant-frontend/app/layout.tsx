import './globals.css';
import Providers from '../components/Providers';
import { gsap } from "gsap";

export const metadata = { 
  title: 'CINA交易所', 
  description: 'Next.js MVP for DAO proposal via AI',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
