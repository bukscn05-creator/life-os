import { initDb, getAll as dbGetAll, put as dbPut, remove as dbRemove, exportAll as dbExportAll, importAll as dbImportAll, STORES, DB_NAME } from '../db.js';
import { uid, nowISO } from './ids.js';
import { runMigrations, verifyDataIntegrity, createPreMigrationBackup, restoreBackup, getCurrentSchemaVersion } from './migrations.js';

export const SCHEMA_VERSION = 2;
export const BACKUP_APP = 'LIFE_OS';

const pendingWrites = new Map();
const broadcastChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('lifeos-sync') : null;
let externalRefreshCallback = null;

export function setExternalRefreshCallback(cb) {
  externalRefreshCallback = cb;
}

if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    if (event.data?.type === 'storage-changed' && externalRefreshCallback) {
      externalRefreshCallback();
    }
  };
}

function broadcastChange() {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'storage-changed', timestamp: Date.now() });
  }
}

export function stampNew(item) {
  const ts = nowISO();
  return { ...item, id: item.id || uid('rec'), createdAt: item.createdAt || ts, updatedAt: item.updatedAt || ts, deletedAt: item.deletedAt ?? null };
}

export function stampUpdate(item) {
  return { ...item, updatedAt: nowISO() };
}

export async function initializeStorage() {
  await initDb();
  const migrationResult = await runMigrations();
  const integrityIssues = await verifyDataIntegrity();
  return { migrationResult, integrityIssues };
}

export async function loadAllState() {
  try {
    await initializeStorage();
    const next = {};
    for (const store of STORES) {
      if (store === 'migrationBackups') continue;
      try { next[store] = await dbGetAll(store); }
      catch { next[store] = []; }
    }
    if (!next.preferences || !Array.isArray(next.preferences)) next.preferences = [];
    return { ok: true, state: next };
  } catch (e) {
    return { ok: false, error: e, state: emptyState() };
  }
}

export function emptyState() {
  const s = {};
  for (const st of STORES) {
    if (st !== 'migrationBackups') s[st] = [];
  }
  return s;
}

function makeIdempotentKey(store, item) {
  return `${store}:${item.id}:${item.updatedAt || item.createdAt || ''}`;
}

export async function saveRecord(store, item) {
  const rec = stampUpdate(stampNew(item));
  const key = makeIdempotentKey(store, rec);
  const existing = pendingWrites.get(key);
  if (existing && Date.now() - existing < 1000) {
    return rec;
  }
  pendingWrites.set(key, Date.now());
  setTimeout(() => pendingWrites.delete(key), 1500);
  await dbPut(store, rec);
  broadcastChange();
  return rec;
}

export async function softDelete(store, id) {
  const all = await dbGetAll(store);
  const found = all.find(x => x.id === id);
  if (found) {
    const rec = { ...found, deletedAt: nowISO(), updatedAt: nowISO() };
    await dbPut(store, rec);
    broadcastChange();
    return rec;
  }
  return null;
}

export async function hardRemove(store, id) {
  await dbRemove(store, id);
}

export async function deleteWithIntegrityCheck(store, id, state) {
  const references = checkReferences(store, id, state);
  if (references.length > 0) {
    return { ok: false, reason: 'referenced', references, message: `Este elemento está referenciado por: ${references.map(r => `${r.store} (${r.field})`).join(', ')}. ¿Eliminar de todos modos?` };
  }
  await softDelete(store, id);
  return { ok: true };
}

function checkReferences(store, id, state) {
  const refs = [];
  const refMap = {
    savingsPots: [{ store: 'goals', field: 'savingsPotId' }],
    subscriptions: [{ store: 'deadlines', field: 'subscriptionId' }],
    habits: [{ store: 'habitEntries', field: 'habitId' }],
    people: [{ store: 'goals', field: 'personId' }, { store: 'appointments', field: 'personId' }],
    categories: [{ store: 'transactions', field: 'category' }, { store: 'budgets', field: 'categories' }]
  };
  const mappings = refMap[store] || [];
  for (const { store: refStore, field } of mappings) {
    const items = state[refStore] || [];
    for (const item of items) {
      if (item.deletedAt) continue;
      if (field === 'categories' && item.categories && item.categories[id]) {
        refs.push({ store: refStore, field, itemId: item.id });
      } else if (item[field] === id) {
        refs.push({ store: refStore, field, itemId: item.id });
      }
    }
  }
  return refs;
}

export async function exportBackup() {
  const data = await dbExportAll();
  data.app = BACKUP_APP;
  data.schemaVersion = SCHEMA_VERSION;
  data.exportedAt = nowISO();
  return data;
}

export function validateBackupPayload(payload) {
  if (!payload || typeof payload !== 'object') return { ok: false, reason: 'Archivo no válido' };
  if (!payload.stores || typeof payload.stores !== 'object') return { ok: false, reason: 'Estructura de copia no válida' };
  const sv = payload.schemaVersion ?? payload.schema ?? 0;
  if (typeof sv === 'number' && sv > SCHEMA_VERSION) return { ok: false, reason: 'Esquema más nuevo que esta versión de la app' };
  for (const s of STORES) {
    if (s === 'migrationBackups') continue;
    if (s in payload.stores && !Array.isArray(payload.stores[s])) return { ok: false, reason: `Datos inválidos en ${s}` };
  }
  return { ok: true, schemaVersion: sv };
}

function mergeRecords(existing = [], incoming = []) {
  const map = new Map();
  for (const it of existing) { if (it && it.id != null) map.set(it.id, it); }
  for (const it of incoming) {
    if (!it || it.id == null) continue;
    const cur = map.get(it.id);
    if (!cur) { map.set(it.id, it); continue; }
    const ta = cur.updatedAt || cur.createdAt || '';
    const tb = it.updatedAt || it.createdAt || '';
    if (tb > ta) map.set(it.id, it);
    else if (tb === ta) {
      map.set(it.id, cur);
    } else {
      map.set(it.id, cur);
    }
  }
  return Array.from(map.values());
}

export async function importBackup(payload, { mode = 'replace' } = {}) {
  const v = validateBackupPayload(payload);
  if (!v.ok) throw new Error(v.reason);
  if (mode === 'replace') {
    await dbImportAll(payload, { overwrite: true });
    broadcastChange();
    return { ok: true, mode };
  }
  await initDb();
  const current = await dbExportAll();
  const merged = { ...payload, stores: {} };
  for (const s of STORES) {
    if (s === 'migrationBackups') continue;
    const a = Array.isArray(current.stores[s]) ? current.stores[s] : [];
    const b = Array.isArray(payload.stores[s]) ? payload.stores[s] : [];
    merged.stores[s] = mergeRecords(a, b);
  }
  await dbImportAll(merged, { overwrite: true });
  broadcastChange();
  return { ok: true, mode };
}

export async function getMigrationHistory() {
  try {
    return await dbGetAll('migrationBackups');
  } catch {
    return [];
  }
}