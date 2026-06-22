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
          ["gradingPeriod","Grading Period","Spring Semester"],
          ["schoolYear","School Year","2025–2026"],
        ].map(([key,label,ph]) => (
          <label key={key}>
            <span>{label}</span>
            <input value={values[key]||""} onChange={e=>set(key,e.target.value)} placeholder={ph} />
          </label>
        ))}
      </div>
    </div>
  );
}
