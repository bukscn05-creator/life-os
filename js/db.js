/* [LifeOS] IndexedDB - FASE 2 */
const DB_NAME = 'lifeos';
const DB_VERSION = 3;
export const STORES = [
  'events','deadlines','transactions','budgets','subscriptions','habits','habitEntries',
  'healthEntries','appointments','goals','people','savingsPots','notes','preferences','projects',
  'migrationBackups'
];

const STORE_CONFIG = {
  events: { keyPath: 'id', indexes: [['date','date'], ['category','category']] },
  deadlines: { keyPath: 'id', indexes: [['dueDate','dueDate'], ['completed','completed']] },
  transactions: { keyPath: 'id', indexes: [['date','date'], ['category','category'], ['type','type']] },
  budgets: { keyPath: 'id', indexes: [['month','month', { unique: false }]] },
  subscriptions: { keyPath: 'id', indexes: [['nextCharge','nextCharge'], ['active','active']] },
  habits: { keyPath: 'id', indexes: [['active','active']] },
  habitEntries: { keyPath: 'id', indexes: [['habitId','habitId'], ['date','date']] },
  healthEntries: { keyPath: 'id', indexes: [['date','date'], ['type','type']] },
  appointments: { keyPath: 'id', indexes: [['date','date']] },
  goals: { keyPath: 'id', indexes: [['deadline','deadline']] },
  people: { keyPath: 'id', indexes: [['name','name'], ['birthday','birthday']] },
  savingsPots: { keyPath: 'id', indexes: [['name','name']] },
  notes: { keyPath: 'id', indexes: [['date','date'], ['pinned','pinned']] },
  preferences: { keyPath: 'id', indexes: [] },
  projects: { keyPath: 'id', indexes: [['status','status'], ['deadline','deadline']] },
  migrationBackups: { keyPath: 'id', indexes: [['timestamp','timestamp'], ['schemaVersion','schemaVersion']] }
};

let dbPromise = null;

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB request failed'));
  });
}
function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
  });
}

export async function initDb() {
  if (dbPromise) return dbPromise;
  if (!('indexedDB' in globalThis)) throw new Error('IndexedDB no disponible en este navegador.');
  dbPromise = new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        try {
          const db = request.result;
          const tx = request.transaction;
          const oldVersion = event.oldVersion || 0;
          for (const [name, cfg] of Object.entries(STORE_CONFIG)) {
            let store;
            if (!db.objectStoreNames.contains(name)) {
              store = db.createObjectStore(name, { keyPath: cfg.keyPath });
            } else {
              store = tx.objectStore(name);
            }
            for (const [idxName, keyPath, opts] of (cfg.indexes || [])) {
              if (!store.indexNames.contains(idxName)) store.createIndex(idxName, keyPath, opts || {});
            }
          }
          if (oldVersion < 2) {
            if (!db.objectStoreNames.contains('migrationBackups')) {
              db.createObjectStore('migrationBackups', { keyPath: 'id' });
            }
          }
          if (oldVersion < 3) {
            if (!db.objectStoreNames.contains('projects')) {
              db.createObjectStore('projects', { keyPath: 'id' });
            }
          }
        } catch (e) {
          throw e;
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => { try { db.close(); } catch {} };
        resolve(db);
      };
      request.onerror = () => reject(request.error || new Error('No se pudo abrir IndexedDB'));
      request.onblocked = () => {};
    } catch (e) {
      reject(e);
    }
  }).catch((e) => { dbPromise = null; throw e; });
  return dbPromise;
}

export async function getAll(storeName) {
  const db = await initDb();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const res = await reqToPromise(store.getAll());
  await txDone(tx);
  return Array.isArray(res) ? res : [];
}

export async function put(storeName, item) {
  if (!item || item.id == null) throw new Error(`Registro inválido en ${storeName}: falta id`);
  const db = await initDb();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).put(item);
  await txDone(tx);
  return item;
}

async function bulkPut(storeName, items = []) {
  const db = await initDb();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  for (const item of items) {
    if (item && item.id != null) store.put(item);
  }
  await txDone(tx);
}

export async function remove(storeName, id) {
  const db = await initDb();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).delete(id);
  await txDone(tx);
}

export async function seed(storeName, items) {
  const existing = await getAll(storeName);
  if (existing.length === 0 && Array.isArray(items) && items.length) {
    await bulkPut(storeName, items);
  }
}

export async function exportAll() {
  const data = { app: 'LIFE_OS', schema: DB_VERSION, exportedAt: new Date().toISOString(), stores: {} };
  for (const s of STORES) data.stores[s] = await getAll(s);
  return data;
}

function isValidBackup(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (!obj.stores || typeof obj.stores !== 'object') return false;
  for (const s of STORES) {
    if (s in obj.stores && !Array.isArray(obj.stores[s])) return false;
  }
  return true;
}

export async function importAll(payload, { overwrite = true } = {}) {
  if (!isValidBackup(payload)) throw new Error('Archivo de backup inválido o incompatible.');
  const db = await initDb();
  const tx = db.transaction(STORES, 'readwrite');
  for (const s of STORES) {
    const store = tx.objectStore(s);
    const incoming = Array.isArray(payload.stores[s]) ? payload.stores[s] : [];
    if (overwrite) store.clear();
    for (const item of incoming) {
      if (item && typeof item === 'object' && item.id != null) store.put(item);
    }
  }
  await txDone(tx);
  return true;
}
