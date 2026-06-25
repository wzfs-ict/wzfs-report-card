const GRADING_PERIODS = [
  "Spring Semester 2026", "Fall Semester 2026",
  "Spring Semester 2027", "Fall Semester 2027",
  "Spring Semester 2028", "Fall Semester 2028",
];

export default function MetaPanel({ values, onChange }) {
  const set = (key, val) => onChange(prev => ({ ...prev, [key]: val }));
  return (
    <div className="meta-panel">
      <h3>Class Settings <span className="meta-hint">Applied to all students in this upload</span></h3>
      <div className="meta-grid">
        {[
          ["grade","Grade","G7"],
          ["advisor","Class Advisor","Mr. Glen Joshua"],
          ["principal","Principal","Mr. Arsenio Sumeg-ang"],
          ["department","Department","Middle School"],
          ["schoolYear","School Year","2025–2026"],
        ].map(([key,label,ph]) => (
          <label key={key}>
            <span>{label}</span>
            <input value={values[key]||""} onChange={e=>set(key,e.target.value)} placeholder={ph} />
          </label>
        ))}
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
