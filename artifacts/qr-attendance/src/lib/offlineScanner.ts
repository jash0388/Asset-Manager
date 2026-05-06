import { customFetch } from "@workspace/api-client-react";

export type CachedUser = {
  uniqueId: string;
  name: string;
  role: string;
};

export type PendingScan = {
  clientScanId: string;
  uniqueId: string;
  scannedAt: string;
  attempts: number;
};

const KEY_USERS = "secapp.users.v1";
const KEY_USERS_AT = "secapp.users.fetchedAt.v1";
const KEY_QUEUE = "secapp.queue.v1";
const KEY_COOLDOWN = "secapp.cooldown.v1";
const KEY_LASTSYNC = "secapp.lastSyncAt.v1";

const COOLDOWN_MS = 0;
const USER_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function getCachedUsers(): CachedUser[] {
  return readJson<CachedUser[]>(KEY_USERS, []);
}

export function getCacheAge(): number | null {
  const at = localStorage.getItem(KEY_USERS_AT);
  if (!at) return null;
  const n = parseInt(at, 10);
  return Number.isFinite(n) ? Date.now() - n : null;
}

export function getCacheFetchedAt(): number | null {
  const at = localStorage.getItem(KEY_USERS_AT);
  if (!at) return null;
  const n = parseInt(at, 10);
  return Number.isFinite(n) ? n : null;
}

function buildIndex(users: CachedUser[]): Map<string, CachedUser> {
  const map = new Map<string, CachedUser>();
  for (const u of users) {
    if (u && u.uniqueId) map.set(u.uniqueId.trim(), u);
  }
  return map;
}

let _index: Map<string, CachedUser> | null = null;
function getIndex(): Map<string, CachedUser> {
  if (_index) return _index;
  _index = buildIndex(getCachedUsers());
  return _index;
}

export function findUserLocal(uniqueId: string): CachedUser | undefined {
  return getIndex().get(uniqueId.trim());
}

export async function refreshUserCache(force = false): Promise<{ count: number; fromNetwork: boolean }> {
  const cached = getCachedUsers();
  const age = getCacheAge();
  if (!force && cached.length > 0 && age !== null && age < USER_CACHE_TTL_MS) {
    return { count: cached.length, fromNetwork: false };
  }
  try {
    const users = await customFetch<any[]>("/api/users");
    const slim: CachedUser[] = users
      .filter((u: any) => u && typeof u.uniqueId === "string")
      .map((u: any) => ({
        uniqueId: String(u.uniqueId).trim(),
        name: String(u.name ?? ""),
        role: String(u.role ?? ""),
      }));
    writeJson(KEY_USERS, slim);
    localStorage.setItem(KEY_USERS_AT, String(Date.now()));
    _index = buildIndex(slim);
    return { count: slim.length, fromNetwork: true };
  } catch (err) {
    return { count: cached.length, fromNetwork: false };
  }
}

// ---------- 30-minute local cooldown ----------

type CooldownMap = Record<string, number>;

function getCooldownMap(): CooldownMap {
  return readJson<CooldownMap>(KEY_COOLDOWN, {});
}

function pruneCooldown(map: CooldownMap): CooldownMap {
  const now = Date.now();
  const out: CooldownMap = {};
  for (const k of Object.keys(map)) {
    if (now - map[k] < COOLDOWN_MS) out[k] = map[k];
  }
  return out;
}

export function getCooldownMsRemaining(uniqueId: string): number {
  const map = getCooldownMap();
  const last = map[uniqueId.trim()];
  if (!last) return 0;
  const remaining = COOLDOWN_MS - (Date.now() - last);
  return Math.max(0, remaining);
}

export function markScannedLocally(uniqueId: string, at: number = Date.now()) {
  const map = pruneCooldown(getCooldownMap());
  map[uniqueId.trim()] = at;
  writeJson(KEY_COOLDOWN, map);
}

// ---------- Local scan queue ----------

export function getQueue(): PendingScan[] {
  return readJson<PendingScan[]>(KEY_QUEUE, []);
}

function setQueue(items: PendingScan[]) {
  writeJson(KEY_QUEUE, items);
}

export function enqueueScan(uniqueId: string): PendingScan {
  const scan: PendingScan = {
    clientScanId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    uniqueId: uniqueId.trim(),
    scannedAt: new Date().toISOString(),
    attempts: 0,
  };
  const q = getQueue();
  q.push(scan);
  setQueue(q);
  return scan;
}

export function getLastSyncAt(): number | null {
  const at = localStorage.getItem(KEY_LASTSYNC);
  if (!at) return null;
  const n = parseInt(at, 10);
  return Number.isFinite(n) ? n : null;
}

export type SyncResult = {
  attempted: number;
  synced: number;
  failed: number;
  skipped: number;
};

export async function syncQueue(): Promise<SyncResult> {
  const queue = getQueue();
  if (queue.length === 0) {
    return { attempted: 0, synced: 0, failed: 0, skipped: 0 };
  }

  const batch = queue.slice(0, 200);
  const payload = {
    scans: batch.map((s) => ({
      clientScanId: s.clientScanId,
      uniqueId: s.uniqueId,
      scannedAt: s.scannedAt,
    })),
  };

  let response: any;
  try {
    response = await customFetch<{ results: any[] }>("/api/scan/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const updated = queue.map((s) => {
      const inBatch = batch.find((b) => b.clientScanId === s.clientScanId);
      return inBatch ? { ...s, attempts: s.attempts + 1 } : s;
    });
    setQueue(updated);
    return { attempted: batch.length, synced: 0, failed: batch.length, skipped: 0 };
  }

  const results: any[] = Array.isArray(response?.results) ? response.results : [];
  const acceptedIds = new Set<string>();
  let synced = 0;
  let skipped = 0;

  for (const r of results) {
    if (!r || typeof r.clientScanId !== "string") continue;
    acceptedIds.add(r.clientScanId);
    if (r.status === "ok") {
      synced++;
    } else {
      skipped++;
    }
  }

  const remaining = queue.filter((s) => !acceptedIds.has(s.clientScanId));
  const updated = remaining.map((s) => {
    const inBatch = batch.find((b) => b.clientScanId === s.clientScanId);
    return inBatch ? { ...s, attempts: s.attempts + 1 } : s;
  });
  setQueue(updated);
  localStorage.setItem(KEY_LASTSYNC, String(Date.now()));

  return {
    attempted: batch.length,
    synced,
    failed: batch.length - synced - skipped,
    skipped,
  };
}

export function clearQueue() {
  setQueue([]);
}
