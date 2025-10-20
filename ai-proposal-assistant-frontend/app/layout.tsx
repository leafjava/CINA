'use client';
import './globals.css';
import Providers from '../components/Providers';
import { gsap } from "gsap";
import Footer from '../components/footer';
import ErrorSuppressor from '../components/ErrorSuppressor';
import BackRefreshHandler from '../components/BackRefreshHandler';
import { usePathname } from 'next/navigation';


export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  return (
    <html lang="zh-CN">
      <head>
        <title>CINA</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <script src="/error-handler.js" />
      </head>
      <body>
        <ErrorSuppressor />
        <BackRefreshHandler />
        <Providers>
          {children}
        </Providers>
        {pathname === '/main' && (
          <div className='foot'>
            <Footer/>
          </div>
        )}
      </body>
    </html>
  );
}
