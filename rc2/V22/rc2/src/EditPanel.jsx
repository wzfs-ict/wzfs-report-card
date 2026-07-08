import { useState } from "react";

const GRADING_PERIODS = [
  "Spring Semester 2026", "Fall Semester 2026",
  "Spring Semester 2027", "Fall Semester 2027",
  "Spring Semester 2028", "Fall Semester 2028",
];

// Convert "mm/dd/yyyy" -> "yyyy-mm-dd" for the HTML date input
function toInputDate(mmddyyyy) {
  if (!mmddyyyy) return "";
  const parts = String(mmddyyyy).split("/");
  if (parts.length !== 3) return "";
  const [mm, dd, yyyy] = parts;
  if (!mm || !dd || !yyyy) return "";
  return `${yyyy.padStart(4,"0")}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
}

// Convert "yyyy-mm-dd" (from date input) -> "mm/dd/yyyy" for display/storage
function fromInputDate(yyyymmdd) {
  if (!yyyymmdd) return "";
  const parts = yyyymmdd.split("-");
  if (parts.length !== 3) return "";
  const [yyyy, mm, dd] = parts;
  return `${mm}/${dd}/${yyyy}`;
}

export default function EditPanel({ student, index, onChange, onTotalDaysSync, onRenameSubjectClassWide }) {
  const [tab, setTab] = useState("comment");
  const set = (key, val) => onChange(index, { [key]: val });
  const setAtt = (key, val) => {
    onChange(index, { attendance: { ...(student.attendance||{}), [key]: val } });
    // Total School Days is shared across the whole class — sync it everywhere
    if (key === "totalDays" && onTotalDaysSync) onTotalDaysSync(val);
  };

  const setSubj = (type, i, field, val) => {
    const arr = [...(type==="I" ? student.subjectsI : student.subjectsII)];
    arr[i] = { ...arr[i], [field]: val===""?null:(field==="score"?parseFloat(val):parseInt(val)) };
    onChange(index, type==="I"?{subjectsI:arr}:{subjectsII:arr});
  };
  // Rounds a score to the nearest whole number when the field loses focus
  const roundSubjScore = (type, i) => {
    const arr = [...(type==="I" ? student.subjectsI : student.subjectsII)];
    if (arr[i].score !== null && arr[i].score !== undefined) {
      arr[i] = { ...arr[i], score: Math.round(arr[i].score) };
      onChange(index, type==="I"?{subjectsI:arr}:{subjectsII:arr});
    }
  };
  const addSubj = (type) => {
    const arr = [...(type==="I"?student.subjectsI:student.subjectsII), {name:"New Subject",score:null,behaviour:null}];
    onChange(index, type==="I"?{subjectsI:arr}:{subjectsII:arr});
  };
  const delSubj = (type, i) => {
    const arr = [...(type==="I"?student.subjectsI:student.subjectsII)];
    arr.splice(i,1);
    onChange(index, type==="I"?{subjectsI:arr}:{subjectsII:arr});
  };
  // Local edit buffer for subject names — lets the teacher type freely, then choose
  // whether to apply the rename to just this student or the whole class.
  const [renameDraft, setRenameDraft] = useState({}); // key: "I-0" -> { oldName, newName }
  const setSubjNameLocal = (type, i, val, originalName) => {
    const draftKey = `${type}-${i}`;
    setRenameDraft(prev => ({ ...prev, [draftKey]: { oldName: prev[draftKey]?.oldName ?? originalName, newName: val } }));
  };
  const commitNameThisStudent = (type, i) => {
    const draftKey = `${type}-${i}`;
    const draft = renameDraft[draftKey];
    if (!draft) return;
    const arr = [...(type==="I"?student.subjectsI:student.subjectsII)];
    arr[i] = { ...arr[i], name: draft.newName };
    onChange(index, type==="I"?{subjectsI:arr}:{subjectsII:arr});
    setRenameDraft(prev => { const n={...prev}; delete n[draftKey]; return n; });
  };
  // Fires on mousedown (before the input's onBlur) so we can read the pending
  // rename before React clears it — avoids a race where blur wipes the draft
  // before the class-wide click handler can read it.
  const commitNameClassWide = (type, i, draftKey) => {
    const draft = renameDraft[draftKey];
    if (!draft || !onRenameSubjectClassWide) return;
    onRenameSubjectClassWide(type, draft.oldName, draft.newName);
    const arr = [...(type==="I"?student.subjectsI:student.subjectsII)];
    arr[i] = { ...arr[i], name: draft.newName };
    onChange(index, type==="I"?{subjectsI:arr}:{subjectsII:arr});
    setRenameDraft(prev => { const n={...prev}; delete n[draftKey]; return n; });
  };

  const addCert = () => onChange(index, { certificates: [...(student.certificates||[]), {type:"Certificate",name:"",date:""}] });
  const setCert = (i,f,v) => { const a=[...(student.certificates||[])]; a[i]={...a[i],[f]:v}; onChange(index,{certificates:a}); };
  const delCert = (i) => { const a=[...(student.certificates||[])]; a.splice(i,1); onChange(index,{certificates:a}); };

  const addSP = () => onChange(index, { servicePoints: [...(student.servicePoints||[]), {name:"",points:0}] });
  const setSP = (i,f,v) => { const a=[...(student.servicePoints||[])]; a[i]={...a[i],[f]:f==="points"?Number(v):v}; onChange(index,{servicePoints:a}); };
  const delSP = (i) => { const a=[...(student.servicePoints||[])]; a.splice(i,1); onChange(index,{servicePoints:a}); };

  return (
    <div className="edit-panel">
      <div className="edit-student-name">✏ {student.name}{student.nickName?` (${student.nickName})`:""}</div>
      <div className="edit-tabs">
        {[["comment","Comment"],["marks","Marks"],["info","Info"],["awards","Awards"]].map(([t,l])=>(
          <button key={t} className={`edit-tab ${tab===t?"active":""}`} onClick={()=>setTab(t)}>{l}</button>
        ))}
      </div>

      {tab==="comment" && (
        <div className="edit-section">
          <div className="edit-subsection-title">Class Advisor Comment</div>
          <p className="edit-hint">This appears in the Teacher's Comments box on Page 1.</p>
          <textarea className="comment-textarea" rows={9} value={student.homeroomComment||""}
            onChange={e=>set("homeroomComment",e.target.value)}
            placeholder="Type the class advisor's comment here..." />
          <div className="char-count">{(student.homeroomComment||"").length} characters</div>
        </div>
      )}

      {tab==="marks" && (
        <div className="edit-section">
          <div className="edit-subsection-title">Subject I — Academic</div>
          {(student.subjectsI||[]).map((s,i)=>{
            const draftKey = `I-${i}`;
            const draft = renameDraft[draftKey];
            const hasDraft = draft && draft.newName !== draft.oldName;
            const currentName = draft ? draft.newName : s.name;
            return (
            <div key={i} className="subj-block">
              <div className="edit-subject-row">
                <input className="subj-name" value={currentName}
                  onChange={e=>setSubjNameLocal("I",i,e.target.value,s.name)}
                  onBlur={()=>commitNameThisStudent("I",i)} />
                <input className="subj-score" type="number" placeholder="Score" value={s.score??""}
                  onChange={e=>setSubj("I",i,"score",e.target.value)}
                  onBlur={()=>roundSubjScore("I",i)} />
                <input className="subj-beh" type="number" min="1" max="4" placeholder="B" value={s.behaviour??""} onChange={e=>setSubj("I",i,"behaviour",e.target.value)} />
                <button className="subj-remove" onClick={()=>delSubj("I",i)}>✕</button>
              </div>
              {hasDraft && (
                <button className="btn-apply-classwide" onMouseDown={()=>commitNameClassWide("I",i,draftKey)}>
                  Apply rename to all students with "{draft.oldName}"
                </button>
              )}
            </div>
          )})}
          <button className="btn-add-subject" onClick={()=>addSubj("I")}>+ Add Academic Subject</button>

          <div className="edit-subsection-title" style={{marginTop:"10px"}}>Subject II — Extracurricular</div>
          {(student.subjectsII||[]).map((s,i)=>{
            const draftKey = `II-${i}`;
            const draft = renameDraft[draftKey];
            const hasDraft = draft && draft.newName !== draft.oldName;
            const currentName = draft ? draft.newName : s.name;
            return (
            <div key={i} className="subj-block">
              <div className="edit-subject-row">
                <input className="subj-name" value={currentName}
                  onChange={e=>setSubjNameLocal("II",i,e.target.value,s.name)}
                  onBlur={()=>commitNameThisStudent("II",i)} />
                <input className="subj-score" type="number" placeholder="Score" value={s.score??""}
                  onChange={e=>setSubj("II",i,"score",e.target.value)}
                  onBlur={()=>roundSubjScore("II",i)} />
                <input className="subj-beh" type="number" min="1" max="4" placeholder="B" value={s.behaviour??""} onChange={e=>setSubj("II",i,"behaviour",e.target.value)} />
                <button className="subj-remove" onClick={()=>delSubj("II",i)}>✕</button>
              </div>
              {hasDraft && (
                <button className="btn-apply-classwide" onMouseDown={()=>commitNameClassWide("II",i,draftKey)}>
                  Apply rename to all students with "{draft.oldName}"
                </button>
              )}
            </div>
          )})}
          <button className="btn-add-subject" onClick={()=>addSubj("II")}>+ Add Extracurricular</button>
        </div>
      )}

      {tab==="info" && (
        <div className="edit-section">
          {[["name","Full Name"],["nickName","Called Name"]
          ].map(([k,l])=>(
            <label key={k} className="edit-field"><span>{l}</span>
              <input value={student[k]||""} onChange={e=>set(k,e.target.value)} />
            </label>
          ))}
          <label className="edit-field">
            <span>Date of Birth</span>
            <input type="date" value={toInputDate(student.dob)} onChange={e=>set("dob", fromInputDate(e.target.value))} />
          </label>
          {[["grade","Grade"],["advisor","Advisor"],["principal","Principal"],["department","Department"]
          ].map(([k,l])=>(
            <label key={k} className="edit-field"><span>{l}</span>
              <input value={student[k]||""} onChange={e=>set(k,e.target.value)} />
            </label>
          ))}
          <label className="edit-field">
            <span>Grading Period</span>
            <select value={student.gradingPeriod||""} onChange={e=>set("gradingPeriod",e.target.value)}>
              <option value="" disabled>Select term…</option>
              {GRADING_PERIODS.map(term => <option key={term} value={term}>{term}</option>)}
            </select>
          </label>
          <div className="edit-subsection-title">Attendance</div>
          <label className="edit-field">
            <span>Total School Days <em className="sync-note">(syncs to whole class)</em></span>
            <input type="number" value={student.attendance?.totalDays??""} onChange={e=>setAtt("totalDays", e.target.value)} />
          </label>
          {[["daysPresent","Days Present"],
            ["authAbsences","Auth. Absences"],["unauthAbsences","Unauth. Absences"],["daysTardy","Days Tardy"]
          ].map(([k,l])=>(
            <label key={k} className="edit-field"><span>{l}</span>
              <input type="number" value={student.attendance?.[k]??""} onChange={e=>setAtt(k,e.target.value)} />
            </label>
          ))}
        </div>
      )}

      {tab==="awards" && (
        <div className="edit-section">
          <div className="edit-subsection-title">Certificates & Recognitions</div>
          {(student.certificates||[]).map((c,i)=>(
            <div key={i} className="cert-card">
              <div className="cert-card-row">
                <input className="cert-name" placeholder="Award / Event name" value={c.name} onChange={e=>setCert(i,"name",e.target.value)} />
                <button className="subj-remove" onClick={()=>delCert(i)} title="Remove">✕</button>
              </div>
              <div className="cert-card-row">
                <input className="cert-type-full" placeholder="Type (e.g. Certificate)" value={c.type} onChange={e=>setCert(i,"type",e.target.value)} />
              </div>
            </div>
          ))}
          <button className="btn-add-subject" onClick={addCert}>+ Add Certificate</button>
          <div className="edit-subsection-title" style={{marginTop:"10px"}}>Service Points</div>
          {(student.servicePoints||[]).map((sp,i)=>(
            <div key={i} className="edit-award-row">
              <input placeholder="Activity" value={sp.name} onChange={e=>setSP(i,"name",e.target.value)} />
              <input type="number" placeholder="Pts" style={{width:"65px"}} value={sp.points} onChange={e=>setSP(i,"points",e.target.value)} />
              <button className="subj-remove" onClick={()=>delSP(i)}>✕</button>
            </div>
          ))}
          <button className="btn-add-subject" onClick={addSP}>+ Add Service Points</button>
        </div>
      )}
    </div>
  );
}
