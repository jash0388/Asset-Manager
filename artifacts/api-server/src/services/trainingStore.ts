import { supabase } from "../lib/supabase.js";

export interface TrainingSession {
  id: number;
  name: string;
  company: string;
  description: string;
  createdAt: string;
  studentIds: number[];
  trainerKeys: Array<{
    id: number;
    name: string;
    email: string;
    key: string;
  }>;
}

export interface TrainingAttendanceRecord {
  trainingId: number;
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

// Initial default data
const defaultData: TrainingStoreData = {
  sessions: [
    {
      id: 1,
      name: "Wipro Training",
      company: "Wipro",
      description: "Full Stack Development & Quantitative Aptitude Training",
      createdAt: "2026-08-19T00:00:00.000Z",
      studentIds: [],
      trainerKeys: [
        {
          id: 901,
          name: "Wipro Lead Trainer",
          email: "wipro.trainer@sphoorthyengg.ac.in",
          key: "801"
        }
      ]
    }
  ],
  attendance: []
};

// In-memory cache
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
      // Initialize row in Supabase
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
      if (Array.isArray(parsed.sessions)) memoryStore.sessions = parsed.sessions;
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

// Helper to ensure fresh data (re-sync if older than 5s)
export async function ensureFreshStore(): Promise<TrainingStoreData> {
  if (Date.now() - lastLoadedAt > 5000) {
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
  return memoryStore.sessions.find(s => s.id === id);
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
    trainerKeys: Array.isArray(session.trainerKeys) ? session.trainerKeys : [
      {
        id: 900 + id,
        name: `${session.name} Trainer`,
        email: `trainer.${id}@sphoorthyengg.ac.in`,
        key: String(800 + id)
      }
    ]
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
  const initLen = memoryStore.sessions.length;
  memoryStore.sessions = memoryStore.sessions.filter(s => s.id !== id);
  memoryStore.attendance = memoryStore.attendance.filter(a => a.trainingId !== id);
  syncToSupabase(memoryStore).catch(console.error);
  return memoryStore.sessions.length < initLen;
}

export function addTrainerKeyToSession(trainingId: number, trainer: { name: string; email: string; key: string }): TrainingSession | undefined {
  const session = memoryStore.sessions.find(s => s.id === trainingId);
  if (!session) return undefined;

  const newTrainerId = 9000 + Math.floor(Math.random() * 1000);
  session.trainerKeys.push({
    id: newTrainerId,
    name: trainer.name,
    email: trainer.email,
    key: String(trainer.key).trim()
  });

  syncToSupabase(memoryStore).catch(console.error);
  return session;
}

export function markTrainingAttendance(records: Array<{ trainingId: number; userId: number; date: string; markedPresent: boolean; markedBy?: string }>) {
  records.forEach(r => {
    const existingIndex = memoryStore.attendance.findIndex(
      a => a.trainingId === r.trainingId && a.userId === r.userId && a.date === r.date
    );

    const rec: TrainingAttendanceRecord = {
      trainingId: r.trainingId,
      userId: r.userId,
      date: r.date,
      markedPresent: r.markedPresent,
      markedBy: r.markedBy || "HOD/Trainer",
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

export function getTrainingAttendanceForDate(date: string, trainingId?: number): TrainingAttendanceRecord[] {
  ensureFreshStore().catch(() => {});
  return memoryStore.attendance.filter(a => a.date === date && (!trainingId || a.trainingId === trainingId));
}

export function getPresentUserIdsInTrainingForDate(date: string): number[] {
  ensureFreshStore().catch(() => {});
  return memoryStore.attendance
    .filter(a => a.date === date && a.markedPresent)
    .map(a => a.userId);
}
