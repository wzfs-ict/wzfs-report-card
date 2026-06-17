import { useState } from "react";

export default function StudentNav({ students, selectedIndex, onSelect }) {
  const [search, setSearch] = useState("");
  const filtered = students.map((s,i)=>({...s,i})).filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.nickName||"").toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="student-nav">
      <input type="text" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} className="student-search" />
      <div className="student-list">
        {filtered.map(s => (
          <button key={s.i} className={`student-btn ${s.i===selectedIndex?"active":""}`}
            onClick={()=>{onSelect(s.i);setSearch("");}}>
            <span>{s.name}{s.nickName?` (${s.nickName})`:""}</span>
            <span className="student-btn-grade">{s.grade}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
