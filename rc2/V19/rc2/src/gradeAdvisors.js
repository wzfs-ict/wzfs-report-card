// Single source of truth for Grade -> Department and Grade -> assigned Class
// Advisor. Shared by MetaPanel (upload page dropdowns) and SignatureManager
// (Manage Signatures modal) so they can never drift out of sync.

export function normGradeNum(g) {
  return String(g ?? "").replace(/[^\d]/g, "").trim();
}

export const GRADE_DEPARTMENTS = [
  { dept: "Primary School", grades: ["1", "2", "3", "4", "5"] },
  { dept: "Middle School", grades: ["6", "7", "8"] },
  { dept: "High School", grades: ["9", "10", "11", "12"] },
];

export function departmentForGradeNum(n) {
  const found = GRADE_DEPARTMENTS.find(g => g.grades.includes(n));
  return found ? found.dept : "";
}

// Grade number -> currently assigned class advisor. Grades not listed here
// (G1-G5) have no fixed advisor yet, so they fall back to free-text entry
// wherever this map is used.
export const GRADE_ADVISOR_MAP = {
  "6": "Mrs. Prapti Patole",
  "7": "Mr. Glen Joshua",
  "8": "Mrs. Bijily Reacher",
  "9": "Mrs. Keren Joshua",
  "10": "Mr. Jayesh Patole",
  "11": "Mr. Arnold Bagapuro",
  "12": "Ms. Beverly Abuan",
};

// Grades that currently have a fixed advisor (and therefore a signature
// slot in the Manage Signatures modal), in display order.
export const SIGNED_GRADES = ["6", "7", "8", "9", "10", "11", "12"];
