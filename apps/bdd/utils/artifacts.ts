import fs from "node:fs";
import path from "node:path";

/**
 * Root folders for test artifacts (reports + videos).
 * These are consumed by wdio.conf.ts and the report generator.
 */
export const ARTIFACTS_ROOT = path.resolve(process.cwd(), "test-artifacts");
export const REPORTS_ROOT = path.join(ARTIFACTS_ROOT, "reports");
export const VIDEOS_ROOT = path.join(ARTIFACTS_ROOT, "test-videos");

export const PLATFORM = (process.env.PLATFORM ?? "web").toLowerCase();
export const PLATFORM_REPORTS_ROOT = path.join(REPORTS_ROOT, PLATFORM);
export const PLATFORM_VIDEOS_ROOT = path.join(VIDEOS_ROOT, PLATFORM);

/**
 * The generated cucumber JSON + HTML directories, and the folder INSIDE the
 * published HTML report where per-scenario videos are copied. Keeping the videos
 * under `cucumber-html/` is what makes the embedded `<video src="../videos/…">`
 * links resolve once the report is deployed to GitHub Pages (only `cucumber-html`
 * is published).
 */
export const CUCUMBER_JSON_DIR = path.join(PLATFORM_REPORTS_ROOT, "cucumber");
export const CUCUMBER_HTML_DIR = path.join(
  PLATFORM_REPORTS_ROOT,
  "cucumber-html",
);
export const PUBLISHED_VIDEOS_DIR = path.join(CUCUMBER_HTML_DIR, "videos");

// Feature bucket tracking
export const FEATURE_BUCKET_BY_CID: Record<string, string> = {};

/**
 * Temporary area used by the video reporter for MP4 output and frame cache.
 * The test runner clears this on each run.
 */
export const VIDEOS_TMP = path.join(VIDEOS_ROOT, ".tmp");

/** Create a directory tree if it doesn't exist. */
export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

/** Generate a filesystem-safe slug (lowercase, hyphenated). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Resolve (and ensure) the per-scenario artifact directories.
 * We currently store only screenshots alongside the final MP4.
 */
export function scenarioDirs(
  featureName: string,
  scenarioName: string,
): {
  base: string;
  screenshots: string;
} {
  const base = path.join(
    PLATFORM_VIDEOS_ROOT,
    slugify(featureName),
    slugify(scenarioName),
  );
  const screenshots = path.join(base, "screenshots");

  ensureDir(screenshots);
  return { base, screenshots };
}

/**
 * Canonicalise a string for filename matching: lowercase, collapse every run of
 * non-alphanumeric characters to a single hyphen, and trim leading/trailing
 * hyphens. This lets us compare a scenario name against the mp4 filename that
 * wdio-video-reporter derives from the scenario title (it replaces spaces with
 * hyphens and strips illegal characters), regardless of casing/punctuation.
 */
export function canonical(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Find the mp4 that wdio-video-reporter produced for a given scenario.
 *
 * The reporter names each file `<scenario-title>-<WDIO_WORKER_ID>--<BROWSER>--<timestamp>.mp4`
 * (scenario title only, spaces → hyphens), flat inside VIDEOS_TMP. We therefore
 * match any file whose canonical basename starts with the canonical scenario
 * name. Callers pass scenarios longest-name-first and record consumed files in
 * `used` so a shorter scenario name can't steal a longer scenario's video.
 */
export function matchVideoFile(
  files: string[],
  scenarioName: string,
  used: Set<string>,
): string | null {
  const target = canonical(scenarioName);
  if (!target) return null;

  const candidates = files.filter(f => {
    if (used.has(f)) return false;
    const base = canonical(f.replace(/\.mp4$/i, ""));
    return base === target || base.startsWith(`${target}-`);
  });
  if (candidates.length === 0) return null;

  // Prefer the most recently written file.
  candidates.sort(
    (a, b) =>
      fs.statSync(path.join(VIDEOS_TMP, b)).mtimeMs -
      fs.statSync(path.join(VIDEOS_TMP, a)).mtimeMs,
  );
  return candidates[0];
}

/**
 * Associate recorded videos with their scenarios in the cucumber report.
 *
 * Runs once from the launcher `onComplete` hook — by which point every worker's
 * ffmpeg render has finished (WDIO waits on the video reporter's isSynchronised
 * gate) and every per-feature cucumber JSON has been written. For each scenario
 * we:
 *   1. locate its mp4 in VIDEOS_TMP (matched by scenario name),
 *   2. copy it INTO the published report at
 *      `cucumber-html/videos/<feature>/<scenario>/run.mp4`, and
 *   3. append a `text/html` embedding to the scenario's last step whose base64
 *      payload is a `<video>` pointing at that file (relative to the per-feature
 *      page the reporter renders under `cucumber-html/features/`).
 *
 * multiple-cucumber-html-reporter base64-decodes text/html embeddings and injects
 * them verbatim, so the `<video>` renders as a real, playable player. Regenerating
 * the report afterwards does not delete the `videos/` folder.
 *
 * Returns the number of videos associated.
 */
export function associateVideos(): number {
  if (!fs.existsSync(CUCUMBER_JSON_DIR)) return 0;

  const videoFiles = fs.existsSync(VIDEOS_TMP)
    ? fs.readdirSync(VIDEOS_TMP).filter(f => f.toLowerCase().endsWith(".mp4"))
    : [];
  if (videoFiles.length === 0) return 0;

  const used = new Set<string>();
  let associated = 0;

  const jsonFiles = fs
    .readdirSync(CUCUMBER_JSON_DIR)
    .filter(f => f.toLowerCase().endsWith(".json"));

  for (const jsonFile of jsonFiles) {
    const jsonPath = path.join(CUCUMBER_JSON_DIR, jsonFile);
    let data: any;
    try {
      data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    } catch {
      continue;
    }

    const features = Array.isArray(data) ? data : [data];
    let mutated = false;

    for (const feature of features) {
      const featureSlug = slugify(feature?.name ?? "feature");
      const scenarios = (feature?.elements ?? []).filter(
        (el: any) => el?.type !== "background" && Array.isArray(el?.steps),
      );

      // Longest scenario name first so a name that is a prefix of another
      // scenario can't claim the wrong video.
      const ordered = [...scenarios].sort(
        (a: any, b: any) => (b?.name?.length ?? 0) - (a?.name?.length ?? 0),
      );

      for (const scenario of ordered) {
        const name: string | undefined = scenario?.name;
        const steps: any[] = scenario?.steps ?? [];
        if (!name || steps.length === 0) continue;

        const file = matchVideoFile(videoFiles, name, used);
        if (!file) continue;
        used.add(file);

        const scenarioSlug = slugify(name);
        const destDir = path.join(
          PUBLISHED_VIDEOS_DIR,
          featureSlug,
          scenarioSlug,
        );
        ensureDir(destDir);
        const dest = path.join(destDir, "run.mp4");
        try {
          fs.copyFileSync(path.join(VIDEOS_TMP, file), dest);
        } catch {
          continue;
        }

        // Path is relative to the per-feature HTML page under cucumber-html/features/.
        const relSrc = [
          "..",
          "videos",
          featureSlug,
          scenarioSlug,
          "run.mp4",
        ].join("/");
        const html =
          `<div class="bdd-scenario-video" style="margin-top:8px">` +
          `<video controls preload="metadata" style="max-width:100%;width:880px" ` +
          `src="${relSrc}"></video></div>`;
        const embedding = {
          data: Buffer.from(html, "utf8").toString("base64"),
          mime_type: "text/html",
        };

        const lastStep = steps[steps.length - 1];
        if (!Array.isArray(lastStep.embeddings)) lastStep.embeddings = [];
        lastStep.embeddings.push(embedding);
        mutated = true;
        associated += 1;
      }
    }

    if (mutated) {
      try {
        fs.writeFileSync(jsonPath, JSON.stringify(data));
      } catch {
        /* leave the on-disk JSON untouched if the write fails */
      }
    }
  }

  return associated;
}
