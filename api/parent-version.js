export default function handler(_req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.status(200).json({
    latestVersionCode: 2,
    latestVersionName: "1.1.0",
    downloadUrl: "https://raw.githubusercontent.com/jash0388/Asset-Manager/main/artifacts/qr-attendance/public/ParentApp.apk",
    forceUpdate: false,
    releaseNotes: "New Parent App Release v1.1.0: Mobile UI layout polish, auto-uppercase input, and direct APK installer update!"
  });
}
