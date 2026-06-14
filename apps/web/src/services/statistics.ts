export interface SignRecord {
  id?: number;
  phone: string;
  userName: string;
  type: string;
  otherId: number;
  activityName: string;
  status: 'success' | 'fail';
  message: string;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ui');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('statistics')) {
        db.createObjectStore('statistics', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

export async function recordSign(record: Omit<SignRecord, 'id'>): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('statistics', 'readwrite');
      const store = tx.objectStore('statistics');
      store.add(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error('Failed to record sign:', e);
  }
}

export async function getStatistics(): Promise<{
  totalSuccess: number;
  totalFail: number;
  todayCount: number;
  byType: Record<string, { success: number; fail: number }>;
  recentRecords: SignRecord[];
}> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('statistics', 'readonly');
      const store = tx.objectStore('statistics');
      const request = store.getAll();

      request.onsuccess = () => {
        const allRecords: SignRecord[] = request.result || [];
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayTs = todayStart.getTime();

        let totalSuccess = 0;
        let totalFail = 0;
        let todayCount = 0;
        const byType: Record<string, { success: number; fail: number }> = {};

        for (const r of allRecords) {
          if (r.status === 'success') totalSuccess++;
          else totalFail++;

          if (r.timestamp >= todayTs) todayCount++;

          if (!byType[r.type]) {
            byType[r.type] = { success: 0, fail: 0 };
          }
          if (r.status === 'success') byType[r.type].success++;
          else byType[r.type].fail++;
        }

        const recentRecords = allRecords
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 20);

        resolve({ totalSuccess, totalFail, todayCount, byType, recentRecords });
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to get statistics:', e);
    return { totalSuccess: 0, totalFail: 0, todayCount: 0, byType: {}, recentRecords: [] };
  }
}
