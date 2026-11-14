/* Migraciones IndexedDB — versionado de esquema con backup automático y migraciones encadenadas */
import { initDb, getAll, put, remove, exportAll, importAll, STORES, DB_NAME, DB_VERSION } from '../db.js';
import { uid, nowISO } from './ids.js';

export const APP_SCHEMA_VERSION = 2;

const MIGRATION_KEY = 'lifeos_migrations';
const BACKUP_STORE = 'lifeos_backups';

async function getMigrationLog() {
  try {
    const db = await initDb();
    const tx = db.transaction(BACKUP_STORE, 'readonly');
    const store = tx.objectStore(BACKUP_STORE);
    const res = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return res;
  } catch {
    return [];
  }
}

async function addMigrationLog(entry) {
  try {
    const db = await initDb();
    const tx = db.transaction(BACKUP_STORE, 'readwrite');
    const store = tx.objectStore(BACKUP_STORE);
    store.put({ ...entry, id: entry.id || uid('mig'), timestamp: entry.timestamp || nowISO() });
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    // Migration log error - silent in production
  }
}

export async function ensureBackupStore() {
  const db = await initDb();
  if (!db.objectStoreNames.contains(BACKUP_STORE)) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION + 1);
      req.onupgradeneeded = (event) => {
        const db = req.result;
        if (!db.objectStoreNames.contains(BACKUP_STORE)) {
          db.createObjectStore(BACKUP_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export async function createPreMigrationBackup() {
  const timestamp = nowISO();
  const backupId = `pre-migration-${timestamp}-${uid('bk')}`;
  const data = await exportAll();
  data.backupId = backupId;
  data.backupType = 'pre-migration';
  data.appSchemaVersion = APP_SCHEMA_VERSION;
  await addMigrationLog({ id: backupId, type: 'backup', timestamp, schemaVersion: APP_SCHEMA_VERSION, success: true });
  return { backupId, data };
}

export async function restoreBackup(backupData) {
  await importAll(backupData, { overwrite: true });
  await addMigrationLog({ id: uid('restore'), type: 'restore', timestamp: nowISO(), schemaVersion: APP_SCHEMA_VERSION, success: true });
}

export async function runMigrations() {
  const currentVersion = await getCurrentSchemaVersion();
  if (currentVersion >= APP_SCHEMA_VERSION) return { migrated: false, from: currentVersion, to: APP_SCHEMA_VERSION };

  const backup = await createPreMigrationBackup();
  let success = false;
  let error = null;

  try {
    for (let v = currentVersion + 1; v <= APP_SCHEMA_VERSION; v++) {
      await runSingleMigration(v);
    }
    await setSchemaVersion(APP_SCHEMA_VERSION);
    success = true;
  } catch (e) {
    error = e;
    // Migration error - will be logged via migration log
    try {
      await restoreBackup(backup.data);
    } catch (restoreError) {
      // Critical restore failure - silent in production
    }
    throw e;
  } finally {
    await addMigrationLog({
      id: uid('mig'),
      type: 'migration',
      timestamp: nowISO(),
      fromVersion: currentVersion,
      toVersion: APP_SCHEMA_VERSION,
      success,
      error: error?.message || null,
      backupId: backup.backupId
    });
  }

  return { migrated: true, from: currentVersion, to: APP_SCHEMA_VERSION, backupId: backup.backupId };
}

async function getCurrentSchemaVersion() {
  try {
    const prefs = await getAll('preferences');
    const pref = prefs.find(p => p.id === 'schemaVersion');
    return pref?.value || 1;
  } catch {
    return 1;
  }
}

async function setSchemaVersion(version) {
  await put('preferences', { id: 'schemaVersion', value: version, updatedAt: nowISO() });
}

async function runSingleMigration(version) {
  switch (version) {
    case 2:
      await migrationV2_addCentsAndTimestamps();
      break;
    default:
      throw new Error(`Migración v${version} no implementada`);
  }
}

async function migrationV2_addCentsAndTimestamps() {
  const migrations = [
    migrateStore('transactions', (item) => ({
      ...item,
      amountCents: item.amountCents ?? Math.round(Number(item.amount || 0) * 100),
      createdAt: item.createdAt || nowISO(),
      updatedAt: item.updatedAt || nowISO(),
      deletedAt: item.deletedAt ?? null
    })),
    migrateStore('budgets', (item) => ({
      ...item,
      totalCents: item.totalCents ?? Math.round(Number(item.total || 0) * 100),
      createdAt: item.createdAt || nowISO(),
      updatedAt: item.updatedAt || nowISO(),
      deletedAt: item.deletedAt ?? null
    })),
    migrateStore('subscriptions', (item) => ({
      ...item,
      amountCents: item.amountCents ?? Math.round(Number(item.amount || 0) * 100),
      createdAt: item.createdAt || nowISO(),
      updatedAt: item.updatedAt || nowISO(),
      deletedAt: item.deletedAt ?? null
    })),
    migrateStore('deadlines', (item) => ({
      ...item,
      amountCents: item.amountCents ?? (item.amount != null ? Math.round(Number(item.amount) * 100) : 0),
      createdAt: item.createdAt || nowISO(),
      updatedAt: item.updatedAt || nowISO(),
      deletedAt: item.deletedAt ?? null
    })),
    migrateStore('savingsPots', (item) => ({
      ...item,
      currentCents: item.currentCents ?? Math.round(Number(item.current || 0) * 100),
      targetCents: item.targetCents ?? Math.round(Number(item.target || 0) * 100),
      monthlyCents: item.monthlyCents ?? (item.monthly != null ? Math.round(Number(item.monthly) * 100) : 0),
      createdAt: item.createdAt || nowISO(),
      updatedAt: item.updatedAt || nowISO(),
      deletedAt: item.deletedAt ?? null
    })),
    migrateStore('goals', (item) => ({
      ...item,
      currentCents: item.currentCents ?? Math.round(Number(item.current || 0) * 100),
      targetCents: item.targetCents ?? Math.round(Number(item.target || 0) * 100),
      createdAt: item.createdAt || nowISO(),
      updatedAt: item.updatedAt || nowISO(),
      deletedAt: item.deletedAt ?? null
    })),
    migrateStore('events', (item) => ({
      ...item,
      createdAt: item.createdAt || nowISO(),
      updatedAt: item.updatedAt || nowISO(),
      deletedAt: item.deletedAt ?? null
    })),
    migrateStore('habits', (item) => ({
      ...item,
      createdAt: item.createdAt || nowISO(),
      updatedAt: item.updatedAt || nowISO(),
      deletedAt: item.deletedAt ?? null
    })),
    migrateStore('habitEntries', (item) => ({
      ...item,
      createdAt: item.createdAt || nowISO(),
      updatedAt: item.updatedAt || nowISO(),
      deletedAt: item.deletedAt ?? null
    })),
    migrateStore('healthEntries', (item) => ({
      ...item,
      createdAt: item.createdAt || nowISO(),
      updatedAt: item.updatedAt || nowISO(),
      deletedAt: item.deletedAt ?? null
    })),
    migrateStore('appointments', (item) => ({
      ...item,
      createdAt: item.createdAt || nowISO(),
      updatedAt: item.updatedAt || nowISO(),
      deletedAt: item.deletedAt ?? null
    })),
    migrateStore('people', (item) => ({
      ...item,
      createdAt: item.createdAt || nowISO(),
      updatedAt: item.updatedAt || nowISO(),
      deletedAt: item.deletedAt ?? null
    })),
    migrateStore('notes', (item) => ({
      ...item,
      createdAt: item.createdAt || nowISO(),
      updatedAt: item.updatedAt || nowISO(),
      deletedAt: item.deletedAt ?? null
    })),
    migrateStore('preferences', (item) => ({
      ...item,
      createdAt: item.createdAt || nowISO(),
      updatedAt: item.updatedAt || nowISO()
    }))
  ];

  await Promise.all(migrations);
}

async function migrateStore(storeName, transform) {
  const items = await getAll(storeName);
  if (!items.length) return;

  const db = await initDb();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);

  for (const item of items) {
    const migrated = transform(item);
    store.put(migrated);
  }

  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function verifyDataIntegrity() {
  const issues = [];

  for (const storeName of STORES) {
    try {
      const items = await getAll(storeName);
      for (const item of items) {
        if (item.id == null) {
          issues.push({ store: storeName, issue: 'Item sin id', item });
        }
        if (storeName !== 'preferences' && !item.createdAt) {
          issues.push({ store: storeName, issue: 'Falta createdAt', item });
        }
        if (storeName !== 'preferences' && !item.updatedAt) {
          issues.push({ store: storeName, issue: 'Falta updatedAt', item });
        }
      }
    } catch (e) {
      issues.push({ store: storeName, issue: 'Error leyendo store', error: e.message });
    }
  }

  return issues;
}