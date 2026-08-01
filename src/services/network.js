// Network State Manager with User's checkNetwork() Signal Health Engine

export const NETWORK_MODES = {
  AUTO: 'AUTO',             // Automatic signal-based detection (Default)
  ONLINE: 'ONLINE_FORCE',    // Forced Online
  OFFLINE: 'OFFLINE_FORCE',  // Forced Offline (Zero-Network Tunnel)
};

class NetworkService {
  constructor() {
    this.mode = NETWORK_MODES.AUTO;
    this.listeners = new Set();
    this.currentNetworkState = { status: 'Good', color: 'green', ping: 12 };
    this.simulatedDropUntil = 0;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.runCheck());
      window.addEventListener('offline', () => this.runCheck());
      this.startPolling();
    }
  }

  // Exact checkNetwork() function requested by USER
  async checkNetwork() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return { status: "Offline", color: "black", ping: 0 };
    }

    if (!navigator.onLine || Date.now() < this.simulatedDropUntil) {
      return { status: "Offline", color: "black", ping: 0 };
    }

    const start = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      await fetch("/ping", {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const ping = Math.round(performance.now() - start);

      if (ping < 100)
        return { status: "Good", color: "green", ping };

      if (ping < 300)
        return { status: "Medium", color: "orange", ping };

      return { status: "Poor", color: "red", ping };
    } catch (err) {
      return { status: "Offline", color: "black", ping: 0 };
    }
  }

  async runCheck() {
    try {
      if (this.mode === NETWORK_MODES.OFFLINE) {
        this.currentNetworkState = { status: "Offline", color: "black", ping: 0 };
      } else if (this.mode === NETWORK_MODES.ONLINE) {
        this.currentNetworkState = { status: "Good", color: "green", ping: 10 };
      } else {
        const result = await this.checkNetwork();
        this.currentNetworkState = result || { status: "Offline", color: "black", ping: 0 };
      }
    } catch (err) {
      this.currentNetworkState = { status: "Offline", color: "black", ping: 0 };
    }
    this.notifyListeners();
  }

  startPolling() {
    setInterval(() => {
      this.runCheck();
    }, 3000);
  }

  simulateSignalDrop(durationSec = 10) {
    this.simulatedDropUntil = Date.now() + (durationSec * 1000);
    this.runCheck();
  }

  setMode(newMode) {
    this.mode = newMode;
    this.runCheck();
  }

  isOnline() {
    if (this.mode === NETWORK_MODES.OFFLINE) return false;
    if (this.mode === NETWORK_MODES.ONLINE) return true;
    return this.currentNetworkState && this.currentNetworkState.status !== "Offline";
  }

  getMode() {
    return this.mode;
  }

  getSignalDetails() {
    const isOnline = this.isOnline();
    const state = this.currentNetworkState || { status: 'Offline', color: 'black', ping: 0 };
    return {
      isOnline,
      mode: this.mode,
      status: state.status || 'Offline',
      color: state.color || 'black',
      ping: state.ping || 0,
      label: isOnline 
        ? `Signal ${state.status} (${state.ping || 0}ms)` 
        : 'Offline (Zero-Network Outbox Mode)'
    };
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.isOnline(), this.mode, this.getSignalDetails());
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    const details = this.getSignalDetails();
    this.listeners.forEach(cb => {
      try {
        cb(details.isOnline, this.mode, details);
      } catch (e) {
        console.error("Listener error:", e);
      }
    });
  }
}

export const networkManager = new NetworkService();
