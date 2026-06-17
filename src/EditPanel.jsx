import { useState } from "react";

export default function EditPanel({ student, index, onChange }) {
  const [activeTab, setActiveTab] = useState("info");

  const set = (key, val) => onChange(index, { [key]: val });

  const setAttendance = (key, val) => {
    onChange(index, { attendance: { ...(student.attendance || {}), [key]: val } });
  };

  const setSubjectScore = (type, i, field, val) => {
    const arr = type === "I" ? [...(student.subjectsI || [])] : [...(student.subjectsII || [])];
    arr[i] = { ...arr[i], [field]: val === "" ? null : (field === "score" ? parseFloat(val) : parseInt(val)) };
    onChange(index, type === "I" ? { subjectsI: arr } : { subjectsII: arr });
  };

  const addSubject = (type) => {
    const arr = type === "I" ? [...(student.subjectsI || [])] : [...(student.subjectsII || [])];
    arr.push({ name: "New Subject", score: null, behaviour: null });
    onChange(index, type === "I" ? { subjectsI: arr } : { subjectsII: arr });
  };

  const removeSubject = (type, i) => {
    const arr = type === "I" ? [...(student.subjectsI || [])] : [...(student.subjectsII || [])];
    arr.splice(i, 1);
    onChange(index, type === "I" ? { subjectsI: arr } : { subjectsII: arr });
  };

  const addCert = () => {
    const certs = [...(student.certificates || [])];
    certs.push({ type: "Certificate", name: "", date: "" });
    onChange(index, { certificates: certs });
  };

  const updateCert = (i, field, val) => {
    const certs = [...(student.certificates || [])];
    certs[i] = { ...certs[i], [field]: val };
    onChange(index, { certificates: certs });
  };

  const removeCert = (i) => {
    const certs = [...(student.certificates || [])];
    certs.splice(i, 1);
    onChange(index, { certificates: certs });
  };

  const addService = () => {
    const sp = [...(student.servicePoints || [])];
    sp.push({ name: "", points: 0 });
    onChange(index, { servicePoints: sp });
  };

  const updateService = (i, field, val) => {
    const sp = [...(student.servicePoints || [])];
    sp[i] = { ...sp[i], [field]: field === "points" ? Number(val) : val };
    onChange(index, { servicePoints: sp });
  };

  const removeService = (i) => {
    const sp = [...(student.servicePoints || [])];
    sp.splice(i, 1);
    onChange(index, { servicePoints: sp });
  };

  return (
    <div className="edit-panel">
      <div className="edit-student-name">
        ✏ {student.name}{student.nickName ? ` (${student.nickName})` : ""}
      </div>

      <div className="edit-tabs">
        {["info", "subjects", "comment", "awards"].map(t => (
          <button key={t} className={`edit-tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
            {t === "info" ? "Info" : t === "subjects" ? "Marks" : t === "comment" ? "Comment" : "Awards"}
          </button>
        ))}
      </div>

      {/* ── INFO TAB ── */}
      {activeTab === "info" && (
        <div className="edit-section">
          <label className="edit-field"><span>Full Name</span>
            <input value={student.name} onChange={e => set("name", e.target.value)} />
          </label>
          <label className="edit-field"><span>Called Name (Nick)</span>
            <input value={student.nickName || ""} onChange={e => set("nickName", e.target.value)} />
          </label>
          <label className="edit-field"><span>Date of Birth</span>
            <input value={student.dob || ""} onChange={e => set("dob", e.target.value)} placeholder="mm/dd/yyyy" />
          </label>
          <label className="edit-field"><span>Grade</span>
            <input value={student.grade || ""} onChange={e => set("grade", e.target.value)} />
          </label>
          <label className="edit-field"><span>Advisor</span>
            <input value={student.advisor || ""} onChange={e => set("advisor", e.target.value)} />
          </label>
          <label className="edit-field"><span>Department</span>
            <input value={student.department || ""} onChange={e => set("department", e.target.value)} />
          </label>
          <label className="edit-field"><span>Grading Period</span>
            <input value={student.gradingPeriod || ""} onChange={e => set("gradingPeriod", e.target.value)} />
          </label>

          <div className="edit-subsection-title">Attendance</div>
          {[
            ["totalDays", "Total School Days"],
            ["daysPresent", "Days Present"],
            ["authAbsences", "Authorized Absences"],
            ["unauthAbsences", "Unauthorized Absences"],
            ["daysTardy", "Days Tardy"],
          ].map(([key, label]) => (
            <label key={key} className="edit-field">
              <span>{label}</span>
              <input type="number" value={student.attendance?.[key] ?? ""} onChange={e => setAttendance(key, e.target.value)} />
            </label>
          ))}
        </div>
      )}

      {/* ── SUBJECTS TAB ── */}
      {activeTab === "subjects" && (
        <div className="edit-section">
          <div className="edit-subsection-title">Subject I — Academic</div>
          {(student.subjectsI || []).map((sub, i) => (
            <div key={i} className="edit-subject-row">
              <input className="subj-name" value={sub.name} onChange={e => {
                const arr = [...student.subjectsI]; arr[i] = { ...arr[i], name: e.target.value };
                onChange(index, { subjectsI: arr });
              }} />
              <input className="subj-score" type="number" placeholder="Score" value={sub.score ?? ""} onChange={e => setSubjectScore("I", i, "score", e.target.value)} />
              <input className="subj-beh" type="number" min="1" max="4" placeholder="Beh" value={sub.behaviour ?? ""} onChange={e => setSubjectScore("I", i, "behaviour", e.target.value)} />
              <button className="subj-remove" onClick={() => removeSubject("I", i)} title="Remove">✕</button>
            </div>
          ))}
          <button className="btn-add-subject" onClick={() => addSubject("I")}>+ Add Academic Subject</button>

          <div className="edit-subsection-title" style={{marginTop:"12px"}}>Subject II — Extracurricular</div>
          {(student.subjectsII || []).map((sub, i) => (
            <div key={i} className="edit-subject-row">
              <input className="subj-name" value={sub.name} onChange={e => {
                const arr = [...student.subjectsII]; arr[i] = { ...arr[i], name: e.target.value };
                onChange(index, { subjectsII: arr });
              }} />
              <input className="subj-score" type="number" placeholder="Score" value={sub.score ?? ""} onChange={e => setSubjectScore("II", i, "score", e.target.value)} />
              <input className="subj-beh" type="number" min="1" max="4" placeholder="Beh" value={sub.behaviour ?? ""} onChange={e => setSubjectScore("II", i, "behaviour", e.target.value)} />
              <button className="subj-remove" onClick={() => removeSubject("II", i)} title="Remove">✕</button>
            </div>
          ))}
          <button className="btn-add-subject" onClick={() => addSubject("II")}>+ Add Extracurricular Subject</button>
        </div>
      )}

      {/* ── COMMENT TAB ── */}
      {activeTab === "comment" && (
        <div className="edit-section">
          <div className="edit-subsection-title">Class Advisor Comment</div>
          <p className="edit-hint">This is the main comment that appears on the report card.</p>
          <textarea
            className="comment-textarea"
            value={student.homeroomComment || ""}
            onChange={e => set("homeroomComment", e.target.value)}
            rows={8}
            placeholder="Enter the class advisor's comment for this student..."
          />
          <div className="char-count">{(student.homeroomComment || "").length} characters</div>
        </div>
      )}

      {/* ── AWARDS TAB ── */}
      {activeTab === "awards" && (
        <div className="edit-section">
          <div className="edit-subsection-title">Certificates & Recognitions</div>
          {(student.certificates || []).map((cert, i) => (
            <div key={i} className="edit-award-row">
              <input placeholder="Award name / event" value={cert.name} onChange={e => updateCert(i, "name", e.target.value)} />
              <input placeholder="Type" style={{width:"110px"}} value={cert.type} onChange={e => updateCert(i, "type", e.target.value)} />
              <input placeholder="Date" style={{width:"80px"}} value={cert.date} onChange={e => updateCert(i, "date", e.target.value)} />
              <button className="subj-remove" onClick={() => removeCert(i)}>✕</button>
            </div>
          ))}
          <button className="btn-add-subject" onClick={addCert}>+ Add Certificate</button>

          <div className="edit-subsection-title" style={{marginTop:"12px"}}>Service Points</div>
          {(student.servicePoints || []).map((sp, i) => (
            <div key={i} className="edit-award-row">
              <input placeholder="Activity / Service" value={sp.name} onChange={e => updateService(i, "name", e.target.value)} />
              <input type="number" placeholder="Pts" style={{width:"70px"}} value={sp.points} onChange={e => updateService(i, "points", e.target.value)} />
              <button className="subj-remove" onClick={() => removeService(i)}>✕</button>
            </div>
          ))}
          <button className="btn-add-subject" onClick={addService}>+ Add Service Points</button>
        </div>
      )}
    </div>
  );
}
