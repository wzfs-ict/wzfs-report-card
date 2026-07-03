// Auto-discovers the preloaded signature images bundled under
// src/assets/signatures/. Each file is matched to a grade number by a
// leading "G7", "Grade 7", "grade7", "7", etc. pattern in its filename —
// drop a new image in following that convention and it's picked up
// automatically on the next build, no code changes needed.
const files = import.meta.glob("./assets/signatures/*.{png,jpg,jpeg,webp}", { eager: true, import: "default" });

function extractGradeNum(path) {
  const filename = path.split("/").pop().replace(/\.[^.]+$/, "");
  const m = filename.match(/^(?:grade|g)?[\s_-]*(\d{1,2})\b/i);
  return m ? m[1] : null;
}

export const gradeSignatureMap = (() => {
  const map = {};
  for (const [path, url] of Object.entries(files)) {
    const gradeNum = extractGradeNum(path);
    if (gradeNum) map[gradeNum] = url;
  }
  return map;
})();
