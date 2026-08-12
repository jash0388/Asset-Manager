export default function handler(_req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.status(200).json({
    latestVersionCode: 1,
    latestVersionName: "1.0.0",
    downloadUrl: "https://qr-attendance-app-eight.vercel.app/ParentApp.apk",
    forceUpdate: false,
    releaseNotes: "Official Parent App Release: Live Gate Attendance & Hourly Subject Schedule Tracking!"
  });
}
