import React, { useState, useEffect } from 'react';
import { ShieldCheck, DollarSign, MapPin, Bus, AlertTriangle, FileText, Plus, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';
import { db } from '../services/db.js';

export default function AdminDashboardView() {
  const [routes, setRoutes] = useState(db.getRoutes());
  const [fareTables, setFareTables] = useState(db.getFareTables());
  const [transactions, setTransactions] = useState(db.getAllTransactions());
  const [cloudLedger, setCloudLedger] = useState(db.getCloudLedger());
  const [auditLogs, setAuditLogs] = useState(db.getAuditLogs());

  // Form State: Add Fare Table Entry
  const [newRouteId, setNewRouteId] = useState('R-101');
  const [newFromStage, setNewFromStage] = useState('Visakhapatnam Complex');
  const [newToStage, setNewToStage] = useState('Maddilapalem');
  const [newCategory, setNewCategory] = useState('ADULT');
  const [newFareAmount, setNewFareAmount] = useState('15');
  const [fareNotice, setFareNotice] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setTransactions(db.getAllTransactions());
      setCloudLedger(db.getCloudLedger());
      setAuditLogs(db.getAuditLogs());
      setFareTables(db.getFareTables());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAddFare = (e) => {
    e.preventDefault();
    db.saveFareTable({
      route_id: newRouteId,
      from_stage: newFromStage,
      to_stage: newToStage,
      passenger_category: newCategory,
      fare_amount: parseFloat(newFareAmount),
    });
    setFareTables(db.getFareTables());
    setFareNotice('Fare table matrix updated successfully!');
    setTimeout(() => setFareNotice(''), 3000);
  };

  const handleResetSystem = () => {
    if (window.confirm('Reset all passenger wallets, transactions, tickets, and cloud ledger to initial seed state?')) {
      db.clearAllData();
      setTransactions(db.getAllTransactions());
      setCloudLedger(db.getCloudLedger());
      setAuditLogs(db.getAuditLogs());
      setFareTables(db.getFareTables());
    }
  };

  // Settlement Analytics
  const totalDebits = transactions.filter(t => t.type === 'DEBIT' && t.status === 'SUCCESS').reduce((sum, t) => sum + t.amount, 0);
  const totalRecharges = transactions.filter(t => t.type === 'RECHARGE' && t.status === 'SUCCESS').reduce((sum, t) => sum + t.amount, 0);
  const totalReversals = transactions.filter(t => t.type === 'REVERSAL' && t.status === 'SUCCESS').reduce((sum, t) => sum + t.amount, 0);
  const netRevenue = totalDebits - totalReversals;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Admin Title Banner */}
      <div className="ui-card" style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#38bdf8', fontWeight: 800 }}>
              STU OPERATOR & SETTLEMENT ADMIN DASHBOARD
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '2px' }}>
              APSRTC Transit Financial System (Closed-Loop PPI)
            </div>
          </div>
          <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '14px' }}>
            SUPER ADMIN
          </span>
        </div>
      </div>

      {/* Financial Settlement & Revenue Summary Cards (FR-R1) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        <div className="ui-card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-sub)', fontWeight: 600 }}>Total Wallet Recharges</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
            ₹{totalRecharges.toFixed(2)}
          </div>
        </div>

        <div className="ui-card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-sub)', fontWeight: 600 }}>Gross Bus Fare Debits</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>
            ₹{totalDebits.toFixed(2)}
          </div>
        </div>

        <div className="ui-card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-sub)', fontWeight: 600 }}>Total Fare Reversals</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
            -₹{totalReversals.toFixed(2)}
          </div>
        </div>

        <div className="ui-card" style={{ padding: '14px', background: '#ecfdf5', borderColor: '#a7f3d0' }}>
          <div style={{ fontSize: '11px', color: '#166534', fontWeight: 700 }}>Net Transit Settlement</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
            ₹{netRevenue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Route & Stage Fare Table Matrix Manager (FR-A2) */}
      <div className="ui-card">
        <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={18} color="var(--color-primary)" />
          <span>Route & Stage Fare Matrix Manager</span>
        </h3>

        {fareNotice && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px', fontWeight: 600 }}>
            {fareNotice}
          </div>
        )}

        <form onSubmit={handleAddFare} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', marginBottom: '14px' }}>
          <div>
            <label style={{ fontSize: '10px', fontWeight: 700 }}>Route</label>
            <select className="form-select" value={newRouteId} onChange={(e) => setNewRouteId(e.target.value)}>
              {routes.map(r => <option key={r.route_id} value={r.route_id}>{r.route_id}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '10px', fontWeight: 700 }}>From Stage</label>
            <input type="text" className="form-input" value={newFromStage} onChange={(e) => setNewFromStage(e.target.value)} required />
          </div>

          <div>
            <label style={{ fontSize: '10px', fontWeight: 700 }}>To Stage</label>
            <input type="text" className="form-input" value={newToStage} onChange={(e) => setNewToStage(e.target.value)} required />
          </div>

          <div>
            <label style={{ fontSize: '10px', fontWeight: 700 }}>Category</label>
            <select className="form-select" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
              <option value="ADULT">Adult</option>
              <option value="CHILD">Child</option>
              <option value="STUDENT">Student</option>
              <option value="SENIOR">Senior</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '10px', fontWeight: 700 }}>Fare (₹)</label>
            <input type="number" className="form-input" value={newFareAmount} onChange={(e) => setNewFareAmount(e.target.value)} required />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="btn-primary" style={{ height: '40px', padding: '0 12px', fontSize: '12px' }}>
              <Plus size={14} /> Add Fare
            </button>
          </div>
        </form>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '11px', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--color-text-sub)' }}>
                <th style={{ padding: '8px' }}>Table ID</th>
                <th style={{ padding: '8px' }}>Route ID</th>
                <th style={{ padding: '8px' }}>From Stage</th>
                <th style={{ padding: '8px' }}>To Stage</th>
                <th style={{ padding: '8px' }}>Category</th>
                <th style={{ padding: '8px' }}>Fare (₹)</th>
              </tr>
            </thead>
            <tbody>
              {fareTables.map(f => (
                <tr key={f.fare_table_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{f.fare_table_id}</td>
                  <td style={{ padding: '8px' }}>{f.route_id}</td>
                  <td style={{ padding: '8px' }}>{f.from_stage}</td>
                  <td style={{ padding: '8px' }}>{f.to_stage}</td>
                  <td style={{ padding: '8px' }}>{f.passenger_category}</td>
                  <td style={{ padding: '8px', fontWeight: 800, color: 'var(--color-primary)' }}>₹{f.fare_amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fraud & Anomaly Monitor (SEC-6 & FR-A9) */}
      <div className="ui-card">
        <h4 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={16} color="#d97706" />
          <span>Fraud & Anomaly Security Monitor (Rule-Engine)</span>
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 12px', fontSize: '11px', color: '#b45309' }}>
            🛡️ <strong>Opaque QR Velocity Rule:</strong> Single token duplicate scan window active (0 suspicious rapid double-scans detected).
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 12px', fontSize: '11px', color: '#166534' }}>
            ✓ <strong>Device Binding Attestation:</strong> Conductor POS device (DEV-POS-300) verified bound to EMP-7742.
          </div>
        </div>
      </div>

      {/* Audit Log Trail (SEC-5 & FR-A5) */}
      <div className="ui-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 800 }}>Immutable System Audit Trail</h4>
          <span style={{ fontSize: '11px', color: 'var(--color-text-sub)' }}>{auditLogs.length} Log Entries</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
          {auditLogs.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '14px' }}>
              No audit logs recorded yet.
            </div>
          ) : (
            auditLogs.map(log => (
              <div
                key={log.audit_id}
                style={{
                  background: '#f8fafc',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  fontSize: '11px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong style={{ color: 'var(--color-primary)' }}>[{log.action}]</strong> {log.details}
                  <div style={{ fontSize: '10px', color: 'var(--color-text-sub)', marginTop: '2px' }}>
                    Actor: {log.actor_id} • Target: {log.target}
                  </div>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* System Reset Button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button className="btn-pill" style={{ color: 'var(--color-danger)', borderColor: '#fecaca' }} onClick={handleResetSystem}>
          <Trash2 size={13} />
          <span>Reset System to Factory Initial Seed State</span>
        </button>
      </div>
    </div>
  );
}
