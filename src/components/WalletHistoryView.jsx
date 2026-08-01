import React, { useState, useEffect } from 'react';
import { History, Search, Printer, ArrowUpRight, ArrowDownLeft, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../services/db.js';

export default function WalletHistoryView() {
  const [transactions, setTransactions] = useState(db.getTransactions());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const update = () => {
      setTransactions(db.getTransactions());
    };
    update();
    const timer = setInterval(update, 800);
    return () => clearInterval(timer);
  }, []);

  // Search transactions by Transaction ID
  const filteredTxs = transactions.filter(tx => {
    if (searchQuery.trim() === '') return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      tx.transaction_id.toLowerCase().includes(q) ||
      (tx.type && tx.type.toLowerCase().includes(q))
    );
  });

  // Pagination Logic (Max 10 per page)
  const totalPages = Math.ceil(filteredTxs.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTxs = filteredTxs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header, Search & Print Statement Action */}
      <div className="ui-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} color="var(--color-primary)" />
              <span>Wallet Transactions History</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-sub)', marginTop: '2px' }}>
              Showing max 10 transactions per statement page.
            </div>
          </div>

          {/* Print Statement Button */}
          <button className="btn-primary" style={{ width: 'auto', padding: '8px 14px', fontSize: '12px' }} onClick={handlePrintStatement}>
            <Printer size={14} />
            <span>Print Statement</span>
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '34px' }}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search transactions using Transaction ID..."
          />
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '13px', color: '#94a3b8' }} />
        </div>
      </div>

      {/* Printable Statement Table Ledger (Max 10 Transactions Per Page) */}
      <div className="ui-card" id="printable-statement">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 800 }}>
            Statement Page {currentPage} of {totalPages} ({filteredTxs.length} Total)
          </h4>

          <span style={{ fontSize: '11px', color: 'var(--color-text-sub)' }}>
            Max 10 Items / Page
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {paginatedTxs.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '32px 16px' }}>
              <History size={32} color="#cbd5e1" style={{ margin: '0 auto 8px auto', display: 'block' }} />
              <div>No transactions found.</div>
            </div>
          ) : (
            paginatedTxs.map(tx => {
              const isTopUp = tx.type === 'TOP_UP' || tx.type === 'RECHARGE';
              const isReversal = tx.type === 'REVERSAL';

              return (
                <div
                  key={tx.transaction_id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        background: isTopUp || isReversal ? '#ecfdf5' : '#eff6ff',
                        color: isTopUp || isReversal ? '#059669' : '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isTopUp ? <ArrowDownLeft size={18} /> : isReversal ? <RotateCcw size={18} /> : <ArrowUpRight size={18} />}
                      </div>

                      <div>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: isTopUp || isReversal ? '#059669' : '#0f172a' }}>
                          {isTopUp ? 'Wallet Top-Up' : isReversal ? 'Refund / Reversal' : 'Fare Deduction'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-sub)' }}>
                          Tx ID: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{tx.transaction_id}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: isTopUp || isReversal ? '#059669' : '#2563eb' }}>
                        {isTopUp || isReversal ? '+' : '-'}₹{tx.amount.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-sub)' }}>
                        Balance After: <strong style={{ color: '#0f172a' }}>₹{tx.balance_after !== undefined ? tx.balance_after.toFixed(2) : 'N/A'}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginTop: '4px', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      📅 {new Date(tx.created_at).toLocaleString()}
                    </span>

                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '8px',
                      background: tx.status === 'success' || tx.status === 'SUCCESS' ? '#dcfce7' : tx.status === 'failed' || tx.status === 'FAILED' ? '#fee2e2' : '#fef3c7',
                      color: tx.status === 'success' || tx.status === 'SUCCESS' ? '#15803d' : tx.status === 'failed' || tx.status === 'FAILED' ? '#b91c1c' : '#b45309',
                      textTransform: 'uppercase'
                    }}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls (Max 10 per page) */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
            <button
              className="btn-pill"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-sub)' }}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              className="btn-pill"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
