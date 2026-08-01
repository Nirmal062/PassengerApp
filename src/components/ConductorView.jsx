import React, { useState, useEffect } from 'react';
import { Smartphone, Camera, Send, CheckCircle2, AlertCircle, Clock, RefreshCw, Printer, RotateCcw, ShieldCheck, MapPin, Bus } from 'lucide-react';
import { db } from '../services/db.js';
import { networkManager } from '../services/network.js';

export default function ConductorView() {
  const [routes, setRoutes] = useState(db.getRoutes());
  const [selectedRouteId, setSelectedRouteId] = useState('R-101');
  const [fromStage, setFromStage] = useState('Visakhapatnam Complex');
  const [toStage, setToStage] = useState('Gajuwaka');
  const [category, setCategory] = useState('ADULT');

  // Manual & Scanned Token State
  const [scannedTokenId, setScannedTokenId] = useState('TKN-8942-DYNAMIC-APP');
  const [resolvedUser, setResolvedUser] = useState(null);
  const [scanStatusMessage, setScanStatusMessage] = useState('');

  // Transaction & Ticket Result State
  const [lastIssuedTicket, setLastIssuedTicket] = useState(null);
  const [recentShiftTickets, setRecentShiftTickets] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnline, setIsOnline] = useState(networkManager.isOnline());

  const currentRoute = routes.find(r => r.route_id === selectedRouteId) || routes[0];

  useEffect(() => {
    const unsubscribe = networkManager.subscribe((online) => {
      setIsOnline(online);
    });

    const updateShiftTickets = () => {
      const all = db.getTickets();
      setRecentShiftTickets(all.slice(0, 10));
    };

    updateShiftTickets();
    const interval = setInterval(updateShiftTickets, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (currentRoute && currentRoute.stages.length >= 2) {
      setFromStage(currentRoute.stages[0]);
      setToStage(currentRoute.stages[currentRoute.stages.length - 1]);
    }
  }, [selectedRouteId]);

  const handleResolveToken = () => {
    setErrorMessage('');
    setScanStatusMessage('');
    const res = db.resolveQRToken(scannedTokenId.trim());

    if (!res.valid) {
      setResolvedUser(null);
      setErrorMessage(res.message);
    } else {
      setResolvedUser(res);
      setScanStatusMessage(`Resolved Token [${res.token_id}] ➔ Passenger: ${res.passenger_name} (Balance: ₹${res.balance.toFixed(2)})`);
    }
  };

  const computedFare = db.calculateFare(selectedRouteId, fromStage, toStage, category);

  const handleConfirmDebit = () => {
    setErrorMessage('');
    setIsProcessing(true);

    try {
      const isCurrentlyOnline = networkManager.isOnline();
      const res = db.debitFare({
        token_id: scannedTokenId.trim(),
        route_id: selectedRouteId,
        from_stage: fromStage,
        to_stage: toStage,
        category,
        conductor_id: 'CND-101',
        vehicle_id: 'VEH-AP39Z-4412',
        isOnline: isCurrentlyOnline,
      });

      setLastIssuedTicket(res.ticket);
      setResolvedUser(null);
      setScanStatusMessage('');
      setRecentShiftTickets(db.getTickets().slice(0, 10));
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoidTicket = (ticketId) => {
    if (window.confirm('Void ticket and refund wallet balance? (Instant 2-min reversal window)')) {
      try {
        db.voidTicket(ticketId, 'CND-101');
        setRecentShiftTickets(db.getTickets().slice(0, 10));
        if (lastIssuedTicket && lastIssuedTicket.ticket_id === ticketId) {
          setLastIssuedTicket({ ...lastIssuedTicket, status: 'VOID' });
        }
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const totalShiftCollection = recentShiftTickets
    .filter(t => t.status === 'VALID')
    .reduce((sum, t) => sum + t.fare_amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Duty Assignment Header */}
      <div className="ui-card" style={{ padding: '14px 18px', background: '#0f172a', color: '#fff', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#38bdf8', fontWeight: 800 }}>
              CONDUCTOR ONBOARD POS DEVICE (DEV-POS-300)
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '2px' }}>
              Duty: M. Venkatesh (EMP-7742) • Vehicle: AP 39 Z 4412
            </div>
          </div>
          <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px' }}>
            ● DUTY ACTIVE
          </span>
        </div>
      </div>

      {/* Route & Stage Selection */}
      <div className="ui-card">
        <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={18} color="var(--color-primary)" />
          <span>Route & Stage Fare Selector</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-sub)', marginBottom: '4px', display: 'block' }}>
              Active Bus Route
            </label>
            <select className="form-select" value={selectedRouteId} onChange={(e) => setSelectedRouteId(e.target.value)}>
              {routes.map(r => (
                <option key={r.route_id} value={r.route_id}>{r.route_id}: {r.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-sub)', marginBottom: '4px', display: 'block' }}>Boarding Stage</label>
              <select className="form-select" value={fromStage} onChange={(e) => setFromStage(e.target.value)}>
                {currentRoute.stages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-sub)', marginBottom: '4px', display: 'block' }}>Alighting Stage</label>
              <select className="form-select" value={toStage} onChange={(e) => setToStage(e.target.value)}>
                {currentRoute.stages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-sub)', fontWeight: 600 }}>Computed Stage Fare:</span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', marginLeft: '8px' }}>
                ₹{computedFare.toFixed(2)}
              </span>
            </div>
            <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '8px', fontWeight: 700 }}>
              {category} FARE
            </span>
          </div>
        </div>
      </div>

      {/* QR Scanner & Resolver Card (PRD 5.4 & FR-C3) */}
      <div className="ui-card">
        <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Camera size={18} color="var(--color-primary)" />
          <span>Scan Passenger QR / Manual Token Resolution</span>
        </h3>

        {errorMessage && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {scanStatusMessage && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', marginBottom: '12px', fontWeight: 600 }}>
            {scanStatusMessage}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <input
            type="text"
            className="form-input"
            value={scannedTokenId}
            onChange={(e) => setScannedTokenId(e.target.value)}
            placeholder="Scan or enter token payload (e.g. TKN-8942-DYNAMIC-APP)..."
          />
          <button className="btn-pill" style={{ background: 'var(--color-primary)', color: '#fff', padding: '0 16px' }} onClick={handleResolveToken}>
            Resolve
          </button>
        </div>

        {/* Quick Demo Scan Chips */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-sub)', fontWeight: 600 }}>Quick Test Chips:</span>
          <button className="btn-pill" onClick={() => setScannedTokenId('TKN-8942-DYNAMIC-APP')}>Dynamic App QR</button>
          <button className="btn-pill" onClick={() => setScannedTokenId('TKN-8942-PHYSICAL-CARD')}>Physical Card QR</button>
        </div>

        {/* Tap-to-Debit Button (Sub-3s Online / Sub-1s Offline) */}
        <button
          className="btn-primary"
          style={{
            padding: '16px',
            fontSize: '16px',
            background: isOnline ? '#059669' : '#d97706',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)'
          }}
          onClick={handleConfirmDebit}
          disabled={isProcessing}
        >
          <Send size={18} />
          <span>
            {isOnline ? `CONFIRM & DEBIT ₹${computedFare.toFixed(2)} (ONLINE)` : `CONFIRM & DEBIT ₹${computedFare.toFixed(2)} (OFFLINE CAPPED)`}
          </span>
        </button>
      </div>

      {/* Generated Thermal E-Ticket View (PRD 5.5) */}
      {lastIssuedTicket && (
        <div className="ui-card" style={{ background: '#fcf8e3', border: '1px dashed #d97706' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px dashed #d97706', paddingBottom: '6px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={14} />
              <span>APSRTC THERMAL E-TICKET ISSUED</span>
            </div>
            <span style={{ fontSize: '10px', background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '6px', fontWeight: 800 }}>
              {lastIssuedTicket.status}
            </span>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#0f172a', lineHeight: '1.6' }}>
            <div>Ticket No: <strong>{lastIssuedTicket.ticket_number}</strong></div>
            <div>Route: {lastIssuedTicket.route_id} ({lastIssuedTicket.from_stage} ➔ {lastIssuedTicket.to_stage})</div>
            <div>Fare Paid: <strong style={{ color: '#059669', fontSize: '14px' }}>₹{lastIssuedTicket.fare_amount.toFixed(2)}</strong></div>
            <div>Time: {new Date(lastIssuedTicket.issued_at).toLocaleString()}</div>
          </div>

          {lastIssuedTicket.status === 'VALID' && (
            <button
              className="btn-pill"
              style={{ marginTop: '10px', color: '#dc2626', borderColor: '#fecaca', background: '#fff' }}
              onClick={() => handleVoidTicket(lastIssuedTicket.ticket_id)}
            >
              <RotateCcw size={12} />
              <span>Instant Void Ticket (Within 2-Min Window)</span>
            </button>
          )}
        </div>
      )}

      {/* Conductor Shift Summary (FR-C9) */}
      <div className="ui-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 800 }}>Conductor Duty Shift Summary</h4>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669' }}>
            Shift Collection: ₹{totalShiftCollection.toFixed(2)}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
          {recentShiftTickets.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '14px' }}>
              No tickets issued during this shift duty yet.
            </div>
          ) : (
            recentShiftTickets.map(t => (
              <div
                key={t.ticket_id}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px'
                }}
              >
                <div>
                  <span style={{ fontWeight: 700 }}>{t.ticket_number}</span>
                  <span style={{ color: 'var(--color-text-sub)', marginLeft: '6px' }}>({t.from_stage} ➔ {t.to_stage})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, color: t.status === 'VALID' ? '#059669' : '#dc2626' }}>
                    ₹{t.fare_amount.toFixed(2)}
                  </span>
                  {t.status === 'VALID' && (
                    <button style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer' }} onClick={() => handleVoidTicket(t.ticket_id)}>
                      <RotateCcw size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
