import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load dotenv from workspace root
dotenv.config({ path: path.resolve(process.cwd(), "../../.env.production.local") });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type NewSchedule = {
  mentor_id: number;
  day_of_week: "MON" | "TUE" | "WED" | "THUR" | "FRI" | "SAT";
  start_time: string;
  end_time: string;
  section: "A" | "B" | "C";
  subject: string;
  year: "III" | "IV";
};

const newSchedules: NewSchedule[] = [
  // ==================== III YEAR SECTION A ====================
  // MON
  { mentor_id: 12, day_of_week: "MON", start_time: "09:00:00", end_time: "10:00:00", section: "A", subject: "Kafka Lab", year: "III" },
  { mentor_id: 12, day_of_week: "MON", start_time: "10:00:00", end_time: "11:00:00", section: "A", subject: "Kafka Lab", year: "III" },
  { mentor_id: 2, day_of_week: "MON", start_time: "11:10:00", end_time: "12:10:00", section: "A", subject: "ADA", year: "III" },
  { mentor_id: 10, day_of_week: "MON", start_time: "12:10:00", end_time: "13:10:00", section: "A", subject: "CN", year: "III" },
  { mentor_id: 6, day_of_week: "MON", start_time: "14:00:00", end_time: "15:00:00", section: "A", subject: "IDS", year: "III" },
  { mentor_id: 3, day_of_week: "MON", start_time: "15:00:00", end_time: "16:00:00", section: "A", subject: "DevOps", year: "III" },
  // TUE
  { mentor_id: 10, day_of_week: "TUE", start_time: "09:00:00", end_time: "10:00:00", section: "A", subject: "CN", year: "III" },
  { mentor_id: 2, day_of_week: "TUE", start_time: "10:00:00", end_time: "11:00:00", section: "A", subject: "ADA", year: "III" },
  { mentor_id: 8, day_of_week: "TUE", start_time: "11:10:00", end_time: "12:10:00", section: "A", subject: "WP", year: "III" },
  { mentor_id: 8, day_of_week: "TUE", start_time: "12:10:00", end_time: "13:10:00", section: "A", subject: "Counselling", year: "III" },
  { mentor_id: 3, day_of_week: "TUE", start_time: "14:00:00", end_time: "15:00:00", section: "A", subject: "DevOps", year: "III" },
  { mentor_id: 8, day_of_week: "TUE", start_time: "15:00:00", end_time: "16:00:00", section: "A", subject: "Sports", year: "III" },
  // WED
  { mentor_id: 8, day_of_week: "WED", start_time: "09:00:00", end_time: "10:00:00", section: "A", subject: "ARQA", year: "III" },
  { mentor_id: 8, day_of_week: "WED", start_time: "10:00:00", end_time: "11:00:00", section: "A", subject: "WP", year: "III" },
  { mentor_id: 3, day_of_week: "WED", start_time: "11:10:00", end_time: "12:10:00", section: "A", subject: "DevOps", year: "III" },
  { mentor_id: 2, day_of_week: "WED", start_time: "12:10:00", end_time: "13:10:00", section: "A", subject: "ADA", year: "III" },
  { mentor_id: 10, day_of_week: "WED", start_time: "14:00:00", end_time: "15:00:00", section: "A", subject: "CN Lab", year: "III" },
  { mentor_id: 6, day_of_week: "WED", start_time: "14:00:00", end_time: "15:00:00", section: "A", subject: "R Programming Lab", year: "III" },
  { mentor_id: 10, day_of_week: "WED", start_time: "15:00:00", end_time: "16:00:00", section: "A", subject: "CN Lab", year: "III" },
  { mentor_id: 6, day_of_week: "WED", start_time: "15:00:00", end_time: "16:00:00", section: "A", subject: "R Programming Lab", year: "III" },
  // THUR
  { mentor_id: 8, day_of_week: "THUR", start_time: "09:00:00", end_time: "10:00:00", section: "A", subject: "WP", year: "III" },
  { mentor_id: 6, day_of_week: "THUR", start_time: "10:00:00", end_time: "11:00:00", section: "A", subject: "IDS", year: "III" },
  { mentor_id: 2, day_of_week: "THUR", start_time: "11:10:00", end_time: "12:10:00", section: "A", subject: "ADA", year: "III" },
  { mentor_id: 8, day_of_week: "THUR", start_time: "12:10:00", end_time: "13:10:00", section: "A", subject: "Library", year: "III" },
  { mentor_id: 10, day_of_week: "THUR", start_time: "14:00:00", end_time: "15:00:00", section: "A", subject: "CN Lab", year: "III" },
  { mentor_id: 6, day_of_week: "THUR", start_time: "14:00:00", end_time: "15:00:00", section: "A", subject: "R Programming Lab", year: "III" },
  { mentor_id: 10, day_of_week: "THUR", start_time: "15:00:00", end_time: "16:00:00", section: "A", subject: "CN Lab", year: "III" },
  { mentor_id: 6, day_of_week: "THUR", start_time: "15:00:00", end_time: "16:00:00", section: "A", subject: "R Programming Lab", year: "III" },
  // FRI
  { mentor_id: 3, day_of_week: "FRI", start_time: "09:00:00", end_time: "10:00:00", section: "A", subject: "DevOps", year: "III" },
  { mentor_id: 8, day_of_week: "FRI", start_time: "10:00:00", end_time: "11:00:00", section: "A", subject: "WP", year: "III" },
  { mentor_id: 6, day_of_week: "FRI", start_time: "11:10:00", end_time: "12:10:00", section: "A", subject: "IDS", year: "III" },
  { mentor_id: 10, day_of_week: "FRI", start_time: "12:10:00", end_time: "13:10:00", section: "A", subject: "CN", year: "III" },
  { mentor_id: 8, day_of_week: "FRI", start_time: "14:00:00", end_time: "15:00:00", section: "A", subject: "AECS Lab", year: "III" },
  { mentor_id: 8, day_of_week: "FRI", start_time: "15:00:00", end_time: "16:00:00", section: "A", subject: "AECS Lab", year: "III" },
  // SAT
  { mentor_id: 10, day_of_week: "SAT", start_time: "09:00:00", end_time: "10:00:00", section: "A", subject: "CN", year: "III" },
  { mentor_id: 6, day_of_week: "SAT", start_time: "10:00:00", end_time: "11:00:00", section: "A", subject: "IDS", year: "III" },
  { mentor_id: 8, day_of_week: "SAT", start_time: "11:10:00", end_time: "12:10:00", section: "A", subject: "IPR", year: "III" },
  { mentor_id: 8, day_of_week: "SAT", start_time: "12:10:00", end_time: "13:10:00", section: "A", subject: "IPR", year: "III" },
  { mentor_id: 8, day_of_week: "SAT", start_time: "14:00:00", end_time: "15:00:00", section: "A", subject: "Club Activities", year: "III" },
  { mentor_id: 8, day_of_week: "SAT", start_time: "15:00:00", end_time: "16:00:00", section: "A", subject: "Club Activities", year: "III" },

  // ==================== III YEAR SECTION B ====================
  // MON
  { mentor_id: 10, day_of_week: "MON", start_time: "09:00:00", end_time: "10:00:00", section: "B", subject: "CN", year: "III" },
  { mentor_id: 10, day_of_week: "MON", start_time: "10:00:00", end_time: "11:00:00", section: "B", subject: "CN", year: "III" },
  { mentor_id: 9, day_of_week: "MON", start_time: "11:10:00", end_time: "12:10:00", section: "B", subject: "IDS", year: "III" },
  { mentor_id: 6, day_of_week: "MON", start_time: "12:10:00", end_time: "13:10:00", section: "B", subject: "Counselling", year: "III" },
  { mentor_id: 2, day_of_week: "MON", start_time: "14:00:00", end_time: "15:00:00", section: "B", subject: "ADA", year: "III" },
  { mentor_id: 3, day_of_week: "MON", start_time: "15:00:00", end_time: "16:00:00", section: "B", subject: "DevOps", year: "III" },
  // TUE
  { mentor_id: 3, day_of_week: "TUE", start_time: "09:00:00", end_time: "10:00:00", section: "B", subject: "DevOps", year: "III" },
  { mentor_id: 8, day_of_week: "TUE", start_time: "10:00:00", end_time: "11:00:00", section: "B", subject: "WP", year: "III" },
  { mentor_id: 10, day_of_week: "TUE", start_time: "11:10:00", end_time: "12:10:00", section: "B", subject: "CN", year: "III" },
  { mentor_id: 6, day_of_week: "TUE", start_time: "12:10:00", end_time: "13:10:00", section: "B", subject: "Library", year: "III" },
  { mentor_id: 2, day_of_week: "TUE", start_time: "14:00:00", end_time: "15:00:00", section: "B", subject: "ADA", year: "III" },
  { mentor_id: 8, day_of_week: "TUE", start_time: "15:00:00", end_time: "16:00:00", section: "B", subject: "WP", year: "III" },
  // WED
  { mentor_id: 9, day_of_week: "WED", start_time: "09:00:00", end_time: "10:00:00", section: "B", subject: "IDS", year: "III" },
  { mentor_id: 6, day_of_week: "WED", start_time: "10:00:00", end_time: "11:00:00", section: "B", subject: "ARQA", year: "III" },
  { mentor_id: 8, day_of_week: "WED", start_time: "11:10:00", end_time: "12:10:00", section: "B", subject: "WP", year: "III" },
  { mentor_id: 10, day_of_week: "WED", start_time: "12:10:00", end_time: "13:10:00", section: "B", subject: "CN", year: "III" },
  { mentor_id: 10, day_of_week: "WED", start_time: "14:00:00", end_time: "15:00:00", section: "B", subject: "CN Lab", year: "III" },
  { mentor_id: 9, day_of_week: "WED", start_time: "14:00:00", end_time: "15:00:00", section: "B", subject: "R Programming Lab", year: "III" },
  { mentor_id: 10, day_of_week: "WED", start_time: "15:00:00", end_time: "16:00:00", section: "B", subject: "CN Lab", year: "III" },
  { mentor_id: 9, day_of_week: "WED", start_time: "15:00:00", end_time: "16:00:00", section: "B", subject: "R Programming Lab", year: "III" },
  // THUR
  { mentor_id: 10, day_of_week: "THUR", start_time: "09:00:00", end_time: "10:00:00", section: "B", subject: "CN Lab", year: "III" },
  { mentor_id: 9, day_of_week: "THUR", start_time: "09:00:00", end_time: "10:00:00", section: "B", subject: "R Programming Lab", year: "III" },
  { mentor_id: 10, day_of_week: "THUR", start_time: "10:00:00", end_time: "11:00:00", section: "B", subject: "CN Lab", year: "III" },
  { mentor_id: 9, day_of_week: "THUR", start_time: "10:00:00", end_time: "11:00:00", section: "B", subject: "R Programming Lab", year: "III" },
  { mentor_id: 3, day_of_week: "THUR", start_time: "11:10:00", end_time: "12:10:00", section: "B", subject: "DevOps", year: "III" },
  { mentor_id: 8, day_of_week: "THUR", start_time: "12:10:00", end_time: "13:10:00", section: "B", subject: "WP", year: "III" },
  { mentor_id: 2, day_of_week: "THUR", start_time: "14:00:00", end_time: "15:00:00", section: "B", subject: "ADA", year: "III" },
  { mentor_id: 6, day_of_week: "THUR", start_time: "15:00:00", end_time: "16:00:00", section: "B", subject: "Sports", year: "III" },
  // FRI
  { mentor_id: 12, day_of_week: "FRI", start_time: "09:00:00", end_time: "10:00:00", section: "B", subject: "Kafka Lab", year: "III" },
  { mentor_id: 12, day_of_week: "FRI", start_time: "10:00:00", end_time: "11:00:00", section: "B", subject: "Kafka Lab", year: "III" },
  { mentor_id: 10, day_of_week: "FRI", start_time: "11:10:00", end_time: "12:10:00", section: "B", subject: "CN", year: "III" },
  { mentor_id: 9, day_of_week: "FRI", start_time: "12:10:00", end_time: "13:10:00", section: "B", subject: "IDS", year: "III" },
  { mentor_id: 2, day_of_week: "FRI", start_time: "14:00:00", end_time: "15:00:00", section: "B", subject: "ADA", year: "III" },
  { mentor_id: 9, day_of_week: "FRI", start_time: "15:00:00", end_time: "16:00:00", section: "B", subject: "IDS", year: "III" },
  // SAT
  { mentor_id: 6, day_of_week: "SAT", start_time: "09:00:00", end_time: "10:00:00", section: "B", subject: "AECS Lab", year: "III" },
  { mentor_id: 6, day_of_week: "SAT", start_time: "10:00:00", end_time: "11:00:00", section: "B", subject: "AECS Lab", year: "III" },
  { mentor_id: 6, day_of_week: "SAT", start_time: "11:10:00", end_time: "12:10:00", section: "B", subject: "IPR", year: "III" },
  { mentor_id: 6, day_of_week: "SAT", start_time: "12:10:00", end_time: "13:10:00", section: "B", subject: "IPR", year: "III" },
  { mentor_id: 6, day_of_week: "SAT", start_time: "14:00:00", end_time: "15:00:00", section: "B", subject: "Club Activities", year: "III" },
  { mentor_id: 6, day_of_week: "SAT", start_time: "15:00:00", end_time: "16:00:00", section: "B", subject: "Club Activities", year: "III" },

  // ==================== III YEAR SECTION C ====================
  // MON
  { mentor_id: 11, day_of_week: "MON", start_time: "09:00:00", end_time: "10:00:00", section: "C", subject: "CN Lab", year: "III" },
  { mentor_id: 9, day_of_week: "MON", start_time: "09:00:00", end_time: "10:00:00", section: "C", subject: "R Programming Lab", year: "III" },
  { mentor_id: 11, day_of_week: "MON", start_time: "10:00:00", end_time: "11:00:00", section: "C", subject: "CN Lab", year: "III" },
  { mentor_id: 9, day_of_week: "MON", start_time: "10:00:00", end_time: "11:00:00", section: "C", subject: "R Programming Lab", year: "III" },
  { mentor_id: 3, day_of_week: "MON", start_time: "11:10:00", end_time: "12:10:00", section: "C", subject: "DevOps", year: "III" },
  { mentor_id: 11, day_of_week: "MON", start_time: "12:10:00", end_time: "13:10:00", section: "C", subject: "CN", year: "III" },
  { mentor_id: 14, day_of_week: "MON", start_time: "14:00:00", end_time: "15:00:00", section: "C", subject: "WP", year: "III" },
  { mentor_id: 4, day_of_week: "MON", start_time: "15:00:00", end_time: "16:00:00", section: "C", subject: "Sports", year: "III" },
  // TUE
  { mentor_id: 11, day_of_week: "TUE", start_time: "09:00:00", end_time: "10:00:00", section: "C", subject: "CN Lab", year: "III" },
  { mentor_id: 9, day_of_week: "TUE", start_time: "09:00:00", end_time: "10:00:00", section: "C", subject: "R Programming Lab", year: "III" },
  { mentor_id: 11, day_of_week: "TUE", start_time: "10:00:00", end_time: "11:00:00", section: "C", subject: "CN Lab", year: "III" },
  { mentor_id: 9, day_of_week: "TUE", start_time: "10:00:00", end_time: "11:00:00", section: "C", subject: "R Programming Lab", year: "III" },
  { mentor_id: 4, day_of_week: "TUE", start_time: "11:10:00", end_time: "12:10:00", section: "C", subject: "ARQA", year: "III" },
  { mentor_id: 4, day_of_week: "TUE", start_time: "12:10:00", end_time: "13:10:00", section: "C", subject: "Library", year: "III" },
  { mentor_id: 11, day_of_week: "TUE", start_time: "14:00:00", end_time: "15:00:00", section: "C", subject: "CN", year: "III" },
  { mentor_id: 14, day_of_week: "TUE", start_time: "15:00:00", end_time: "16:00:00", section: "C", subject: "WP", year: "III" },
  // WED
  { mentor_id: 11, day_of_week: "WED", start_time: "09:00:00", end_time: "10:00:00", section: "C", subject: "CN", year: "III" },
  { mentor_id: 2, day_of_week: "WED", start_time: "10:00:00", end_time: "11:00:00", section: "C", subject: "ADA", year: "III" },
  { mentor_id: 4, day_of_week: "WED", start_time: "11:10:00", end_time: "12:10:00", section: "C", subject: "ARQA", year: "III" },
  { mentor_id: 4, day_of_week: "WED", start_time: "12:10:00", end_time: "13:10:00", section: "C", subject: "Library", year: "III" },
  { mentor_id: 9, day_of_week: "WED", start_time: "14:00:00", end_time: "15:00:00", section: "C", subject: "IDS", year: "III" },
  { mentor_id: 3, day_of_week: "WED", start_time: "15:00:00", end_time: "16:00:00", section: "C", subject: "DevOps", year: "III" },
  // THUR
  { mentor_id: 3, day_of_week: "THUR", start_time: "09:00:00", end_time: "10:00:00", section: "C", subject: "DevOps", year: "III" },
  { mentor_id: 14, day_of_week: "THUR", start_time: "10:00:00", end_time: "11:00:00", section: "C", subject: "WP", year: "III" },
  { mentor_id: 4, day_of_week: "THUR", start_time: "11:10:00", end_time: "12:10:00", section: "C", subject: "AECS Lab", year: "III" },
  { mentor_id: 4, day_of_week: "THUR", start_time: "12:10:00", end_time: "13:10:00", section: "C", subject: "Counselling", year: "III" },
  { mentor_id: 9, day_of_week: "THUR", start_time: "14:00:00", end_time: "15:00:00", section: "C", subject: "IDS", year: "III" },
  { mentor_id: 2, day_of_week: "THUR", start_time: "15:00:00", end_time: "16:00:00", section: "C", subject: "ADA", year: "III" },
  // FRI
  { mentor_id: 9, day_of_week: "FRI", start_time: "09:00:00", end_time: "10:00:00", section: "C", subject: "IDS", year: "III" },
  { mentor_id: 11, day_of_week: "FRI", start_time: "10:00:00", end_time: "11:00:00", section: "C", subject: "CN", year: "III" },
  { mentor_id: 2, day_of_week: "FRI", start_time: "11:10:00", end_time: "12:10:00", section: "C", subject: "ADA", year: "III" },
  { mentor_id: 3, day_of_week: "FRI", start_time: "12:10:00", end_time: "13:10:00", section: "C", subject: "DevOps", year: "III" },
  { mentor_id: 14, day_of_week: "FRI", start_time: "14:00:00", end_time: "15:00:00", section: "C", subject: "WP", year: "III" },
  { mentor_id: 9, day_of_week: "FRI", start_time: "15:00:00", end_time: "16:00:00", section: "C", subject: "IDS", year: "III" },
  // SAT
  { mentor_id: 12, day_of_week: "SAT", start_time: "09:00:00", end_time: "10:00:00", section: "C", subject: "Kafka Lab", year: "III" },
  { mentor_id: 12, day_of_week: "SAT", start_time: "10:00:00", end_time: "11:00:00", section: "C", subject: "Kafka Lab", year: "III" },
  { mentor_id: 4, day_of_week: "SAT", start_time: "11:10:00", end_time: "12:10:00", section: "C", subject: "IPR", year: "III" },
  { mentor_id: 4, day_of_week: "SAT", start_time: "12:10:00", end_time: "13:10:00", section: "C", subject: "IPR", year: "III" },
  { mentor_id: 4, day_of_week: "SAT", start_time: "14:00:00", end_time: "15:00:00", section: "C", subject: "Club Activities", year: "III" },
  { mentor_id: 4, day_of_week: "SAT", start_time: "15:00:00", end_time: "16:00:00", section: "C", subject: "Club Activities", year: "III" },

  // ==================== IV YEAR SECTION A ====================
  // MON
  { mentor_id: 6, day_of_week: "MON", start_time: "09:00:00", end_time: "10:00:00", section: "A", subject: "PA", year: "IV" },
  { mentor_id: 7, day_of_week: "MON", start_time: "10:00:00", end_time: "11:00:00", section: "A", subject: "WSMA", year: "IV" },
  { mentor_id: 9, day_of_week: "MON", start_time: "11:10:00", end_time: "12:10:00", section: "A", subject: "OE", year: "IV" },
  { mentor_id: 12, day_of_week: "MON", start_time: "12:10:00", end_time: "13:10:00", section: "A", subject: "CC", year: "IV" },
  { mentor_id: 9, day_of_week: "MON", start_time: "14:00:00", end_time: "15:00:00", section: "A", subject: "PS-I", year: "IV" },
  { mentor_id: 9, day_of_week: "MON", start_time: "15:00:00", end_time: "16:00:00", section: "A", subject: "PS-I", year: "IV" },
  // TUE
  { mentor_id: 6, day_of_week: "TUE", start_time: "09:00:00", end_time: "10:00:00", section: "A", subject: "PA Lab", year: "IV" },
  { mentor_id: 6, day_of_week: "TUE", start_time: "10:00:00", end_time: "11:00:00", section: "A", subject: "PA Lab", year: "IV" },
  { mentor_id: 12, day_of_week: "TUE", start_time: "11:10:00", end_time: "12:10:00", section: "A", subject: "CC", year: "IV" },
  { mentor_id: 3, day_of_week: "TUE", start_time: "12:10:00", end_time: "13:10:00", section: "A", subject: "NLP", year: "IV" },
  { mentor_id: 9, day_of_week: "TUE", start_time: "14:00:00", end_time: "15:00:00", section: "A", subject: "Counselling", year: "IV" },
  { mentor_id: 9, day_of_week: "TUE", start_time: "15:00:00", end_time: "16:00:00", section: "A", subject: "PS-I", year: "IV" },
  // WED
  { mentor_id: 6, day_of_week: "WED", start_time: "09:00:00", end_time: "10:00:00", section: "A", subject: "PA", year: "IV" },
  { mentor_id: 7, day_of_week: "WED", start_time: "10:00:00", end_time: "11:00:00", section: "A", subject: "WSMA", year: "IV" },
  { mentor_id: 9, day_of_week: "WED", start_time: "11:10:00", end_time: "12:10:00", section: "A", subject: "OE", year: "IV" },
  { mentor_id: 3, day_of_week: "WED", start_time: "12:10:00", end_time: "13:10:00", section: "A", subject: "NLP", year: "IV" },
  { mentor_id: 12, day_of_week: "WED", start_time: "14:00:00", end_time: "15:00:00", section: "A", subject: "CC", year: "IV" },
  { mentor_id: 9, day_of_week: "WED", start_time: "15:00:00", end_time: "16:00:00", section: "A", subject: "PS-I", year: "IV" },
  // THUR
  { mentor_id: 7, day_of_week: "THUR", start_time: "09:00:00", end_time: "10:00:00", section: "A", subject: "WSMA Lab", year: "IV" },
  { mentor_id: 7, day_of_week: "THUR", start_time: "10:00:00", end_time: "11:00:00", section: "A", subject: "WSMA Lab", year: "IV" },
  { mentor_id: 3, day_of_week: "THUR", start_time: "11:10:00", end_time: "12:10:00", section: "A", subject: "NLP", year: "IV" },
  { mentor_id: 12, day_of_week: "THUR", start_time: "12:10:00", end_time: "13:10:00", section: "A", subject: "CC", year: "IV" },
  { mentor_id: 9, day_of_week: "THUR", start_time: "14:00:00", end_time: "15:00:00", section: "A", subject: "PS-I", year: "IV" },
  { mentor_id: 9, day_of_week: "THUR", start_time: "15:00:00", end_time: "16:00:00", section: "A", subject: "PS-I", year: "IV" },
  // FRI
  { mentor_id: 7, day_of_week: "FRI", start_time: "09:00:00", end_time: "10:00:00", section: "A", subject: "WSMA", year: "IV" },
  { mentor_id: 6, day_of_week: "FRI", start_time: "10:00:00", end_time: "11:00:00", section: "A", subject: "PA", year: "IV" },
  { mentor_id: 3, day_of_week: "FRI", start_time: "11:10:00", end_time: "12:10:00", section: "A", subject: "NLP", year: "IV" },
  { mentor_id: 9, day_of_week: "FRI", start_time: "12:10:00", end_time: "13:10:00", section: "A", subject: "OE", year: "IV" },
  { mentor_id: 9, day_of_week: "FRI", start_time: "14:00:00", end_time: "15:00:00", section: "A", subject: "PS-I", year: "IV" },
  { mentor_id: 9, day_of_week: "FRI", start_time: "15:00:00", end_time: "16:00:00", section: "A", subject: "Sports", year: "IV" },
  // SAT
  { mentor_id: 6, day_of_week: "SAT", start_time: "09:00:00", end_time: "10:00:00", section: "A", subject: "PA", year: "IV" },
  { mentor_id: 7, day_of_week: "SAT", start_time: "10:00:00", end_time: "11:00:00", section: "A", subject: "WSMA", year: "IV" },
  { mentor_id: 9, day_of_week: "SAT", start_time: "11:10:00", end_time: "12:10:00", section: "A", subject: "OE", year: "IV" },
  { mentor_id: 9, day_of_week: "SAT", start_time: "12:10:00", end_time: "13:10:00", section: "A", subject: "Library", year: "IV" },
  { mentor_id: 9, day_of_week: "SAT", start_time: "14:00:00", end_time: "15:00:00", section: "A", subject: "Club Activities", year: "IV" },
  { mentor_id: 9, day_of_week: "SAT", start_time: "15:00:00", end_time: "16:00:00", section: "A", subject: "Club Activities", year: "IV" },

  // ==================== IV YEAR SECTION B ====================
  // MON
  { mentor_id: 6, day_of_week: "MON", start_time: "09:00:00", end_time: "10:00:00", section: "B", subject: "PA", year: "IV" },
  { mentor_id: 7, day_of_week: "MON", start_time: "10:00:00", end_time: "11:00:00", section: "B", subject: "WSMA", year: "IV" },
  { mentor_id: 3, day_of_week: "MON", start_time: "11:10:00", end_time: "12:10:00", section: "B", subject: "NLP", year: "IV" },
  { mentor_id: 10, day_of_week: "MON", start_time: "12:10:00", end_time: "13:10:00", section: "B", subject: "OE", year: "IV" },
  { mentor_id: 10, day_of_week: "MON", start_time: "14:00:00", end_time: "15:00:00", section: "B", subject: "PS-I", year: "IV" },
  { mentor_id: 10, day_of_week: "MON", start_time: "15:00:00", end_time: "16:00:00", section: "B", subject: "PS-I", year: "IV" },
  // TUE
  { mentor_id: 6, day_of_week: "TUE", start_time: "09:00:00", end_time: "10:00:00", section: "B", subject: "PA Lab", year: "IV" },
  { mentor_id: 6, day_of_week: "TUE", start_time: "10:00:00", end_time: "11:00:00", section: "B", subject: "PA Lab", year: "IV" },
  { mentor_id: 10, day_of_week: "TUE", start_time: "11:10:00", end_time: "12:10:00", section: "B", subject: "OE", year: "IV" },
  { mentor_id: 12, day_of_week: "TUE", start_time: "12:10:00", end_time: "13:10:00", section: "B", subject: "CC", year: "IV" },
  { mentor_id: 10, day_of_week: "TUE", start_time: "14:00:00", end_time: "15:00:00", section: "B", subject: "Counselling", year: "IV" },
  { mentor_id: 10, day_of_week: "TUE", start_time: "15:00:00", end_time: "16:00:00", section: "B", subject: "PS-I", year: "IV" },
  // WED
  { mentor_id: 6, day_of_week: "WED", start_time: "09:00:00", end_time: "10:00:00", section: "B", subject: "PA", year: "IV" },
  { mentor_id: 7, day_of_week: "WED", start_time: "10:00:00", end_time: "11:00:00", section: "B", subject: "WSMA", year: "IV" },
  { mentor_id: 12, day_of_week: "WED", start_time: "11:10:00", end_time: "12:10:00", section: "B", subject: "CC", year: "IV" },
  { mentor_id: 10, day_of_week: "WED", start_time: "12:10:00", end_time: "13:10:00", section: "B", subject: "OE", year: "IV" },
  { mentor_id: 3, day_of_week: "WED", start_time: "14:00:00", end_time: "15:00:00", section: "B", subject: "NLP", year: "IV" },
  { mentor_id: 10, day_of_week: "WED", start_time: "15:00:00", end_time: "16:00:00", section: "B", subject: "PS-I", year: "IV" },
  // THUR
  { mentor_id: 7, day_of_week: "THUR", start_time: "09:00:00", end_time: "10:00:00", section: "B", subject: "WSMA Lab", year: "IV" },
  { mentor_id: 7, day_of_week: "THUR", start_time: "10:00:00", end_time: "11:00:00", section: "B", subject: "WSMA Lab", year: "IV" },
  { mentor_id: 12, day_of_week: "THUR", start_time: "11:10:00", end_time: "12:10:00", section: "B", subject: "CC", year: "IV" },
  { mentor_id: 3, day_of_week: "THUR", start_time: "12:10:00", end_time: "13:10:00", section: "B", subject: "NLP", year: "IV" },
  { mentor_id: 10, day_of_week: "THUR", start_time: "14:00:00", end_time: "15:00:00", section: "B", subject: "PS-I", year: "IV" },
  { mentor_id: 10, day_of_week: "THUR", start_time: "15:00:00", end_time: "16:00:00", section: "B", subject: "PS-I", year: "IV" },
  // FRI
  { mentor_id: 7, day_of_week: "FRI", start_time: "09:00:00", end_time: "10:00:00", section: "B", subject: "WSMA", year: "IV" },
  { mentor_id: 6, day_of_week: "FRI", start_time: "10:00:00", end_time: "11:00:00", section: "B", subject: "PA", year: "IV" },
  { mentor_id: 10, day_of_week: "FRI", start_time: "11:10:00", end_time: "12:10:00", section: "B", subject: "OE", year: "IV" },
  { mentor_id: 10, day_of_week: "FRI", start_time: "12:10:00", end_time: "13:10:00", section: "B", subject: "Library", year: "IV" },
  { mentor_id: 12, day_of_week: "FRI", start_time: "14:00:00", end_time: "15:00:00", section: "B", subject: "CC", year: "IV" },
  { mentor_id: 10, day_of_week: "FRI", start_time: "15:00:00", end_time: "16:00:00", section: "B", subject: "Sports", year: "IV" },
  // SAT
  { mentor_id: 6, day_of_week: "SAT", start_time: "09:00:00", end_time: "10:00:00", section: "B", subject: "PA", year: "IV" },
  { mentor_id: 7, day_of_week: "SAT", start_time: "10:00:00", end_time: "11:00:00", section: "B", subject: "WSMA", year: "IV" },
  { mentor_id: 3, day_of_week: "SAT", start_time: "11:10:00", end_time: "12:10:00", section: "B", subject: "NLP", year: "IV" },
  { mentor_id: 10, day_of_week: "SAT", start_time: "12:10:00", end_time: "13:10:00", section: "B", subject: "PS-I", year: "IV" },
  { mentor_id: 10, day_of_week: "SAT", start_time: "14:00:00", end_time: "15:00:00", section: "B", subject: "Club Activities", year: "IV" },
  { mentor_id: 10, day_of_week: "SAT", start_time: "15:00:00", end_time: "16:00:00", section: "B", subject: "Club Activities", year: "IV" }
];

async function update() {
  console.log("Starting schedules database migration for III and IV year sections...");

  // Deleting existing schedules for Year III and IV
  console.log("Deleting existing Year III and IV schedules...");
  const { error: deleteErr, count } = await supabase
    .from("qr_schedules")
    .delete({ count: "exact" })
    .in("year", ["III", "IV"]);

  if (deleteErr) {
    console.error("Delete error:", deleteErr);
    process.exit(1);
  }
  console.log(`Successfully deleted ${count} old schedules.`);

  // Inserting new schedules in blocks to avoid sizing limits
  console.log(`Inserting ${newSchedules.length} new schedules...`);
  const { data: inserted, error: insertErr } = await supabase
    .from("qr_schedules")
    .insert(newSchedules)
    .select();

  if (insertErr) {
    console.error("Insert error:", insertErr);
    process.exit(1);
  }
  console.log(`Successfully inserted ${inserted?.length} new schedules into Supabase!`);
}

update();
