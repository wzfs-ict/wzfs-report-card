// Auto-discovers the preloaded signature images bundled under
// src/assets/signatures/. Files are matched to a key by their filename:
//   G6.png, G7.png, ... -> gradeSignatureMap["6"], ["7"], ...
//   principal.png       -> gradeSignatureMap["principal"]
//   Karen-Bayangan.png  -> the advisor named "Ms. Karen Bayangan", whatever grade she advises
// Drop a new image following these naming conventions and it's picked up
// automatically on the next build — no code changes needed. New signatures should be
// named after the person (titles like Mrs./Mr. are ignored when matching).
const files = import.meta.glob("./assets/signatures/*.{png,jpg,jpeg,webp}", { eager: true, import: "default" });

function extractKey(path) {
  const filename = path.split("/").pop().replace(/\.[^.]+$/, "");
  if (/^principal$/i.test(filename)) return "principal";
  if (/^zsa$/i.test(filename)) return "ZSA";
  const m = filename.match(/^(?:grade|g)?[\s_-]*(\d{1,2})\b/i);
  if (m) return m[1];
  const person = personKey(filename);
  return person ? "person:" + person : null;
}

// Who actually signed each bundled image (the Spring 2026 advisors). Advisors change grade from
// year to year, so a signature is chosen by the ADVISOR'S NAME, never by grade: a grade whose new
// advisor has no image gets an empty signature line instead of somebody else's signature.
const SIGNATURE_OWNERS = {
  "6": "Mrs. Prapti Patole", "7": "Mr. Glen Joshua", "8": "Mrs. Bijily Reacher", "9": "Mrs. Keren Joshua",
  "10": "Mr. Jayesh Patole", "11": "Mr. Arnold Bagapuro", "12": "Ms. Beverly Abuan", "ZSA": "Mrs. May Cho",
};
export const personKey = (name) => String(name || "").toLowerCase().replace(/\b(mr|mrs|ms|miss|dr)\b\.?/g, "").replace(/[^a-z]/g, "");
export function signatureByAdvisor(name) {
  const k = personKey(name);
  if (!k) return null;
  if (gradeSignatureMap["person:" + k]) return gradeSignatureMap["person:" + k];
  for (const [file, owner] of Object.entries(SIGNATURE_OWNERS)) if (personKey(owner) === k && gradeSignatureMap[file]) return gradeSignatureMap[file];
  return null;
}

export const gradeSignatureMap = (() => {
  const map = {};
  for (const [path, url] of Object.entries(files)) {
    const key = extractKey(path);
    if (key) map[key] = url;
  }
  return map;
})();

