'use client';
import Button from './ui/Button';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useState } from 'react';

export default function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, status, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const injectedConnector = connectors.find(connector => connector.type === 'injected');
      if (injectedConnector) {
        await connect({ connector: injectedConnector });
      } else {
        console.error('No injected connector found');
      }
    } catch (err) {
      console.error('Connection failed:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  if (error) {
    console.error('Connection error:', error);
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-end gap-2">
        <Button 
          onClick={handleConnect} 
          disabled={isConnecting || status === 'pending'}
        >
          {isConnecting || status === 'pending' ? '连接中…' : '连接钱包'}
        </Button>
        {error && (
          <span className="text-xs text-red-400">
            连接失败: {error.message}
          </span>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-neutral-300">
        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '已连接'}
      </span>
      <Button onClick={() => disconnect()}>断开</Button>
    </div>
  );
}
