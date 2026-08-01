import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw, Server, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '../services/db.js';
import { syncWorker } from '../services/syncWorker.js';
import { networkManager } from '../services/network.js';

export default function SyncDashboardView() {
  const [outboxItems, setOutboxItems] = useState(db.getOutboxItems());
  const [cloudLedger, setCloudLedger] = useState(db.getCloudLedger());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(networkManager.isOnline());
  const [noticeMessage, setNoticeMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const updateData = () => {
      setOutboxItems(db.getOutboxItems());
      setCloudLedger(db.getCloudLedger());
    };

    updateData();
    const interval = setInterval(updateData, 800);

    const unsubscribeSync = syncWorker.subscribeSync((status) => {
      setIsSyncing(status.isSyncing);
      updateData();
    });

    const unsubscribeNet = networkManager.subscribe((online) => {
      setIsOnline(online);
    });

    return () => {
      clearInterval(interval);
      unsubscribeSync();
      unsubscribeNet();
    };
  }, []);

  const handleFlushAll = async () => {
    setErrorMessage('');
    setNoticeMessage('');
    if (!networkManager.isOnline()) {
      setErrorMessage('Device is offline. Turn on network signal to sync outbox.');
      return;
    }
    await syncWorker.flushPendingQueue();
    setNoticeMessage('Flushed outbox queue! Successfully reconciled pending transactions.');
    setTimeout(() => setNoticeMessage(''), 4000);
  };

  const handleRetryItem = async (transaction_id) => {
    setErrorMessage('');
    setNoticeMessage('');
    try {
      await syncWorker.syncSingleItem(transaction_id);
      setOutboxItems(db.getOutboxItems());
      setCloudLedger(db.getCloudLedger());
      setNoticeMessage(`Successfully synced transaction ${transaction_id}! Moved to completed ledger.`);
      setTimeout(() => setNoticeMessage(''), 4000);
    } catch (err) {
      setErrorMessage(`Sync failed for ${transaction_id}: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Outbox Header */}
      <div className="ui-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--color-primary)" />
              <span>Offline Pending Outbox Queue</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-sub)', marginTop: '2px' }}>
              {outboxItems.length} Offline fare transaction(s) pending cloud sync
            </div>
          </div>

          <button
            className="btn-primary"
            style={{
              width: 'auto',
              padding: '10px 16px',
              fontSize: '12px',
              background: isOnline ? 'var(--color-primary)' : '#94a3b8',
              opacity: isOnline ? 1 : 0.6
            }}
            onClick={handleFlushAll}
            disabled={isSyncing || outboxItems.length === 0}
          >
            <RefreshCw size={14} className={isSyncing ? 'spin-anim' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sync / Retry All Outbox Items'}</span>
          </button>
        </div>

        {noticeMessage && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '10px', borderRadius: '10px', fontSize: '12px', marginBottom: '12px', fontWeight: 600 }}>
            {noticeMessage}
          </div>
        )}

        {errorMessage && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px', borderRadius: '10px', fontSize: '12px', marginBottom: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> <span>{errorMessage}</span>
          </div>
        )}

        {/* Pending Items Table */}
        <div style={{ overflowX: 'auto', marginTop: '10px' }}>
          <table style={{ width: '100%', fontSize: '11px', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--color-text-sub)' }}>
                <th style={{ padding: '8px' }}>Transaction ID</th>
                <th style={{ padding: '8px' }}>Wallet ID</th>
                <th style={{ padding: '8px' }}>Amount</th>
                <th style={{ padding: '8px' }}>Offline Status</th>
                <th style={{ padding: '8px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {outboxItems.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '20px' }}>
                    ✅ Outbox clean. No pending offline transactions awaiting sync.
                  </td>
                </tr>
              ) : (
                outboxItems.map(item => (
                  <tr key={item.transaction_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{item.transaction_id}</td>
                    <td style={{ padding: '8px', color: 'var(--color-text-sub)' }}>{item.wallet_id}</td>
                    <td style={{ padding: '8px', color: 'var(--color-primary)', fontWeight: 700 }}>₹{item.amount.toFixed(2)}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '8px', background: '#fef3c7', color: '#b45309' }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <button
                        className="btn-pill"
                        style={{ fontSize: '10px', padding: '2px 10px', color: 'var(--color-primary)', borderColor: '#bfdbfe' }}
                        onClick={() => handleRetryItem(item.transaction_id)}
                      >
                        <RefreshCw size={11} /> Sync / Retry
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cloud Server Ledger */}
      <div className="ui-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Server size={16} color="var(--color-success)" />
            <span>Cloud Reconciled Server Ledger</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 700 }}>
            {cloudLedger.length} Records
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
          {cloudLedger.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '14px' }}>
              No cloud reconciled ledger records yet.
            </div>
          ) : (
            cloudLedger.map(rec => (
              <div
                key={rec.reconciliation_id}
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px'
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{rec.transaction_id}</span>
                  <span style={{ color: 'var(--color-text-sub)', marginLeft: '6px' }}>
                    (₹{rec.amount.toFixed(2)}) • Wallet: {rec.wallet_id}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#166534', fontWeight: 700 }}>RECONCILED</span>
                  <CheckCircle2 size={13} color="#166534" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
