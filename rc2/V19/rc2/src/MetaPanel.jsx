import { useState, useEffect } from "react";
import { GRADE_DEPARTMENTS, GRADE_ADVISOR_MAP, normGradeNum, departmentForGradeNum } from "./gradeAdvisors";

const GRADING_PERIODS = [
  "Spring Semester 2026", "Fall Semester 2026",
  "Spring Semester 2027", "Fall Semester 2027",
  "Spring Semester 2028", "Fall Semester 2028",
];

// Grade dropdown groups, displayed with a "G" prefix (G1, G2, …) to match
// the existing convention used elsewhere on the report card.
const GRADE_GROUPS = GRADE_DEPARTMENTS.map(g => ({ dept: g.dept, grades: g.grades.map(n => `G${n}`) }));
function departmentForGrade(grade) { return departmentForGradeNum(normGradeNum(grade)); }
function advisorForGrade(grade) { return GRADE_ADVISOR_MAP[normGradeNum(grade)] || ""; }

export default function MetaPanel({ values, onChange }) {
  const set = (key, val) => onChange(prev => ({ ...prev, [key]: val }));

  // Manual advisor override mode — used for grades with no assigned teacher
  // (G1–G5) or when "Other" is picked for a grade that does have one.
  const [manualAdvisor, setManualAdvisor] = useState(!advisorForGrade(values.grade));
  useEffect(() => { setManualAdvisor(!advisorForGrade(values.grade)); }, [values.grade]);

  const setGrade = (grade) => {
    onChange(prev => ({
      ...prev,
      grade,
      department: departmentForGrade(grade) || prev.department,
      advisor: advisorForGrade(grade),
    }));
  };

  const mappedAdvisor = advisorForGrade(values.grade);

  return (
    <div className="meta-panel">
      <h3>Class Settings <span className="meta-hint">Applied to all students in this upload</span></h3>
      <div className="meta-grid">
        <label>
          <span>Department</span>
          <select value={values.department||""} onChange={e=>set("department",e.target.value)}>
            <option value="" disabled>Select department…</option>
            {GRADE_GROUPS.map(g => <option key={g.dept} value={g.dept}>{g.dept}</option>)}
          </select>
        </label>

        <label>
          <span>Grade</span>
          <select value={values.grade||""} onChange={e=>setGrade(e.target.value)}>
            <option value="" disabled>Select grade…</option>
            {GRADE_GROUPS.map(g => (
              <optgroup key={g.dept} label={g.dept}>
                {g.grades.map(gr => <option key={gr} value={gr}>{gr}</option>)}
              </optgroup>
            ))}
          </select>
        </label>

        <label>
          <span>Class Advisor</span>
          {manualAdvisor ? (
            <div className="advisor-manual-row">
              <input value={values.advisor||""} onChange={e=>set("advisor",e.target.value)}
                placeholder="Type advisor name" />
              {mappedAdvisor && (
                <button type="button" className="btn-advisor-reset"
                  onClick={()=>{ set("advisor", mappedAdvisor); setManualAdvisor(false); }}>
                  Use {mappedAdvisor}
                </button>
              )}
            </div>
          ) : (
            <select value={values.advisor||""} onChange={e=>{
              if (e.target.value === "__other__") { setManualAdvisor(true); return; }
              set("advisor", e.target.value);
            }}>
              <option value={mappedAdvisor}>{mappedAdvisor}</option>
              <option value="__other__">Other (type manually)…</option>
            </select>
          )}
        </label>

        <label>
          <span>Principal</span>
          <input value={values.principal||""} onChange={e=>set("principal",e.target.value)} placeholder="Mr. Arsenio Sumeg-ang" />
        </label>
        <label>
          <span>School Year</span>
          <input value={values.schoolYear||""} onChange={e=>set("schoolYear",e.target.value)} placeholder="2025–2026" />
        </label>
        <label>
          <span>Grading Period</span>
          <select value={values.gradingPeriod||""} onChange={e=>set("gradingPeriod",e.target.value)}>
            <option value="" disabled>Select term…</option>
            {GRADING_PERIODS.map(term => <option key={term} value={term}>{term}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}
