import { useState } from "react";

export default function StudentNav({ students, selectedIndex, onSelect }) {
  const [search, setSearch] = useState("");

  const filtered = students
    .map((s, i) => ({ ...s, originalIndex: i }))
    .filter(s =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.nickName && s.nickName.toLowerCase().includes(search.toLowerCase()))
    );

  return (
    <div className="student-nav">
      <input
        type="text"
        placeholder="Search student..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="student-search"
      />
      <div className="student-list">
        {filtered.map(s => (
          <button
            key={s.originalIndex}
            className={`student-btn ${s.originalIndex === selectedIndex ? "active" : ""}`}
            onClick={() => { onSelect(s.originalIndex); setSearch(""); }}
          >
            <span className="student-btn-name">
              {s.name}{s.nickName ? ` (${s.nickName})` : ""}
            </span>
            <span className="student-btn-grade">{s.grade}</span>
          </button>
        ))}
        {filtered.length === 0 && <p className="no-results">No students found</p>}
      </div>
    </div>
  );
}
