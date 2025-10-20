'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import ConnectWallet from '../components/ConnectWallet';
import Poster from '../components/ui/poster/poster';
import Spline from '@splinetool/react-spline/next';
// import PartnersSection from '../components/PartnersSection';
import LogoMarquee from '../components/logoMarquee';


export default function HomePage() {
  // 检查是否从交易页面回退
  useEffect(() => {
    const leftTrading = sessionStorage.getItem('tradingPageLeft');
    if (leftTrading === 'true') {
      console.log('Detected back from trading page, refreshing...');
      sessionStorage.removeItem('tradingPageLeft');
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  }, []);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">


      {/* 10月20日上午添加的酷炫特效 */}
      <Link href="/main">
        <Spline
          style={{position:'absolute',transform:''}}
          scene="/scene2.splinecode" 
        />
      </Link>
      
    </div>
  );
}
