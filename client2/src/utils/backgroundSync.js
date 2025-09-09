export class BackgroundSyncManager {
  constructor() {
    this.db = null;
    this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('library-sync-db', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('pending-uploads')) {
          const store = db.createObjectStore('pending-uploads', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  async queueUpload(bookData) {
    await this.ensureDB();
    
    const transaction = this.db.transaction(['pending-uploads'], 'readwrite');
    const store = transaction.objectStore('pending-uploads');
    
    const uploadData = {
      ...bookData,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    return store.add(uploadData);
  }

  async getPendingUploads() {
    await this.ensureDB();
    
    const transaction = this.db.transaction(['pending-uploads'], 'readonly');
    const store = transaction.objectStore('pending-uploads');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeUpload(id) {
    await this.ensureDB();
    
    const transaction = this.db.transaction(['pending-uploads'], 'readwrite');
    const store = transaction.objectStore('pending-uploads');
    
    return store.delete(id);
  }

  async ensureDB() {
    if (!this.db) {
      await this.initDB();
    }
  }
}

export const syncManager = new BackgroundSyncManager();