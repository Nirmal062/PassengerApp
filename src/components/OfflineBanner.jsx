import React, { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { networkManager } from '../services/network.js';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(networkManager.isOnline());
  const [mode, setMode] = useState(networkManager.getMode());

  useEffect(() => {
    return networkManager.subscribe((online, currentMode) => {
      setIsOnline(online);
      setMode(currentMode);
    });
  }, []);

  if (isOnline) return null;

  return (
    <div className="offline-banner">
      <div className="offline-banner-content">
        <WifiOff size={16} />
        <span>
          <strong>ZERO-NETWORK OFFLINE MODE ACTIVE:</strong> Wallet payments will be locked locally to SQLite outbox queue & auto-synced later.
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', opacity: 0.9 }}>
        <AlertTriangle size={13} />
        <span>100% Offline QR Ready</span>
      </div>
    </div>
  );
}
