import { db } from './db.js';
import { networkManager } from './network.js';

class SyncWorkerService {
  constructor() {
    this.isSyncing = false;
    this.syncListeners = new Set();
    this.logListeners = new Set();
    this.syncLogs = [];

    networkManager.subscribe((isOnline) => {
      if (isOnline && !this.isSyncing) {
        this.addLog('📶 Signal Restored. Auto-syncing pending offline outbox items...');
        this.flushPendingQueue();
      }
    });
  }

  addLog(msg) {
    const logEntry = `[${new Date().toLocaleTimeString()}] ${msg}`;
    this.syncLogs.unshift(logEntry);
    if (this.syncLogs.length > 50) this.syncLogs.pop();
    this.notifyLogListeners();
  }

  subscribeSync(callback) {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }

  subscribeLogs(callback) {
    this.logListeners.add(callback);
    callback(this.syncLogs);
    return () => this.logListeners.delete(callback);
  }

  notifySyncListeners(status) {
    this.syncListeners.forEach(cb => cb(status));
  }

  notifyLogListeners() {
    this.logListeners.forEach(cb => cb(this.syncLogs));
  }

  async flushPendingQueue() {
    if (this.isSyncing) return;
    if (!networkManager.isOnline()) {
      this.addLog('⚠️ Sync paused: Device offline.');
      return;
    }

    const pendingItems = db.getOutboxItems();

    if (pendingItems.length === 0) {
      this.addLog('✅ Outbox clean. 0 offline transactions awaiting cloud sync.');
      return;
    }

    this.isSyncing = true;
    this.notifySyncListeners({ isSyncing: true, pendingCount: pendingItems.length });
    this.addLog(`🚀 Syncing ${pendingItems.length} offline transaction(s) with server...`);

    for (const item of pendingItems) {
      if (!networkManager.isOnline()) {
        this.addLog('⚠️ Signal lost during sync. Outbox processing paused.');
        break;
      }

      this.addLog(`🔄 Reconciling Tx [${item.transaction_id}] (₹${item.amount.toFixed(2)})`);
      await new Promise(resolve => setTimeout(resolve, 350));

      try {
        db.writeToCloudLedger(item, 'SUCCESS');
        db.markTransactionSynced(item.transaction_id);
        this.addLog(`✅ Server 200 OK: Tx [${item.transaction_id}] synced & moved to completed history.`);
      } catch (err) {
        this.addLog(`❌ Sync failure for Tx [${item.transaction_id}]: ${err.message}`);
      }
    }

    this.isSyncing = false;
    const remaining = db.getOutboxItems().length;
    this.notifySyncListeners({ isSyncing: false, pendingCount: remaining });
    this.addLog('🎉 Outbox sync completed.');
  }

  async syncSingleItem(transaction_id) {
    if (!networkManager.isOnline()) {
      throw new Error('Device is currently offline. Turn on network signal to sync.');
    }
    db.writeToCloudLedger({ transaction_id, amount: 0 }, 'SUCCESS');
    db.markTransactionSynced(transaction_id);
    this.addLog(`✅ Manually synced transaction [${transaction_id}]`);
    this.notifySyncListeners({ isSyncing: false, pendingCount: db.getOutboxItems().length });
    return true;
  }
}

export const syncWorker = new SyncWorkerService();
