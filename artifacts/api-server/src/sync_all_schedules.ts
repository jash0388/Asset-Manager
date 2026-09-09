import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Define standard period slots
const PERIOD_SLOTS: { start: string; end: string }[] = [
  { start: "09:00:00", end: "10:00:00" }, // P1: 09:00 - 10:00
  { start: "10:00:00", end: "11:00:00" }, // P2: 10:00 - 11:00
  { start: "11:10:00", end: "12:10:00" }, // P3: 11:10 - 12:10
  { start: "12:10:00", end: "13:10:00" }, // P4: 12:10 - 13:10
  { start: "14:00:00", end: "15:00:00" }, // P5: 14:00 - 15:00
  { start: "15:00:00", end: "16:00:00" }, // P6: 15:00 - 16:00
];

// Exact timetable definition by section & day (from DEPARTMENT_EXACT_TIMETABLE in HodDashboard.tsx)
const EXACT_TIMETABLES: Record<string, { year: "II" | "III" | "IV"; section: "A" | "B" | "C"; schedule: Record<string, string[]> }> = {
  "2A": {
    year: "II",
    section: "A",
    schedule: {
      "MON": ["JAVA/DBMS LAB", "JAVA/DBMS LAB", "MSF", "JAVA", "SE", "COA"],
      "TUE": ["SE/JAVA LAB", "SE/JAVA LAB", "MSF", "COA", "DBMS", "SE"],
      "WED": ["DBMS/SE LAB", "DBMS/SE LAB", "MSF", "JAVA", "DBMS", "SPORTS/LIBRARY"],
      "THUR": ["SDC", "SDC", "JAVA", "DBMS", "SE", "COUNSELLING"],
      "FRI": ["DBMS", "COA", "JAVA", "SE", "APTITUDE", "APTITUDE"],
      "SAT": ["CM LAB", "CM LAB", "COA", "MSF", "CLUB ACTIVITIES", "CLUB ACTIVITIES"],
    }
  },
  "2B": {
    year: "II",
    section: "B",
    schedule: {
      "MON": ["MSF", "SE", "SE/JAVA LAB", "SE/JAVA LAB", "COA", "DBMS"],
      "TUE": ["CM LAB", "CM LAB", "JAVA/DBMS LAB", "JAVA/DBMS LAB", "SE", "DBMS"],
      "WED": ["COA", "JAVA", "SDC", "SDC", "MSF", "DBMS"],
      "THUR": ["DBMS", "JAVA", "COA", "SE", "MSF", "COUNSELLING"],
      "FRI": ["JAVA", "MSF", "DBMS", "COA", "SE", "JAVA"],
      "SAT": ["APTITUDE", "APTITUDE", "DBMS/SE LAB", "DBMS/SE LAB", "CLUB ACTIVITIES", "CLUB ACTIVITIES"],
    }
  },
  "2C": {
    year: "II",
    section: "C",
    schedule: {
      "MON": ["DBMS", "COA", "SDC", "SDC", "SE", "JAVA"],
      "TUE": ["JAVA", "MSF", "SE", "COUNSELLING", "COA", "DBMS"],
      "WED": ["CM LAB", "CM LAB", "JAVA/SE LAB", "JAVA/SE LAB", "JAVA", "COA"],
      "THUR": ["JAVA", "COA", "SE/DBMS LAB", "SE/DBMS LAB", "SE", "MSF"],
      "FRI": ["MSF", "DBMS", "DBMS/JAVA LAB", "DBMS/JAVA LAB", "SE", "SPORTS/LIBRARY"],
      "SAT": ["MSF", "DBMS", "APTITUDE", "APTITUDE", "CLUB ACTIVITIES", "CLUB ACTIVITIES"],
    }
  },
  "3A": {
    year: "III",
    section: "A",
    schedule: {
      "MON": ["KAFKA", "KAFKA", "ADA", "IDS", "CN/R PROGRAMMING LAB", "CN/R PROGRAMMING LAB"],
      "TUE": ["CN", "ADA", "DEVOPS", "COUNSELLING", "R PROGRAMMING/CN LAB", "R PROGRAMMING/CN LAB"],
      "WED": ["ARQA", "WP", "CN", "ADA", "DEVOPS", "SPORTS"],
      "THUR": ["IDS", "CN", "DEVOPS", "LIBRARY", "ADA", "WP"],
      "FRI": ["DEVOPS", "WP", "IDS", "CN", "AECS LAB", "AECS LAB"],
      "SAT": ["WP", "IDS", "IPR", "IPR", "CLUB ACTIVITIES", "CLUB ACTIVITIES"],
    }
  },
  "3B": {
    year: "III",
    section: "B",
    schedule: {
      "MON": ["CN", "DEVOPS", "WP", "COUNSELLING", "ADA", "SPORTS"],
      "TUE": ["WP", "IDS", "CN", "LIBRARY", "DEVOPS", "ADA"],
      "WED": ["IDS", "ARQA", "WP", "DEVOPS", "CN/R PROGRAMMING LAB", "CN/R PROGRAMMING LAB"],
      "THUR": ["ADA", "WP", "CN", "IDS", "R PROGRAMMING /CN LAB", "R PROGRAMMING /CN LAB"],
      "FRI": ["KAFKA", "KAFKA", "CN", "ADA", "IDS", "DEVOPS"],
      "SAT": ["AECS LAB", "AECS LAB", "IPR", "IPR", "CLUB ACTIVITIES", "CLUB ACTIVITIES"],
    }
  },
  "3C": {
    year: "III",
    section: "C",
    schedule: {
      "MON": ["CN", "IDS", "DEVOPS", "LIBRARY", "WP", "ADA"],
      "TUE": ["DEVOPS", "CN", "WP", "ADA", "IDS", "SPORTS"],
      "WED": ["ADA", "DEVOPS", "ARQA", "IDS", "WP", "CN"],
      "THUR": ["CN/R PROGRAMMING LAB", "CN/R PROGRAMMING LAB", "AECS LAB", "AECS LAB", "DEVOPS", "WP"],
      "FRI": ["R PROGRAMMING/CN LAB", "R PROGRAMMING/CN LAB", "COUNSELLING", "IDS", "CN", "ADA"],
      "SAT": ["KAFKA", "KAFKA", "IPR", "IPR", "CLUB ACTIVITIES", "CLUB ACTIVITIES"],
    }
  },
  "4A": {
    year: "IV",
    section: "A",
    schedule: {
      "MON": ["PA", "WSMA", "OE", "CC", "PS-I", "PS-I"],
      "TUE": ["PA Lab", "PA Lab", "CC", "NLP", "PS-I", "SPORTS"],
      "WED": ["PA", "WSMA", "OE", "NLP", "CC", "PS-I"],
      "THUR": ["WSMA Lab", "WSMA Lab", "NLP", "CC", "PS-I", "PS-I"],
      "FRI": ["WSMA", "PA", "NLP", "OE", "PS-I", "COUNSELLING"],
      "SAT": ["PA", "WSMA", "OE", "LIBRARY", "CLUB ACTIVITIES", "CLUB ACTIVITIES"],
    }
  },
  "4B": {
    year: "IV",
    section: "B",
    schedule: {
      "MON": ["PA", "WSMA", "NLP", "OE", "PS-I", "PS-I"],
      "TUE": ["PA LAB", "PA LAB", "OE", "CC", "PS-I", "SPORTS"],
      "WED": ["PA", "WSMA", "CC", "OE", "NLP", "PS-I"],
      "THUR": ["WSMA LAB", "WSMA LAB", "CC", "NLP", "PS-I", "PS-I"],
      "FRI": ["WSMA", "PA", "OE", "LIBRARY", "CC", "COUNSELLING"],
      "SAT": ["PA", "WSMA", "NLP", "PS-I", "CLUB ACTIVITIES", "CLUB ACTIVITIES"],
    }
  }
};

// Exact Section Faculty Allocation Map (from SECTION_FACULTY_ALLOCATION_MATRIX in HodDashboard.tsx)
const EXACT_FACULTY_MAP: Record<string, Record<string, number>> = {
  "2A": {
    "MSF": 18,            // Mr. Rakesh Goud
    "COA": 1,             // Mrs. CH. Naga Rohini
    "JAVA": 16,           // Dr. A. Balaram
    "JAVA/DBMS LAB": 16,  // Dr. A. Balaram
    "SE/JAVA LAB": 16,    // Dr. A. Balaram
    "DBMS/SE LAB": 13,    // Mrs. Ch. Vijaya Lakshmi
    "JAVA/SE LAB": 16,    // Dr. A. Balaram
    "DBMS/JAVA LAB": 13,  // Mrs. Ch. Vijaya Lakshmi
    "DBMS": 13,           // Mrs. Ch. Vijaya Lakshmi
    "SE": 5,              // Mr. M. Srinivasulu
    "CM LAB": 19,         // Dr. Sri Hari VLN
    "SDC": 14,            // Mrs. K. Srinija
    "APTITUDE": 7,        // Mr. K. Bikshapathi
    "COUNSELLING": 11,    // Mrs. B. Gayathri
    "SPORTS/LIBRARY": 11, // Mrs. B. Gayathri
    "LIBRARY": 11,        // Mrs. B. Gayathri
    "SPORTS": 11,         // Mrs. B. Gayathri
    "CLUB ACTIVITIES": 11,// Mrs. B. Gayathri
  },
  "2B": {
    "MSF": 18,            // Mr. Rakesh Goud
    "COA": 1,             // Mrs. CH. Naga Rohini
    "JAVA": 4,            // Mr. M. Yadaiah
    "JAVA/DBMS LAB": 4,   // Mr. M. Yadaiah
    "SE/JAVA LAB": 5,     // Mr. M. Srinivasulu
    "DBMS/SE LAB": 13,    // Mrs. Ch. Vijaya Lakshmi
    "JAVA/SE LAB": 4,     // Mr. M. Yadaiah
    "DBMS/JAVA LAB": 13,  // Mrs. Ch. Vijaya Lakshmi
    "DBMS": 13,           // Mrs. Ch. Vijaya Lakshmi
    "SE": 5,              // Mr. M. Srinivasulu
    "CM LAB": 19,         // Dr. Sri Hari VLN
    "SDC": 14,            // Mrs. K. Srinija
    "APTITUDE": 12,       // Mrs. K. Ramya
    "COUNSELLING": 12,    // Mrs. K. Ramya
    "SPORTS/LIBRARY": 12, // Mrs. K. Ramya
    "LIBRARY": 12,        // Mrs. K. Ramya
    "SPORTS": 12,         // Mrs. K. Ramya
    "CLUB ACTIVITIES": 12,// Mrs. K. Ramya
  },
  "2C": {
    "MSF": 18,            // Mr. Rakesh Goud
    "COA": 1,             // Mrs. CH. Naga Rohini
    "JAVA": 4,            // Mr. M. Yadaiah
    "JAVA/SE LAB": 4,     // Mr. M. Yadaiah
    "SE/DBMS LAB": 7,     // Mr. K. Bikshapathi
    "DBMS/JAVA LAB": 8,   // Mrs. G. Sushma
    "DBMS/SE LAB": 8,     // Mrs. G. Sushma
    "SE/JAVA LAB": 7,     // Mr. K. Bikshapathi
    "DBMS": 8,            // Mrs. G. Sushma
    "SE": 7,              // Mr. K. Bikshapathi
    "CM LAB": 19,         // Dr. Sri Hari VLN
    "SDC": 14,            // Mrs. K. Srinija
    "APTITUDE": 7,        // Mr. K. Bikshapathi
    "COUNSELLING": 7,     // Mr. K. Bikshapathi
    "SPORTS/LIBRARY": 7,  // Mr. K. Bikshapathi
    "LIBRARY": 7,         // Mr. K. Bikshapathi
    "SPORTS": 7,          // Mr. K. Bikshapathi
    "CLUB ACTIVITIES": 7, // Mr. K. Bikshapathi
  },
  "3A": {
    "CN": 10,             // Mrs. K. Sneha
    "CN/R PROGRAMMING LAB": 10, // Mrs. K. Sneha
    "R PROGRAMMING/CN LAB": 6,  // Mr. T. Shravan Kumar
    "ADA": 17,            // Dr. Md Abdul Azeem
    "WP": 8,              // Mrs. G. Sushma
    "DEVOPS": 3,          // Mr. Miskeen Ali
    "IDS": 6,             // Mr. T. Shravan Kumar
    "KAFKA": 12,          // Mrs. K. Ramya
    "ARQA": 4,            // Mr. M. Yadaiah
    "AECS LAB": 21,       // Ms. Vaidehi
    "IPR": 20,            // Mr. Prateek
    "LIBRARY": 8,         // Mrs. G. Sushma
    "COUNSELLING": 8,     // Mrs. G. Sushma
    "SPORTS": 8,          // Mrs. G. Sushma
    "CLUB ACTIVITIES": 8, // Mrs. G. Sushma
  },
  "3B": {
    "CN": 10,             // Mrs. K. Sneha
    "CN LAB": 10,         // Mrs. K. Sneha
    "WP": 8,              // Mrs. G. Sushma
    "IDS": 9,             // Mrs. A. Sravanthi
    "ADA": 17,            // Dr. Md Abdul Azeem
    "DEVOPS": 3,          // Mr. Mohammed Miskeen Ali
    "KAFKA": 12,          // Mrs. K. Ramya
    "CN/R PROGRAMMING LAB": 10, // Mrs. K. Sneha
    "R PROGRAMMING/CN LAB": 9,  // Mrs. A. Sravanthi
    "R PROGRAMMING /CN LAB": 9, // Mrs. A. Sravanthi
    "R PROGRAMMING LAB": 9,     // Mrs. A. Sravanthi
    "AECS LAB": 21,       // Ms. Vaidehi
    "IPR": 20,            // Mr. Prateek
    "ARQA": 6,            // Mr. T. Shravan Kumar
    "COUNSELLING": 6,     // Mr. T. Shravan Kumar
    "SPORTS": 6,          // Mr. T. Shravan Kumar
    "LIBRARY": 6,         // Mr. T. Shravan Kumar
    "CLUB ACTIVITIES": 6, // Mr. T. Shravan Kumar
  },
  "3C": {
    "CN": 11,             // Mrs. B. Gayathri
    "CN LAB": 11,         // Mrs. B. Gayathri
    "CN/R PROGRAMMING LAB": 11, // Mrs. B. Gayathri
    "R PROGRAMMING/CN LAB": 9,  // Mrs. A. Sravanthi
    "ADA": 17,            // Dr. Md Abdul Azeem
    "WP": 14,             // Mrs. K. Srinija
    "IDS": 9,             // Mrs. A. Sravanthi
    "DEVOPS": 3,          // Mr. Miskeen Ali
    "KAFKA": 12,          // Mrs. K. Ramya
    "ARQA": 5,            // Mr. M. Srinivasulu
    "AECS LAB": 21,       // Ms. Vaidehi
    "IPR": 20,            // Mr. Prateek
    "LIBRARY": 4,         // Mr. M. Yadaiah
    "SPORTS": 4,          // Mr. M. Yadaiah
    "COUNSELLING": 4,     // Mr. M. Yadaiah
    "CLUB ACTIVITIES": 4, // Mr. M. Yadaiah
  },
  "4A": {
    "PA": 6,              // Mr. T. Shravan Kumar
    "PA LAB": 6,          // Mr. T. Shravan Kumar
    "PA Lab": 6,          // Mr. T. Shravan Kumar
    "WSMA": 7,            // Mr. K. Bikshapathi
    "WSMA LAB": 7,        // Mr. K. Bikshapathi
    "WSMA Lab": 7,        // Mr. K. Bikshapathi
    "NLP": 11,            // Mrs. B. Gayathri
    "CC": 12,             // Mrs. K. Ramya
    "OE": 22,             // Dr. C. Lakshmi Nath
    "PS-I": 3,            // Mr. Miskeen Ali
    "SPORTS": 9,          // Mrs. A. Sravanthi
    "LIBRARY": 9,         // Mrs. A. Sravanthi
    "COUNSELLING": 9,     // Mrs. A. Sravanthi
    "CLUB ACTIVITIES": 9, // Mrs. A. Sravanthi
  },
  "4B": {
    "PA": 6,              // Mr. T. Shravan Kumar
    "PA LAB": 6,          // Mr. T. Shravan Kumar
    "PA Lab": 6,          // Mr. T. Shravan Kumar
    "WSMA": 7,            // Mr. K. Bikshapathi
    "WSMA LAB": 7,        // Mr. K. Bikshapathi
    "WSMA Lab": 7,        // Mr. K. Bikshapathi
    "NLP": 11,            // Mrs. B. Gayathri
    "CC": 12,             // Mrs. K. Ramya
    "OE": 22,             // Dr. C. Lakshmi Nath
    "PS-I": 17,           // Dr. Md Abdul Azeem
    "SPORTS": 10,         // Mrs. K. Sneha
    "LIBRARY": 10,        // Mrs. K. Sneha
    "COUNSELLING": 10,    // Mrs. K. Sneha
    "CLUB ACTIVITIES": 10,// Mrs. K. Sneha
  }
};

async function executeSync() {
  console.log("=== FULL SYSTEM TIMETABLE & FACULTY SYNC ===");

  const { data: existingSchedules, error: fetchErr } = await supabase
    .from("qr_schedules")
    .select("*");

  if (fetchErr) {
    console.error("Error fetching schedules:", fetchErr);
    process.exit(1);
  }

  const DAYS = ["MON", "TUE", "WED", "THUR", "FRI", "SAT"];
  let updatedCount = 0;
  let insertedCount = 0;
  const validScheduleIds = new Set<number>();

  for (const [secKey, secDef] of Object.entries(EXACT_TIMETABLES)) {
    const { year, section, schedule } = secDef;
    const facultyMap = EXACT_FACULTY_MAP[secKey] || {};

    for (const day of DAYS) {
      const daySubjects = schedule[day] || [];

      let pIdx = 0;
      while (pIdx < daySubjects.length && pIdx < PERIOD_SLOTS.length) {
        const subj = daySubjects[pIdx];
        if (!subj || subj.toLowerCase() === "free") {
          pIdx++;
          continue;
        }

        // Check if next period is identical for a 2-hour lab/club block
        const isBlock = (pIdx + 1 < daySubjects.length) && (daySubjects[pIdx + 1] === subj) && (pIdx === 0 || pIdx === 4);
        const startTime = PERIOD_SLOTS[pIdx].start;
        const endTime = isBlock ? PERIOD_SLOTS[pIdx + 1].end : PERIOD_SLOTS[pIdx].end;

        const mentorId = facultyMap[subj] || facultyMap[subj.toUpperCase()] || 11;

        const match = (existingSchedules || []).find((s: any) =>
          s.year === year &&
          s.section === section &&
          s.day_of_week === day &&
          s.start_time.slice(0, 5) === startTime.slice(0, 5)
        );

        if (match) {
          validScheduleIds.add(match.id);
          if (match.mentor_id !== mentorId || match.subject !== subj || match.end_time.slice(0, 5) !== endTime.slice(0, 5)) {
            const { error: updErr } = await supabase
              .from("qr_schedules")
              .update({
                mentor_id: mentorId,
                subject: subj,
                end_time: endTime
              })
              .eq("id", match.id);

            if (updErr) {
              console.error(`Failed to update [${year}-${section}] ${day} ${startTime}:`, updErr);
            } else {
              updatedCount++;
              console.log(`Updated [${year}-${section}] ${day} ${startTime.slice(0,5)}-${endTime.slice(0,5)} -> ${subj} (mentor: ${mentorId})`);
            }
          }
        } else {
          const { data: insData, error: insErr } = await supabase
            .from("qr_schedules")
            .insert({
              mentor_id: mentorId,
              day_of_week: day,
              start_time: startTime,
              end_time: endTime,
              section: section,
              subject: subj,
              year: year
            })
            .select("id")
            .single();

          if (insErr) {
            console.error(`Failed to insert [${year}-${section}] ${day} ${startTime}:`, insErr);
          } else {
            if (insData?.id) validScheduleIds.add(insData.id);
            insertedCount++;
            console.log(`Inserted [${year}-${section}] ${day} ${startTime.slice(0,5)}-${endTime.slice(0,5)} -> ${subj} (mentor: ${mentorId})`);
          }
        }

        pIdx += isBlock ? 2 : 1;
      }
    }
  }

  // Check for obsolete schedules in qr_schedules
  let deletedCount = 0;
  for (const s of existingSchedules || []) {
    if (!validScheduleIds.has(s.id)) {
      // Check if it has any attendance or session records
      const { count: hourlyCount } = await supabase
        .from("qr_hourly_attendance")
        .select("id", { count: "exact", head: true })
        .eq("schedule_id", s.id);

      const { count: sessionCount } = await supabase
        .from("qr_mentor_sessions")
        .select("id", { count: "exact", head: true })
        .eq("schedule_id", s.id);

      if ((hourlyCount || 0) === 0 && (sessionCount || 0) === 0) {
        const { error: delErr } = await supabase
          .from("qr_schedules")
          .delete()
          .eq("id", s.id);

        if (delErr) {
          console.error(`Failed to delete orphan schedule ${s.id} [${s.year}-${s.section} ${s.day_of_week} ${s.start_time}]:`, delErr);
        } else {
          deletedCount++;
          console.log(`Deleted orphan schedule ${s.id} [${s.year}-${s.section} ${s.day_of_week} ${s.start_time}]: ${s.subject}`);
        }
      } else {
        console.warn(`Preserving schedule ${s.id} with historical records: hourly=${hourlyCount}, sessions=${sessionCount}`);
      }
    }
  }

  console.log(`\n=== Master Sync Completed: ${updatedCount} updated, ${insertedCount} inserted, ${deletedCount} deleted ===`);
}

executeSync();
