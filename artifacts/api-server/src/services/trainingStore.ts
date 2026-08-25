import { supabase } from "../lib/supabase.js";

export interface TrainingSubSession {
  id: number;
  name: string; // e.g. "Session 1", "Session 2"
  studentIds: number[];
  startTime?: string;
  endTime?: string;
  trainerKey?: string;
}

export interface TrainingSession {
  id: number;
  name: string;
  company: string;
  description: string;
  createdAt: string;
  studentIds: number[];
  subSessions?: TrainingSubSession[];
  trainerKeys: Array<{
    id: number;
    name: string;
    email: string;
    key: string;
    subSessionId?: number;
  }>;
}

export interface TrainingAttendanceRecord {
  trainingId: number;
  subSessionId?: number;
  userId: number;
  date: string;
  markedPresent: boolean;
  markedBy: string;
  markedAt: string;
}

export interface TrainingStoreData {
  sessions: TrainingSession[];
  attendance: TrainingAttendanceRecord[];
}

const STORE_MENTOR_ID = 9999;
const STORE_MENTOR_EMAIL = "training_store@sphoorthyengg.ac.in";

const B1_IDS = [82, 61, 76, 35, 74, 111, 95, 121, 71, 6, 40, 89, 112, 80, 96, 42, 59, 4, 64, 120, 26, 58, 107, 94, 63, 79, 106, 53, 38, 60, 20, 46, 92, 122, 113, 23, 93, 110, 108, 72, 75, 19, 81, 77, 109, 56, 91, 78, 8, 2, 7, 14, 5, 115, 21, 116, 54, 44, 118, 73, 39, 41, 90];
const B2_IDS = [132, 218, 211, 274, 169, 272, 128, 162, 171, 158, 165, 220, 229, 175, 142, 216, 222, 138, 161, 203, 224, 187, 200, 175, 242, 262, 280, 164, 172, 181, 223, 130, 255, 148, 192, 183, 185, 217, 232, 213, 221, 254, 168, 249, 222, 223, 226, 241, 140, 126, 189, 124, 228, 144, 281, 167, 204, 238, 188, 191, 253, 206, 190, 198, 243, 135, 245, 170, 131, 143, 227, 196, 157, 173, 279, 278, 166, 240, 195, 221, 127];
const ALL_IDS = Array.from(new Set([...B1_IDS, ...B2_IDS]));

// Initial default data with Next Gen Employability Training presets
const defaultData: TrainingStoreData = {
  sessions: [
    {
      id: 1,
      name: "NEXT GEN EMPLOYABILITY TRAINING",
      company: "NEXT GEN",
      description: "Full Stack Employability, Soft Skills & Aptitude Bootcamp",
      createdAt: "2026-08-19T00:00:00.000Z",
      studentIds: ALL_IDS,
      subSessions: [
        {
          id: 1,
          name: "Session 1 (Final years)",
          studentIds: B1_IDS,
          startTime: "09:00",
          endTime: "12:30"
        },
        {
          id: 2,
          name: "Session 2 (Pre Final years)",
          studentIds: B2_IDS,
          startTime: "13:30",
          endTime: "16:30"
        }
      ],
      trainerKeys: [
        {
          id: 901,
          name: "NEXT GEN Lead Trainer",
          email: "trainer@nextgen.com",
          key: "802"
        }
      ]
    }
  ],
  attendance: []
};

// In-memory cache for 0ms ultra-fast reads & writes
let memoryStore: TrainingStoreData = { ...defaultData };
let lastLoadedAt = 0;

// Load data from Supabase Postgres database
export async function syncFromSupabase(): Promise<TrainingStoreData> {
  try {
    const { data, error } = await supabase
      .from("qr_mentors")
      .select("password_hash")
      .eq("id", STORE_MENTOR_ID)
      .limit(1);

    if (error || !data || data.length === 0) {
      await supabase.from("qr_mentors").upsert({
        id: STORE_MENTOR_ID,
        email: STORE_MENTOR_EMAIL,
        name: "SYSTEM_TRAINING_STORE",
        password_hash: JSON.stringify(defaultData),
        key: "SYS_TRAIN"
      });
      memoryStore = { ...defaultData };
      lastLoadedAt = Date.now();
      return memoryStore;
    }

    const raw = data[0]?.password_hash;
    if (raw && raw.startsWith("{")) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.sessions) && parsed.sessions.length > 0) {
        memoryStore.sessions = parsed.sessions;
      }
      if (Array.isArray(parsed.attendance)) memoryStore.attendance = parsed.attendance;
      lastLoadedAt = Date.now();
    }
  } catch (err) {
    console.error("Error syncing training store from Supabase:", err);
  }
  return memoryStore;
}

// Save data back to Supabase Postgres database
export async function syncToSupabase(data: TrainingStoreData): Promise<void> {
  try {
    await supabase.from("qr_mentors").upsert({
      id: STORE_MENTOR_ID,
      email: STORE_MENTOR_EMAIL,
      name: "SYSTEM_TRAINING_STORE",
      password_hash: JSON.stringify(data),
      key: "SYS_TRAIN"
    });
  } catch (err) {
    console.error("Error saving training store to Supabase:", err);
  }
}

// Pre-load at startup
syncFromSupabase().catch(() => {});

export async function ensureFreshStore(): Promise<TrainingStoreData> {
  if (Date.now() - lastLoadedAt > 60000) {
    await syncFromSupabase();
  }
  return memoryStore;
}

export function getTrainingSessions(): TrainingSession[] {
  ensureFreshStore().catch(() => {});
  return memoryStore.sessions;
}

export function getTrainingSessionById(id: number): TrainingSession | undefined {
  ensureFreshStore().catch(() => {});
  const found = memoryStore.sessions.find(s => s.id === id);
  if (found) return found;
  return memoryStore.sessions[0];
}

export function getTrainingSessionByTrainerKey(key: string): TrainingSession | undefined {
  const cleanKey = String(key || "").trim();
  ensureFreshStore().catch(() => {});
  return memoryStore.sessions.find(s => s.trainerKeys && s.trainerKeys.some(tk => String(tk.key).trim() === cleanKey));
}

export function saveTrainingSession(session: Partial<TrainingSession> & { name: string }): TrainingSession {
  const id = session.id || (memoryStore.sessions.length > 0 ? Math.max(...memoryStore.sessions.map(s => s.id)) + 1 : 1);
  const existingIndex = memoryStore.sessions.findIndex(s => s.id === id);

  const fullSession: TrainingSession = {
    id,
    name: session.name,
    company: session.company || "Corporate",
    description: session.description || "",
    createdAt: session.createdAt || new Date().toISOString(),
    studentIds: Array.isArray(session.studentIds) ? session.studentIds : [],
    subSessions: Array.isArray(session.subSessions) ? session.subSessions : (existingIndex >= 0 ? memoryStore.sessions[existingIndex].subSessions || [] : [
      { id: 1, name: "Session 1", studentIds: [] },
      { id: 2, name: "Session 2", studentIds: [] }
    ]),
    trainerKeys: Array.isArray(session.trainerKeys) ? session.trainerKeys : (existingIndex >= 0 ? memoryStore.sessions[existingIndex].trainerKeys || [] : [])
  };

  if (existingIndex >= 0) {
    memoryStore.sessions[existingIndex] = fullSession;
  } else {
    memoryStore.sessions.push(fullSession);
  }

  syncToSupabase(memoryStore).catch(console.error);
  return fullSession;
}

export function deleteTrainingSession(id: number): boolean {
  const initialLen = memoryStore.sessions.length;
  memoryStore.sessions = memoryStore.sessions.filter(s => s.id !== id);
  if (memoryStore.sessions.length !== initialLen) {
    memoryStore.attendance = memoryStore.attendance.filter(a => a.trainingId !== id);
    syncToSupabase(memoryStore).catch(console.error);
    return true;
  }
  return false;
}

export function saveSubSession(trainingId: number, sub: Partial<TrainingSubSession> & { name: string }): TrainingSubSession | undefined {
  const session = memoryStore.sessions.find(s => s.id === trainingId);
  if (!session) return undefined;

  if (!Array.isArray(session.subSessions)) session.subSessions = [];

  const subId = sub.id || (session.subSessions.length > 0 ? Math.max(...session.subSessions.map(x => x.id)) + 1 : 1);
  const existingIndex = session.subSessions.findIndex(x => x.id === subId);

  const fullSub: TrainingSubSession = {
    id: subId,
    name: sub.name.trim(),
    studentIds: Array.isArray(sub.studentIds) ? sub.studentIds : (existingIndex >= 0 ? session.subSessions[existingIndex].studentIds : []),
    startTime: sub.startTime,
    endTime: sub.endTime,
    trainerKey: sub.trainerKey
  };

  if (existingIndex >= 0) {
    session.subSessions[existingIndex] = fullSub;
  } else {
    session.subSessions.push(fullSub);
  }

  const allEnrolledSet = new Set<number>(session.studentIds || []);
  session.subSessions.forEach(ss => (ss.studentIds || []).forEach(sid => allEnrolledSet.add(sid)));
  session.studentIds = Array.from(allEnrolledSet);

  syncToSupabase(memoryStore).catch(console.error);
  return fullSub;
}

export function deleteSubSession(trainingId: number, subSessionId: number): boolean {
  const session = memoryStore.sessions.find(s => s.id === trainingId);
  if (!session || !session.subSessions) return false;

  const initLen = session.subSessions.length;
  session.subSessions = session.subSessions.filter(x => x.id !== subSessionId);
  memoryStore.attendance = memoryStore.attendance.filter(a => !(a.trainingId === trainingId && a.subSessionId === subSessionId));
  syncToSupabase(memoryStore).catch(console.error);
  return session.subSessions.length < initLen;
}

export function addTrainerKeyToSession(
  sessionId: number,
  trainer: { name: string; email?: string; key: string; subSessionId?: number }
): TrainingSession | undefined {
  const session = memoryStore.sessions.find(s => s.id === sessionId);
  if (!session) return undefined;

  const nextKeyId = session.trainerKeys.length > 0 ? Math.max(...session.trainerKeys.map(k => k.id)) + 1 : 901;
  session.trainerKeys.push({
    id: nextKeyId,
    name: trainer.name,
    email: trainer.email || "",
    key: String(trainer.key).trim(),
    subSessionId: trainer.subSessionId
  });

  syncToSupabase(memoryStore).catch(console.error);
  return session;
}

export function updateSubSessionStudents(
  sessionId: number,
  subSessionId: number,
  studentIds: number[]
): TrainingSession | undefined {
  const session = memoryStore.sessions.find(s => s.id === sessionId);
  if (!session) return undefined;

  if (!session.subSessions) session.subSessions = [];
  const sub = session.subSessions.find(s => s.id === subSessionId);
  if (sub) {
    sub.studentIds = studentIds;
  } else {
    session.subSessions.push({
      id: subSessionId,
      name: `Session ${subSessionId}`,
      studentIds
    });
  }

  const allEnrolledSet = new Set<number>(session.studentIds || []);
  session.subSessions.forEach(s => s.studentIds.forEach(id => allEnrolledSet.add(id)));
  session.studentIds = Array.from(allEnrolledSet);

  syncToSupabase(memoryStore).catch(console.error);
  return session;
}

export function markTrainingAttendance(records: Array<{ trainingId: number; subSessionId?: number; userId: number; date: string; markedPresent: boolean; markedBy?: string }>) {
  records.forEach(r => {
    const existingIndex = memoryStore.attendance.findIndex(
      a => a.trainingId === r.trainingId &&
           (r.subSessionId ? a.subSessionId === r.subSessionId : true) &&
           a.userId === r.userId &&
           a.date === r.date
    );

    const rec: TrainingAttendanceRecord = {
      trainingId: r.trainingId,
      subSessionId: r.subSessionId,
      userId: r.userId,
      date: r.date,
      markedPresent: r.markedPresent,
      markedBy: r.markedBy || "Trainer",
      markedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      memoryStore.attendance[existingIndex] = rec;
    } else {
      memoryStore.attendance.push(rec);
    }
  });

  syncToSupabase(memoryStore).catch(console.error);
}

export function clearTrainingAttendance(trainingId?: number, date?: string) {
  if (trainingId && date) {
    memoryStore.attendance = memoryStore.attendance.filter(a => !(a.trainingId === trainingId && a.date === date));
  } else if (trainingId) {
    memoryStore.attendance = memoryStore.attendance.filter(a => a.trainingId !== trainingId);
  } else {
    memoryStore.attendance = [];
  }
  syncToSupabase(memoryStore).catch(console.error);
}

export function saveTrainingAttendanceBatch(
  trainingId: number,
  records: Array<{ userId: number; markedPresent: boolean; subSessionId?: number }>,
  date: string,
  markedBy: string
): TrainingAttendanceRecord[] {
  const newRecords: TrainingAttendanceRecord[] = records.map(r => ({
    trainingId,
    subSessionId: r.subSessionId,
    userId: r.userId,
    date,
    markedPresent: r.markedPresent,
    markedBy,
    markedAt: new Date().toISOString()
  }));

  const userIds = new Set(records.map(r => r.userId));
  memoryStore.attendance = memoryStore.attendance.filter(
    a => !(a.trainingId === trainingId && a.date === date && userIds.has(a.userId) && (r_subMatch(a.subSessionId, records[0]?.subSessionId)))
  );

  memoryStore.attendance.push(...newRecords);
  syncToSupabase(memoryStore).catch(console.error);
  return newRecords;
}

function r_subMatch(subA?: number, subB?: number): boolean {
  if (!subA && !subB) return true;
  return subA === subB;
}

export function getTrainingAttendanceForDate(
  date: string,
  trainingId?: number,
  subSessionId?: number
): TrainingAttendanceRecord[] {
  ensureFreshStore().catch(() => {});
  return memoryStore.attendance.filter(a => {
    if (a.date !== date) return false;
    if (trainingId && a.trainingId !== trainingId) return false;
    if (subSessionId && a.subSessionId !== subSessionId) return false;
    return true;
  });
}

export function getPresentUserIdsInTrainingForDate(date: string): number[] {
  ensureFreshStore().catch(() => {});
  return memoryStore.attendance
    .filter(a => a.date === date && a.markedPresent)
    .map(a => a.userId);
}

export function getUserTrainingAttendanceForDate(userId: number, date: string): TrainingAttendanceRecord[] {
  ensureFreshStore().catch(() => {});
  return memoryStore.attendance.filter(a => a.userId === userId && a.date === date && a.markedPresent);
}
