import './globals.css';
import Providers from '../components/Providers';
import { gsap } from "gsap";
import Footer from '../components/footer';
import ErrorSuppressor from '../components/ErrorSuppressor';
import BackRefreshHandler from '../components/BackRefreshHandler';

export const metadata = { 
  title: 'CINA交易所', 
  description: 'Next.js MVP for DAO proposal via AI'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <script src="/error-handler.js" />
      </head>
      <body>
        <ErrorSuppressor />
        <BackRefreshHandler />
        <Providers>
          {children}
        </Providers>
        <div className='foot'>
          <Footer/>
        </div>
      </body>
    </html>
  );
}
