// Single source of truth for Grade -> Department and Grade -> assigned Class
// Advisor. Shared by MetaPanel (upload page dropdowns) and SignatureManager
// (Manage Signatures modal) so they can never drift out of sync.

// Normalises any grade input to a canonical key used throughout the app:
//   "6", "G6", "Grade 6"  ->  "6"
//   "ZSA", "zsa"          ->  "ZSA"   (non-numeric section identifier)
export function normGradeNum(g) {
  const s = String(g ?? "").trim();
  if (/^zsa$/i.test(s.replace(/[\s_-]/g, ""))) return "ZSA";
  return s.replace(/[^\d]/g, "").trim();
}

// Departments in display order.
// `prefix` — prepended to each grade value in UI labels and stored keys.
//   "G" -> "G6", "G7" ...   "" -> "ZSA" (kept as-is, no prefix added)
export const GRADE_DEPARTMENTS = [
  { dept: "Primary School", grades: ["1", "2", "3", "4", "5"],     prefix: "G" },
  { dept: "Middle School",  grades: ["6", "7", "8"],                prefix: "G" },
  { dept: "High School",    grades: ["9", "10", "11", "12"],        prefix: "G" },
  { dept: "ZSA",            grades: ["ZSA"],                        prefix: ""  },
];

// Returns the display-key for a grade — e.g. "7" -> "G7", "ZSA" -> "ZSA"
export function gradeDisplayKey(gradeNum) {
  const dept = GRADE_DEPARTMENTS.find(d => d.grades.includes(gradeNum));
  return dept ? `${dept.prefix}${gradeNum}` : gradeNum;
}

export function departmentForGradeNum(n) {
  const found = GRADE_DEPARTMENTS.find(g => g.grades.includes(n));
  return found ? found.dept : "";
}

// Grade key -> currently assigned class advisor.
// Grades not listed here (G1–G5) have no fixed advisor yet.
export const GRADE_ADVISOR_MAP = {
  "6":   "Mrs. Prapti Patole",
  "7":   "Mr. Glen Joshua",
  "8":   "Mrs. Bijily Reacher",
  "9":   "Mrs. Keren Joshua",
  "10":  "Mr. Jayesh Patole",
  "11":  "Mr. Arnold Bagapuro",
  "12":  "Ms. Beverly Abuan",
  "ZSA": "Mrs. May Cho",
};

// Grades that have a fixed advisor (and a slot in Manage Signatures), in order.
export const SIGNED_GRADES = ["6", "7", "8", "9", "10", "11", "12", "ZSA"];

