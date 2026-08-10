import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm, mkdir } from "node:fs/promises";

globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(artifactDir, "../..");
const outDir = path.resolve(repoRoot, "api");

async function buildVercel() {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  await esbuild({
    entryPoints: { index: path.resolve(artifactDir, "src/serverless.ts") },
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: outDir,
    outExtension: { ".js": ".js" },
    logLevel: "info",
    external: [
      "*.node",
      "sharp",
      "better-sqlite3",
      "sqlite3",
      "canvas",
      "bcrypt",
      "argon2",
      "fsevents",
      "re2",
      "pg-native",
    ],
    plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
    banner: {
      js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';
globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);`,
    },
  });

  const { writeFile, copyFile, cp } = await import("node:fs/promises");

  // Standalone /api/version Vercel function (not overwritten by esbuild)
  const versionHandler = `export default function handler(_req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.status(200).json({
    latestVersionCode: 4,
    latestVersionName: "1.3.0",
    downloadUrl: "https://qr-attendance-app-eight.vercel.app/FacultyApp.apk",
    forceUpdate: false,
    releaseNotes: "New Update: Complete student name & roll number visibility fix!"
  });
}\n`;
  await writeFile(path.resolve(outDir, "version.js"), versionHandler, "utf8");

  const artifactApiDir = path.resolve(artifactDir, "api");
  await rm(artifactApiDir, { recursive: true, force: true }).catch(() => {});
  await mkdir(artifactApiDir, { recursive: true });

  await cp(outDir, artifactApiDir, { recursive: true });

  console.log("✓ Vercel bundle written to root api/ (includes api/version.js)");
}

buildVercel().catch((err) => {
  console.error(err);
  process.exit(1);
});
