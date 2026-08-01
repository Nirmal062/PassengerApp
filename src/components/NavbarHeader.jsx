import React, { useState, useEffect } from 'react';
import { Bus, QrCode, History, Layers, LogIn, LogOut } from 'lucide-react';
import { networkManager } from '../services/network.js';
import { db } from '../services/db.js';
import { syncWorker } from '../services/syncWorker.js';

const STATUS_COLOR_MAP = {
  green: '#10b981',
  orange: '#f59e0b',
  red: '#ef4444',
  black: '#64748b',
};

export default function NavbarHeader({ activeTab, setActiveTab, currentUser, onLogout }) {
  const [signalDetails, setSignalDetails] = useState(networkManager.getSignalDetails());
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribeNet = networkManager.subscribe((online, mode, details) => {
      if (details) setSignalDetails(details);
    });

    const updateOutboxCount = () => {
      const txs = db.getOutboxItems() || [];
      setPendingCount(txs.length);
    };

    updateOutboxCount();
    const interval = setInterval(updateOutboxCount, 1000);

    const unsubscribeSync = syncWorker.subscribeSync((status) => {
      setIsSyncing(status.isSyncing);
      updateOutboxCount();
    });

    return () => {
      unsubscribeNet();
      clearInterval(interval);
      unsubscribeSync();
    };
  }, []);

  const statusColorHex = STATUS_COLOR_MAP[signalDetails.color] || '#10b981';

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="brand-logo">
          <div className="brand-icon">
            <Bus size={20} />
          </div>
          <div>
            <div className="brand-title">QR Bus Pass Wallet</div>
            <div className="brand-sub">Passenger Fare Payment & QR Pass</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Signal Status Badge */}
          <div style={{
            background: `${statusColorHex}15`,
            border: `1px solid ${statusColorHex}40`,
            borderRadius: '20px',
            padding: '5px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px'
          }}>
            <span style={{
              background: statusColorHex,
              color: signalDetails.color === 'orange' ? '#000' : '#fff',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '6px',
              fontSize: '10px',
              textTransform: 'uppercase'
            }}>
              {signalDetails.status}
            </span>
          </div>

          {/* User Auth Action Pill */}
          {currentUser ? (
            <button className="btn-pill" style={{ color: '#dc2626', borderColor: '#fecaca', fontSize: '11px' }} onClick={onLogout}>
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          ) : (
            <button className="btn-pill" style={{ background: 'var(--color-primary)', color: '#fff', fontSize: '11px' }} onClick={() => setActiveTab('auth')}>
              <LogIn size={13} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Persona Tabs */}
      <nav className="nav-tabs">
        {!currentUser ? (
          <button className={`tab-btn ${activeTab === 'auth' ? 'active' : ''}`} onClick={() => setActiveTab('auth')}>
            <LogIn size={15} />
            <span>Sign In / Register</span>
          </button>
        ) : (
          <>
            <button className={`tab-btn ${activeTab === 'passenger' ? 'active' : ''}`} onClick={() => setActiveTab('passenger')}>
              <QrCode size={15} />
              <span>Wallet & Pass</span>
            </button>

            <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              <History size={15} />
              <span>Wallet History</span>
            </button>
          </>
        )}

        <button className={`tab-btn ${activeTab === 'sync' ? 'active' : ''}`} onClick={() => setActiveTab('sync')} style={{ position: 'relative' }}>
          <Layers size={15} />
          <span>Outbox</span>
          {pendingCount > 0 && (
            <span style={{
              background: '#f59e0b',
              color: '#000',
              borderRadius: '10px',
              padding: '1px 6px',
              fontSize: '10px',
              fontWeight: '800',
              marginLeft: '4px',
              animation: isSyncing ? 'pulse-amber 1s infinite' : 'none'
            }}>
              {pendingCount}
            </span>
          )}
        </button>
      </nav>
    </header>
  );
}
