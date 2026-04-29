import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { rm, mkdir } from "node:fs/promises";

globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(artifactDir, "..", "..");
const outFile = path.resolve(repoRoot, "api", "index.mjs");

async function buildServerless() {
  await rm(path.dirname(outFile), { recursive: true, force: true });
  await mkdir(path.dirname(outFile), { recursive: true });

  await esbuild({
    entryPoints: [path.resolve(artifactDir, "src/serverless.ts")],
    platform: "node",
    target: "node20",
    bundle: true,
    format: "esm",
    outfile: outFile,
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
      "pg-native",
      "pino-pretty",
      "thread-stream",
    ],
    sourcemap: false,
    banner: {
      js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
      `,
    },
  });

  console.log(`Vercel serverless bundle written to: ${outFile}`);
}

buildServerless().catch((err) => {
  console.error(err);
  process.exit(1);
});
