import fs from "fs";
import path from "path";

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

interface TrainingStoreData {
  sessions: TrainingSession[];
  attendance: TrainingAttendanceRecord[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "training_store.json");

// Default initial state with Wipro Training preset if none exists
const defaultData: TrainingStoreData = {
  sessions: [
    {
      id: 1,
      name: "Wipro Training",
      company: "Wipro",
      description: "Full Stack Development & Quantitative Aptitude Training",
      createdAt: new Date().toISOString(),
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

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadTrainingStore(): TrainingStoreData {
  try {
    ensureDir();
    if (!fs.existsSync(STORE_FILE)) {
      saveTrainingStore(defaultData);
      return defaultData;
    }
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.sessions)) parsed.sessions = defaultData.sessions;
    if (!Array.isArray(parsed.attendance)) parsed.attendance = [];
    return parsed;
  } catch (err) {
    console.error("Error loading training store:", err);
    return defaultData;
  }
}

export function saveTrainingStore(data: TrainingStoreData) {
  try {
    ensureDir();
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving training store:", err);
  }
}

// Memory cache
let memoryStore: TrainingStoreData = loadTrainingStore();

export function getTrainingSessions(): TrainingSession[] {
  return memoryStore.sessions;
}

export function getTrainingSessionById(id: number): TrainingSession | undefined {
  return memoryStore.sessions.find(s => s.id === id);
}

export function getTrainingSessionByTrainerKey(key: string): TrainingSession | undefined {
  const cleanKey = String(key || "").trim();
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

  saveTrainingStore(memoryStore);
  return fullSession;
}

export function deleteTrainingSession(id: number): boolean {
  const initLen = memoryStore.sessions.length;
  memoryStore.sessions = memoryStore.sessions.filter(s => s.id !== id);
  memoryStore.attendance = memoryStore.attendance.filter(a => a.trainingId !== id);
  saveTrainingStore(memoryStore);
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

  saveTrainingStore(memoryStore);
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

  saveTrainingStore(memoryStore);
}

export function getTrainingAttendanceForDate(date: string, trainingId?: number): TrainingAttendanceRecord[] {
  return memoryStore.attendance.filter(a => a.date === date && (!trainingId || a.trainingId === trainingId));
}

export function getPresentUserIdsInTrainingForDate(date: string): number[] {
  return memoryStore.attendance
    .filter(a => a.date === date && a.markedPresent)
    .map(a => a.userId);
}
