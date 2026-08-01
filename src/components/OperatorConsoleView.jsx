import React, { useState, useEffect } from 'react';
import { QrCode, Send, Search, CheckCircle2, AlertCircle, ShieldCheck, RefreshCw, User, DollarSign, Wallet } from 'lucide-react';
import { db } from '../services/db.js';
import { networkManager } from '../services/network.js';

export default function OperatorConsoleView() {
  const [passengerQRInput, setPassengerQRInput] = useState('TKN-8942-PERMANENT-FASTAG-PASS');
  const [resolvedPassenger, setResolvedPassenger] = useState(null);
  const [fareAmount, setFareAmount] = useState('25');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnline, setIsOnline] = useState(networkManager.isOnline());

  useEffect(() => {
    const unsubscribeNet = networkManager.subscribe((online) => setIsOnline(online));
    return () => unsubscribeNet();
  }, []);

  const handleLookupPassenger = () => {
    setErrorMessage('');
    setSuccessMessage('');
    const cleanToken = passengerQRInput.trim();
    if (!cleanToken) {
      setErrorMessage('Please enter or scan a Passenger QR Token ID.');
      setResolvedPassenger(null);
      return;
    }

    const res = db.resolvePassengerQRToken(cleanToken);
    if (!res.valid) {
      setResolvedPassenger(null);
      setErrorMessage(res.message);
    } else {
      setResolvedPassenger(res);
      setSuccessMessage(`Found Passenger: ${res.passenger.name} (${res.passenger.mobile_number}) • Wallet Balance: ₹${res.wallet.balance.toFixed(2)}`);
    }
  };

  const handleDeductFare = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsProcessing(true);

    try {
      const numFare = parseFloat(fareAmount);
      const isCurrentlyOnline = networkManager.isOnline();

      const res = db.debitFareByQRToken({
        token_id: passengerQRInput.trim(),
        fare_amount: numFare,
        isOnline: isCurrentlyOnline,
      });

      if (res.offline) {
        setSuccessMessage(`Offline Fare Debit Queued! ₹${numFare.toFixed(2)} added to outbox for Passenger ${res.passenger.name}.`);
      } else {
        setSuccessMessage(`Success! Fare ₹${numFare.toFixed(2)} deducted from ${res.passenger.name}'s wallet. New Balance: ₹${res.newBalance.toFixed(2)}`);
      }

      // Refresh lookup
      handleLookupPassenger();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Operator Console Header */}
      <div className="ui-card" style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#38bdf8', fontWeight: 800 }}>
              CONDUCTOR / OPERATOR POS TERMINAL
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '2px' }}>
              Passenger QR Pass Scanner & Fare Deduction Engine
            </div>
          </div>
          <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '14px' }}>
            CONDUCTOR TERMINAL
          </span>
        </div>
      </div>

      {/* QR Scanner / Lookup Form */}
      <div className="ui-card">
        <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <QrCode size={18} color="var(--color-primary)" />
          <span>Scan / Lookup Permanent Passenger QR Token</span>
        </h3>

        {errorMessage && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', marginBottom: '12px', fontWeight: 600 }}>
            {successMessage}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '34px', fontFamily: 'var(--font-mono)' }}
              value={passengerQRInput}
              onChange={(e) => setPassengerQRInput(e.target.value)}
              placeholder="Scan or enter passenger permanent QR token ID..."
            />
            <QrCode size={16} style={{ position: 'absolute', left: '10px', top: '13px', color: '#94a3b8' }} />
          </div>

          <button className="btn-pill" style={{ background: 'var(--color-primary)', color: '#fff', padding: '0 16px' }} onClick={handleLookupPassenger}>
            Lookup Passenger
          </button>
        </div>

        {/* Quick Seed Fill Chip */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-sub)', fontWeight: 600 }}>Demo QR Token:</span>
          <button className="btn-pill" style={{ fontSize: '10px', padding: '2px 8px' }} onClick={() => setPassengerQRInput('TKN-8942-PERMANENT-FASTAG-PASS')}>
            TKN-8942-PERMANENT-FASTAG-PASS
          </button>
        </div>

        {/* Resolved Passenger Card & Fare Deduction Form */}
        {resolvedPassenger && (
          <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  👤 {resolvedPassenger.passenger.name} ({resolvedPassenger.passenger.mobile_number})
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-sub)' }}>
                  KYC: {resolvedPassenger.passenger.id_proof_type} • Status: {resolvedPassenger.passenger.kyc_status}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-text-sub)', fontWeight: 600 }}>AVAILABLE BALANCE</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: resolvedPassenger.wallet.balance >= parseFloat(fareAmount || 0) ? '#059669' : '#dc2626' }}>
                  ₹{resolvedPassenger.wallet.balance.toFixed(2)}
                </div>
              </div>
            </div>

            <form onSubmit={handleDeductFare}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Select / Enter Fare Amount (₹)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    className="form-input"
                    style={{ fontWeight: 800, color: 'var(--color-primary)' }}
                    value={fareAmount}
                    onChange={(e) => setFareAmount(e.target.value)}
                    required
                  />
                  {[10, 15, 20, 25, 50].map(amt => (
                    <button key={amt} type="button" className="btn-pill" style={{ padding: '0 12px' }} onClick={() => setFareAmount(amt.toString())}>
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{
                  padding: '14px',
                  fontSize: '15px',
                  background: isOnline ? '#059669' : '#d97706'
                }}
                disabled={isProcessing}
              >
                <Send size={16} />
                <span>
                  {isOnline ? `DEDUCT FARE ₹${parseFloat(fareAmount || 0).toFixed(2)} FROM WALLET` : `QUEUE OFFLINE DEBIT ₹${parseFloat(fareAmount || 0).toFixed(2)}`}
                </span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
