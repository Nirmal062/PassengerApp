import React, { useState, useEffect } from 'react';
import { Bus, CheckCircle2 } from 'lucide-react';
import NavbarHeader from './components/NavbarHeader';
import OfflineBanner from './components/OfflineBanner';
import AuthLandingView from './components/AuthLandingView';
import PassengerView from './components/PassengerView';
import WalletHistoryView from './components/WalletHistoryView';
import SyncDashboardView from './components/SyncDashboardView';
import { db } from './services/db.js';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App Render Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', color: '#dc2626', background: '#fef2f2', borderRadius: '12px', margin: '20px' }}>
          <h3>Application Error Occurred</h3>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>{this.state.error?.toString()}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '12px', padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(db.getCurrentPassenger());
  const [activeTab, setActiveTab] = useState(db.getCurrentPassenger() ? 'passenger' : 'auth');

  // 2-Second Transition Splash States
  const [showInitSplash, setShowInitSplash] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // 1. Initial Open 2-Second Animated Splash Transition (3 Simple Words)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInitSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const psg = db.getCurrentPassenger();
      setCurrentUser(psg);
    }, 800);

    return () => clearInterval(timer);
  }, []);

  // 2. Post-Login 2-Second Authentication Transition (3 Simple Words)
  const handleAuthSuccess = (user) => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setCurrentUser(user);
      setActiveTab('passenger');
      setIsAuthenticating(false);
    }, 2000);
  };

  const handleLogout = () => {
    db.logoutPassenger();
    setCurrentUser(null);
    setActiveTab('auth');
  };

  return (
    <ErrorBoundary>
      <div className="app-wrapper">
        <div className="app-container">
          {/* A) Initial Open 2-Second Animated Logo Splash Screen */}
          {showInitSplash ? (
            <div className="splash-container">
              <div className="splash-logo-box">
                <Bus size={44} />
              </div>
              <h1 className="splash-title">Digital Bus Wallet</h1>
              <div className="splash-subtitle">Fast Smart Transit</div>
              <div className="splash-progress-bar">
                <div className="splash-progress-fill" />
              </div>
            </div>
          ) : isAuthenticating ? (
            /* B) Post-Login 2-Second Authentication Transition Animation */
            <div className="splash-container">
              <div className="splash-logo-box" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
                <CheckCircle2 size={44} />
              </div>
              <h1 className="splash-title">Verified Passenger Profile</h1>
              <div className="splash-subtitle" style={{ color: '#059669' }}>
                Wallet Session Active
              </div>
              <div className="splash-progress-bar">
                <div className="splash-progress-fill" style={{ background: '#059669' }} />
              </div>
            </div>
          ) : !currentUser ? (
            /* C) Clean Login & Registration Landing Screen */
            <main className="app-content" style={{ padding: '32px 20px', background: '#ffffff' }}>
              <AuthLandingView onAuthSuccess={handleAuthSuccess} />
            </main>
          ) : (
            /* D) Authenticated Passenger Dashboard & Criteria View */
            <>
              <NavbarHeader
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                currentUser={currentUser}
                onLogout={handleLogout}
              />

              <OfflineBanner />

              <main className="app-content">
                {activeTab === 'passenger' && <PassengerView />}
                {activeTab === 'history' && <WalletHistoryView />}
                {activeTab === 'sync' && <SyncDashboardView />}
              </main>
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
