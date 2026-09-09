/**
 * Section normalization utility to map various section formats into the exact
 * canonical database format used in qr_users and qr_schedules:
 *
 *   "DS II/I/A",  "DS II/I/B",  "DS II/I/C"
 *   "DS III/I/A", "DS III/I/B", "DS III/I/C"
 *   "DS IV/I/A",  "DS IV/I/B"
 */

export function normalizeSection(
  section?: string | null,
  year?: string | null,
  secLetter?: string | null
): string {
  // If year and secLetter are provided (e.g. from qr_schedules row)
  if (year && secLetter) {
    const yStr = String(year).trim().toUpperCase();
    const sStr = String(secLetter).trim().toUpperCase();
    const digitToRoman: Record<string, string> = { "2": "II", "3": "III", "4": "IV" };
    const yRoman = digitToRoman[yStr] || yStr;
    return `DS ${yRoman}/I/${sStr}`;
  }

  if (!section) return "";
  const s = String(section).trim();

  // If already in exact DB format: "DS II/I/B", "DS III/I/A", etc.
  if (/^DS\s+(?:IV|III|II)\/I\/[A-C]$/i.test(s)) {
    return s.toUpperCase().replace(/\s+/, " ");
  }

  const upper = s.toUpperCase().replace(/\s+/g, "");

  let parsedYear = "";
  let parsedSec = "";

  // Check digit patterns: "DS-2B", "DS 2B", "DS2B", "2B", "2-B", "DS-2-B"
  const digitMatch = upper.match(/(?:DS[-_ ]?)?([234])[-_ ]?([ABC])/i);
  if (digitMatch) {
    const digitMap: Record<string, string> = { "2": "II", "3": "III", "4": "IV" };
    parsedYear = digitMap[digitMatch[1]];
    parsedSec = digitMatch[2].toUpperCase();
  } else {
    // Check roman numeral patterns: "DS-IV-A", "DS-III-B", "DS-II-B", "IV-A", "III-B", "II-B"
    // Order matters: match IV first, then III, then II
    const romanMatch = upper.match(/(?:DS[-_ ]?)?(IV|III|II)[-_ /I]*([ABC])/i);
    if (romanMatch) {
      parsedYear = romanMatch[1].toUpperCase();
      parsedSec = romanMatch[2].toUpperCase();
    }
  }

  if (parsedYear && parsedSec) {
    return `DS ${parsedYear}/I/${parsedSec}`;
  }

  return s;
}
