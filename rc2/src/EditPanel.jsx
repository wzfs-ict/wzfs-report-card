import { useState } from "react";

export default function EditPanel({ student, index, onChange }) {
  const [tab, setTab] = useState("comment");
  const set = (key, val) => onChange(index, { [key]: val });
  const setAtt = (key, val) => onChange(index, { attendance: { ...(student.attendance||{}), [key]: val } });

  const setSubj = (type, i, field, val) => {
    const arr = [...(type==="I" ? student.subjectsI : student.subjectsII)];
    arr[i] = { ...arr[i], [field]: val===""?null:(field==="score"?parseFloat(val):parseInt(val)) };
    onChange(index, type==="I"?{subjectsI:arr}:{subjectsII:arr});
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
          {(student.subjectsI||[]).map((s,i)=>(
            <div key={i} className="edit-subject-row">
              <input className="subj-name" value={s.name}
                onChange={e=>{const a=[...student.subjectsI];a[i]={...a[i],name:e.target.value};onChange(index,{subjectsI:a});}} />
              <input className="subj-score" type="number" placeholder="Score" value={s.score??""} onChange={e=>setSubj("I",i,"score",e.target.value)} />
              <input className="subj-beh" type="number" min="1" max="4" placeholder="B" value={s.behaviour??""} onChange={e=>setSubj("I",i,"behaviour",e.target.value)} />
              <button className="subj-remove" onClick={()=>delSubj("I",i)}>✕</button>
            </div>
          ))}
          <button className="btn-add-subject" onClick={()=>addSubj("I")}>+ Add Academic Subject</button>

          <div className="edit-subsection-title" style={{marginTop:"10px"}}>Subject II — Extracurricular</div>
          {(student.subjectsII||[]).map((s,i)=>(
            <div key={i} className="edit-subject-row">
              <input className="subj-name" value={s.name}
                onChange={e=>{const a=[...student.subjectsII];a[i]={...a[i],name:e.target.value};onChange(index,{subjectsII:a});}} />
              <input className="subj-score" type="number" placeholder="Score" value={s.score??""} onChange={e=>setSubj("II",i,"score",e.target.value)} />
              <input className="subj-beh" type="number" min="1" max="4" placeholder="B" value={s.behaviour??""} onChange={e=>setSubj("II",i,"behaviour",e.target.value)} />
              <button className="subj-remove" onClick={()=>delSubj("II",i)}>✕</button>
            </div>
          ))}
          <button className="btn-add-subject" onClick={()=>addSubj("II")}>+ Add Extracurricular</button>
        </div>
      )}

      {tab==="info" && (
        <div className="edit-section">
          {[["name","Full Name"],["nickName","Called Name"],["dob","Date of Birth (mm/dd/yyyy)"],
            ["grade","Grade"],["advisor","Advisor"],["principal","Principal"],["department","Department"],["gradingPeriod","Grading Period"]
          ].map(([k,l])=>(
            <label key={k} className="edit-field"><span>{l}</span>
              <input value={student[k]||""} onChange={e=>set(k,e.target.value)} />
            </label>
          ))}
          <div className="edit-subsection-title">Attendance</div>
          {[["totalDays","Total School Days"],["daysPresent","Days Present"],
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
            <div key={i} className="edit-award-row">
              <input placeholder="Award / Event name" value={c.name} onChange={e=>setCert(i,"name",e.target.value)} />
              <input placeholder="Type" style={{width:"100px"}} value={c.type} onChange={e=>setCert(i,"type",e.target.value)} />
              <input placeholder="Date" style={{width:"72px"}} value={c.date} onChange={e=>setCert(i,"date",e.target.value)} />
              <button className="subj-remove" onClick={()=>delCert(i)}>✕</button>
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
