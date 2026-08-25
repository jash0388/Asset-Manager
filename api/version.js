export default function handler(_req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.status(200).json({
    latestVersionCode: 8,
    latestVersionName: "1.8.0",
    downloadUrl: "https://qr-attendance-app-eight.vercel.app/FacultyApp.apk",
    forceUpdate: false,
    releaseNotes: "v1.8.0: Overhauled Attendance History, Timetable Snapshots, Student Search, and CSV Export!"
  });
}
