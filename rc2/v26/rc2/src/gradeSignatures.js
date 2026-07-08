// Auto-discovers the preloaded signature images bundled under
// src/assets/signatures/. Files are matched to a key by their filename:
//   G6.png, G7.png, ... -> gradeSignatureMap["6"], ["7"], ...
//   principal.png       -> gradeSignatureMap["principal"]
// Drop a new image following these naming conventions and it's picked up
// automatically on the next build — no code changes needed.
const files = import.meta.glob("./assets/signatures/*.{png,jpg,jpeg,webp}", { eager: true, import: "default" });

function extractKey(path) {
  const filename = path.split("/").pop().replace(/\.[^.]+$/, "");
  if (/^principal$/i.test(filename)) return "principal";
  const m = filename.match(/^(?:grade|g)?[\s_-]*(\d{1,2})\b/i);
  return m ? m[1] : null;
}

export const gradeSignatureMap = (() => {
  const map = {};
  for (const [path, url] of Object.entries(files)) {
    const key = extractKey(path);
    if (key) map[key] = url;
  }
  return map;
})();

