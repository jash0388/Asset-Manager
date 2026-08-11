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
  hash?: string;
  prevHash?: string;
  seqNo?: number;
  deviceId?: string;
  isLateEntry?: boolean;
};

const KEY_USERS = "secapp.users.v1";
const KEY_USERS_AT = "secapp.users.fetchedAt.v1";
const KEY_QUEUE = "secapp.queue.v1";
const KEY_COOLDOWN = "secapp.cooldown.v1";
const KEY_LASTSYNC = "secapp.lastSyncAt.v1";
const KEY_SEQ = "secapp.seq.v1";
const KEY_DEVICE = "secapp.device.v1";
const KEY_RECEIPT = "secapp.receipt.v1";

const COOLDOWN_MS = 3 * 1000; // 3 seconds — matches scanner debounce, allows quick entry/exit re-scans
const USER_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const GENESIS_HASH = "GENESIS_HASH_00000000000000000000000000000000000000000000000000000000";

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(KEY_DEVICE);
    if (!id) {
      id = "dev_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem(KEY_DEVICE, id);
    }
    return id;
  } catch {
    return "dev_anonymous";
  }
}

// Synchronous SHA-256 implementation for tamper-evident hash chaining
export function sha256Sync(ascii: string): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i: number, j: number;
  let result = "";

  const words: number[] = [];
  const asciiLength = ascii.length * 8;

  let hash = (sha256Sync as any).h = (sha256Sync as any).h || [];
  let k = (sha256Sync as any).k = (sha256Sync as any).k || [];
  let primeCounter = k.length;

  const isPrime = (candidate: number) => {
    for (let factor = 2; factor * factor <= candidate; factor++) {
      if (candidate % factor === 0) return false;
    }
    return true;
  };

  const getFractionalBits = (n: number) => Math.floor((n - Math.floor(n)) * maxWord);

  if (!primeCounter) {
    for (let n = 2; primeCounter < 64; n++) {
      if (isPrime(n)) {
        if (primeCounter < 8) {
          hash[primeCounter] = getFractionalBits(mathPow(n, 1 / 2));
        }
        k[primeCounter] = getFractionalBits(mathPow(n, 1 / 3));
        primeCounter++;
      }
    }
  }

  hash = hash.slice(0);
  ascii += "\x80";
  while ((ascii.length % 64) - 56) ascii += "\x00";
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return "";
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = (asciiLength / maxWord) | 0;
  words[words.length] = asciiLength | 0;

  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];

      const s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & hash[5]) ^ (~e & hash[6]);
      const temp1 = hash[7] + s1 + ch + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14)) ^ (w15 >>> 3)) + w[i - 7] + (((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13)) ^ (w2 >>> 10))) | 0);
      const maj = (a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = s0 + maj;

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

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

export function extractCleanId(raw: string): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const obj = JSON.parse(trimmed);
      if (obj && typeof obj.uniqueId === "string") return obj.uniqueId.trim().toUpperCase();
    } catch {}
  }
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      const q = u.searchParams.get("uniqueId") || u.searchParams.get("uid");
      if (q) return q.trim().toUpperCase();
      const last = u.pathname.split("/").filter(Boolean).pop();
      if (last) return decodeURIComponent(last).trim().toUpperCase();
    } catch {}
  }
  return trimmed.toUpperCase();
}

function buildIndex(users: CachedUser[]): Map<string, CachedUser> {
  const map = new Map<string, CachedUser>();
  for (const u of users) {
    if (u && u.uniqueId) {
      map.set(extractCleanId(u.uniqueId), u);
      map.set(u.uniqueId.trim().toUpperCase(), u);
    }
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
  if (!uniqueId) return undefined;
  const clean = extractCleanId(uniqueId);
  return getIndex().get(clean) || getIndex().get(uniqueId.trim().toUpperCase());
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
  const rawQueue = readJson<PendingScan[]>(KEY_QUEUE, []);
  // Ensure every item in queue has a valid, non-empty clientScanId for reliable server sync matching
  return rawQueue.map((s, idx) => ({
    ...s,
    clientScanId: (s.clientScanId && s.clientScanId.trim())
      ? s.clientScanId.trim()
      : `scan_${s.scannedAt || Date.now()}_${s.uniqueId || idx}_${Math.random().toString(36).slice(2, 6)}`,
  }));
}

function setQueue(items: PendingScan[]) {
  writeJson(KEY_QUEUE, items);
}

export function clearLocalQueue() {
  setQueue([]);
  try { localStorage.setItem(KEY_LASTSYNC, String(Date.now())); } catch {}
}

function getNextSeqNo(): number {
  try {
    const raw = localStorage.getItem(KEY_SEQ);
    const n = raw ? parseInt(raw, 10) : 0;
    const next = (Number.isFinite(n) && n >= 0 ? n : 0) + 1;
    localStorage.setItem(KEY_SEQ, String(next));
    return next;
  } catch {
    return 1;
  }
}

export function enqueueScan(uniqueId: string, isLateEntry?: boolean): PendingScan {
  const q = getQueue();
  const prevScan = q[q.length - 1];
  const prevHash = prevScan?.hash || GENESIS_HASH;
  const clientScanId = `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const scannedAt = new Date().toISOString();
  const cleanId = uniqueId.trim();
  const seqNo = getNextSeqNo();
  const deviceId = getDeviceId();
  const hash = sha256Sync(`${clientScanId}:${cleanId}:${scannedAt}:${seqNo}:${prevHash}`);

  const scan: PendingScan = {
    clientScanId,
    uniqueId: cleanId,
    scannedAt,
    attempts: 0,
    hash,
    prevHash,
    seqNo,
    deviceId,
    isLateEntry,
  };
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
  receipt?: string;
};

let isSyncingInProgress = false;

export async function syncQueue(): Promise<SyncResult> {
  if (isSyncingInProgress) {
    return { attempted: 0, synced: 0, failed: 0, skipped: 0 };
  }
  isSyncingInProgress = true;

  try {
    const queue = getQueue();
    if (queue.length === 0) {
      return { attempted: 0, synced: 0, failed: 0, skipped: 0 };
    }

    const batch = queue.slice(0, 200);
    const deviceId = getDeviceId();
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const payload = {
      batchId,
      deviceId,
      scans: batch.map((s) => ({
        clientScanId: s.clientScanId,
        uniqueId: s.uniqueId,
        scannedAt: s.scannedAt,
        hash: s.hash,
        prevHash: s.prevHash,
        seqNo: s.seqNo,
        deviceId: s.deviceId || deviceId,
        isLateEntry: s.isLateEntry || false,
      })),
    };

    let response: any;
    let fetchError = "";

    try {
      const token = localStorage.getItem("qr_token") || localStorage.getItem("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      response = await customFetch<{ results: any[]; syncReceipt?: string }>("/api/scan/batch", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      fetchError = String(err?.message || err || "");
      console.warn("customFetch failed, trying direct window.fetch with timeout:", fetchError);
      try {
        const token = localStorage.getItem("qr_token") || localStorage.getItem("token");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10_000); // 10s strict timeout

        const res = await window.fetch("/api/scan/batch", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          response = await res.json();
          fetchError = "";
        } else {
          fetchError = `Direct fetch HTTP ${res.status}: ${await res.text()}`;
        }
      } catch (directErr: any) {
        fetchError = `Direct fetch error: ${directErr?.message || String(directErr)}`;
      }
    }

    if (!response || !Array.isArray(response.results)) {
      console.error("syncQueue failed on all endpoints:", fetchError);
      try { localStorage.setItem("qr_last_sync_error", fetchError); } catch {}
      // Re-read current fresh queue from storage before updating attempt counts
      const freshQueue = getQueue();
      const updated = freshQueue.map((s) => {
        const inBatch = batch.find((b) => b.clientScanId === s.clientScanId);
        return inBatch ? { ...s, attempts: s.attempts + 1 } : s;
      });
      setQueue(updated);
      return { attempted: batch.length, synced: 0, failed: batch.length, skipped: 0 };
    }

    try { localStorage.removeItem("qr_last_sync_error"); } catch {}

    if (typeof response?.syncReceipt === "string") {
      try { localStorage.setItem(KEY_RECEIPT, response.syncReceipt); } catch {}
    }

    const results: any[] = response.results;
    const acceptedClientIds = new Set<string>();
    let synced = 0;
    let skipped = 0;

    for (const r of results) {
      if (!r) continue;
      const cid = String(r.clientScanId || "").trim();
      if (cid) acceptedClientIds.add(cid);

      if (r.status === "ok" || r.status === "duplicate" || r.status === "user_not_found" || r.status === "max_reached" || r.status === "invalid" || r.action) {
        synced++;
      } else {
        skipped++;
      }
    }

    // Re-read current fresh queue from storage before filtering out accepted scans
    // This prevents wiping out newly enqueued scans that arrived during fetch!
    const freshQueue = getQueue();
    const remaining = freshQueue.filter((s) => !acceptedClientIds.has(s.clientScanId));

    setQueue(remaining);
    localStorage.setItem(KEY_LASTSYNC, String(Date.now()));

    return {
      attempted: batch.length,
      synced,
      failed: batch.length - synced - skipped,
      skipped,
    };
  } finally {
    isSyncingInProgress = false;
  }
}

export function clearQueue() {
  setQueue([]);
}

export function clearCooldowns() {
  localStorage.removeItem(KEY_COOLDOWN);
}
