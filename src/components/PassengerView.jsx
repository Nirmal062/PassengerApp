import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Wallet, Plus, RefreshCw, Lock, ShieldCheck, CheckCircle2, AlertCircle, FileText, Send, LogOut, QrCode } from 'lucide-react';
import { db } from '../services/db.js';

export default function PassengerView() {
  const [passenger, setPassenger] = useState(db.getCurrentPassenger());
  const [wallet, setWallet] = useState(db.getCurrentWallet());
  const [qrToken, setQrToken] = useState(db.getCurrentPassengerQR());
  const [transactions, setTransactions] = useState(db.getTransactions());

  // Top Up Modal State
  const [rechargeAmt, setRechargeAmt] = useState('100');
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const psg = db.getCurrentPassenger();
      const wal = db.getCurrentWallet();
      const qr = db.getCurrentPassengerQR();
      setPassenger(psg);
      setWallet(wal);
      setQrToken(qr);
      setTransactions(db.getTransactions());
    }, 800);

    return () => clearInterval(timer);
  }, []);

  const handleRefreshBalance = () => {
    const wal = db.getCurrentWallet();
    setWallet(wal);
    setNoticeMessage(`Balance refreshed: ₹${wal.balance.toFixed(2)}`);
    setTimeout(() => setNoticeMessage(''), 3000);
  };

  const handleTopUp = (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const updated = db.rechargeWallet(rechargeAmt, 'UPI Gateway Placeholder');
      setWallet(updated);
      setTransactions(db.getTransactions());
      setShowRechargeModal(false);
      setNoticeMessage(`Successfully topped up ₹${parseFloat(rechargeAmt).toFixed(2)} into wallet!`);
      setTimeout(() => setNoticeMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const handleRegenerateQR = () => {
    if (window.confirm('Regenerate Permanent QR Code? (Use if phone/card is lost or stolen)')) {
      const newQR = db.regeneratePassengerQR('Passenger self-service Lost/Stolen QR block');
      setQrToken(newQR);
      setNoticeMessage('New permanent QR code token generated successfully!');
      setTimeout(() => setNoticeMessage(''), 4000);
    }
  };

  if (!passenger) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Verified Passenger Profile Card (Clean Profile: NO Govt ID file name or image exposed) */}
      <div className="ui-card" style={{ padding: '16px 20px', background: '#0f172a', color: '#ffffff', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#38bdf8', fontWeight: 800 }}>
              VERIFIED PASSENGER PROFILE
            </div>
            <div style={{ fontSize: '17px', fontWeight: 800, marginTop: '3px', color: '#ffffff' }}>
              {passenger.name}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
              ID Type: <strong style={{ color: '#e2e8f0' }}>{passenger.id_proof_type}</strong> • Phone: <strong style={{ color: '#e2e8f0' }}>{passenger.mobile_number}</strong>
            </div>
          </div>

          <button className="btn-pill" style={{ color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.4)', background: 'transparent' }} onClick={() => db.logoutPassenger()}>
            <LogOut size={13} /> Logout
          </button>
        </div>
      </div>

      {noticeMessage && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600 }}>
          {noticeMessage}
        </div>
      )}

      {errorMessage && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Wallet Balance Dashboard */}
      <div className="ui-card" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)', color: '#ffffff', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 800 }}>
              CURRENT WALLET BALANCE
            </div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
              ₹{wallet ? wallet.balance.toFixed(2) : '0.00'}
            </div>
          </div>

          <button className="btn-pill" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderColor: 'transparent' }} onClick={handleRefreshBalance}>
            <RefreshCw size={13} /> Check Balance
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <button className="btn-primary" style={{ flex: 1, background: '#ffffff', color: 'var(--color-primary)' }} onClick={() => setShowRechargeModal(true)}>
            <Plus size={16} /> Add / Top Up Balance
          </button>
        </div>
      </div>

      {/* 3. Permanent FASTag-Style Passenger QR Pass */}
      <div className="ui-card" style={{ background: '#ffffff', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <QrCode size={18} color="var(--color-primary)" />
              <span>Permanent FASTag Passenger QR Pass</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-sub)', marginTop: '2px' }}>
              Permanent QR code for passenger identity. Unchanged when balance updates. Zero PII/bank details.
            </div>
          </div>

          <span style={{ background: qrToken?.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2', color: qrToken?.status === 'ACTIVE' ? '#15803d' : '#b91c1c', fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px' }}>
            {qrToken?.status === 'ACTIVE' ? '✓ ACTIVE' : 'BLOCKED'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
          {/* QR Code Renderer */}
          <div style={{ background: '#ffffff', padding: '12px', borderRadius: '16px', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {qrToken && qrToken.status === 'ACTIVE' ? (
              <QRCodeSVG value={qrToken.token_id} size={125} level="H" includeMargin={false} />
            ) : (
              <div style={{ width: 125, height: 125, background: '#f8fafc', color: '#dc2626', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '10px', textAlign: 'center' }}>
                <Lock size={24} color="#dc2626" />
                <span style={{ fontWeight: 800, marginTop: '4px' }}>QR BLOCKED</span>
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-sub)' }}>Opaque Passenger Token ID:</div>
            <div style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#0f172a', wordBreak: 'break-all' }}>
              {qrToken ? qrToken.token_id : 'N/A'}
            </div>

            <div style={{ marginTop: '12px' }}>
              <button className="btn-pill" style={{ color: '#dc2626', borderColor: '#fecaca', fontSize: '11px' }} onClick={handleRegenerateQR}>
                <RefreshCw size={12} /> Block & Regenerate QR (Lost/Stolen)
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '10px', color: 'var(--color-text-sub)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>Secured: Contains ZERO phone numbers, Aadhaar/PAN details, UPI IDs, or balance data.</span>
        </div>
      </div>

      {/* 4. Transactions List */}
      <div className="ui-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 800 }}>Recent Transactions ({transactions.length})</h4>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
          {transactions.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '14px' }}>
              No transactions recorded yet.
            </div>
          ) : (
            transactions.map(tx => (
              <div
                key={tx.transaction_id}
                style={{
                  background: '#f8fafc',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: tx.type === 'TOP_UP' || tx.type === 'RECHARGE' ? '#059669' : '#0f172a' }}>
                    {tx.type === 'TOP_UP' || tx.type === 'RECHARGE' ? '➕ Wallet Top-Up' : '🚌 Fare Deduction'}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-sub)', marginTop: '2px' }}>
                    {tx.transaction_id} • {new Date(tx.created_at).toLocaleString()}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: tx.type === 'TOP_UP' || tx.type === 'RECHARGE' ? '#059669' : '#2563eb' }}>
                    {tx.type === 'TOP_UP' || tx.type === 'RECHARGE' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-sub)' }}>
                    Balance: <strong>₹{tx.balance_after !== undefined ? tx.balance_after.toFixed(2) : wallet.balance.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top Up Modal */}
      {showRechargeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '380px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px' }}>Add / Top Up Wallet Balance</h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-sub)', marginBottom: '14px' }}>
              Select top-up amount to add to wallet.
            </p>

            <form onSubmit={handleTopUp}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Amount (₹)</label>
                <input type="number" className="form-input" value={rechargeAmt} onChange={(e) => setRechargeAmt(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                {[100, 200, 500, 1000].map(amt => (
                  <button key={amt} type="button" className="btn-pill" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setRechargeAmt(amt.toString())}>
                    ₹{amt}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn-pill" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowRechargeModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 2 }}>Top Up Now</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
