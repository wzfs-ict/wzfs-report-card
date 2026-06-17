export default function MetaPanel({ values, onChange }) {
  const set = (key, val) => onChange(prev => ({ ...prev, [key]: val }));
  return (
    <div className="meta-panel">
      <h3>Class Settings <span className="meta-hint">Applied to all students in this upload</span></h3>
      <div className="meta-grid">
        <label>
          <span>Grade</span>
          <input value={values.grade} onChange={e => set("grade", e.target.value)} placeholder="e.g. G7" />
        </label>
        <label>
          <span>Class Advisor</span>
          <input value={values.advisor} onChange={e => set("advisor", e.target.value)} placeholder="Mr. Glen Joshua" />
        </label>
        <label>
          <span>Department</span>
          <input value={values.department} onChange={e => set("department", e.target.value)} placeholder="Middle School" />
        </label>
        <label>
          <span>Grading Period</span>
          <input value={values.gradingPeriod} onChange={e => set("gradingPeriod", e.target.value)} placeholder="Spring Semester" />
        </label>
        <label>
          <span>School Year</span>
          <input value={values.schoolYear} onChange={e => set("schoolYear", e.target.value)} placeholder="2025–2026" />
        </label>
      </div>
    </div>
  );
}
