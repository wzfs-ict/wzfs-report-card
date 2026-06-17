import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import ReportCard from "./ReportCard";
import UploadPanel from "./UploadPanel";
import StudentNav from "./StudentNav";
import MetaPanel from "./MetaPanel";
import EditPanel from "./EditPanel";
import { parseMarksData, parseAwardsData, mergeStudentData } from "./dataParser";

export default function App() {
  const [marksRaw, setMarksRaw] = useState(null);
  const [awardsRaw, setAwardsRaw] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [step, setStep] = useState("upload");
  const [errors, setErrors] = useState([]);
  const [metaOverrides, setMetaOverrides] = useState({
    grade: "", advisor: "Mr. Glen Joshua", department: "Middle School",
    gradingPeriod: "Spring Semester", schoolYear: "2025–2026",
  });

  const handleMarksUpload = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
        setMarksRaw(data);
        setErrors([]);
      } catch { setErrors(["Could not read marks file."]); }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleAwardsUpload = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
        setAwardsRaw(data);
        setErrors([]);
      } catch { setErrors(["Could not read awards file."]); }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleGenerate = () => {
    if (!marksRaw) { setErrors(["Please upload the marks file first."]); return; }
    try {
      const parsedMarks = parseMarksData(marksRaw, metaOverrides);
      const parsedAwards = awardsRaw ? parseAwardsData(awardsRaw) : {};
      const merged = mergeStudentData(parsedMarks, parsedAwards);
      if (merged.length === 0) { setErrors(["No student records found. Check column headers."]); return; }
      // Apply meta overrides to students missing those fields
      const withMeta = merged.map(s => ({
        ...s,
        grade: s.grade || metaOverrides.grade,
        advisor: s.advisor || metaOverrides.advisor,
        department: s.department || metaOverrides.department,
        gradingPeriod: s.gradingPeriod || metaOverrides.gradingPeriod,
        schoolYear: metaOverrides.schoolYear,
      }));
      setStudents(withMeta);
      setSelectedIndex(0);
      setStep("preview");
      setErrors([]);
    } catch (err) { setErrors([err.message || "Error processing files."]); }
  };

  // Update a single student's field (comment, meta, subject score/behaviour)
  const updateStudent = useCallback((index, updates) => {
    setStudents(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  }, []);

  if (step === "preview" && students.length > 0) {
    const current = students[selectedIndex];
    return (
      <div className="app-preview">
        <div className="preview-toolbar no-print">
          <div className="toolbar-left">
            <button className="btn-back" onClick={() => { setStep("upload"); setStudents([]); }}>← Upload</button>
            <span className="student-count">{students.length} students</span>
          </div>
          <div className="toolbar-center">
            <StudentNav students={students} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
          </div>
          <div className="toolbar-right">
            <button className="btn-print" onClick={() => window.print()}>🖨 Print / PDF</button>
          </div>
        </div>

        <div className="preview-body">
          {/* Left: Edit panel */}
          <div className="edit-sidebar no-print">
            <EditPanel
              student={current}
              index={selectedIndex}
              onChange={updateStudent}
            />
          </div>

          {/* Right: Report card */}
          <div className="print-area">
            {students.map((student, i) => (
              <div key={i} className={i === selectedIndex ? "active-student" : "hidden-student"}>
                <ReportCard student={student} schoolYear={metaOverrides.schoolYear} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-upload">
      <header className="app-header">
        <div className="header-left">
          <div className="header-badge">Report Card Generator</div>
          <h1>WEIHAI ZHONGSHI FOREIGN SCHOOL</h1>
          <p className="header-sub">Upload marks and awards files · Edit · Print</p>
        </div>
      </header>

      <main className="upload-main">
        <MetaPanel values={metaOverrides} onChange={setMetaOverrides} />

        <div className="upload-grid">
          <UploadPanel
            title="Marks File" description="One row per student — wide format (SubjectName_Score columns)" icon="📋"
            onUpload={handleMarksUpload} uploaded={!!marksRaw} rowCount={marksRaw?.length} required
          />
          <UploadPanel
            title="Awards File" description="Grade, Name of Student, Event, Recognition columns" icon="🏆"
            onUpload={handleAwardsUpload} uploaded={!!awardsRaw} rowCount={awardsRaw?.length} required={false}
          />
        </div>

        {errors.length > 0 && <div className="error-box">{errors.map((e,i) => <p key={i}>⚠ {e}</p>)}</div>}

        <div className="generate-area">
          <button className="btn-generate" onClick={handleGenerate} disabled={!marksRaw}>
            Generate Report Cards →
          </button>
        </div>

        <div className="format-guide">
          <h3>Supported File Formats</h3>
          <div className="format-tables">
            <div>
              <h4>Marks CSV/Excel — one row per student (wide format)</h4>
              <p style={{fontSize:"0.78rem",color:"#666",marginBottom:"8px"}}>Columns: <code>Student_ID, Full_Name, Called_Name</code> then subject columns like <code>Maths_Score, Maths_Behaviour</code></p>
              <p style={{fontSize:"0.78rem",color:"#555"}}>Subject type is auto-detected. Academic subjects → Subject I. PE, Drama, Debate, Electives, Orchestra → Subject II.</p>
            </div>
            <div>
              <h4>Awards Excel — one row per award</h4>
              <table><thead><tr><th>Column</th><th>Example</th></tr></thead>
              <tbody>
                <tr><td>Grade</td><td>7</td></tr>
                <tr><td>Name of Student</td><td>Joseph</td></tr>
                <tr><td>Event</td><td>YEASA Football Tournament</td></tr>
                <tr><td>Recognition</td><td>Certificate of Recognition</td></tr>
              </tbody></table>
            </div>
          </div>
        </div>
      </main>
      <footer className="app-footer"><p>WZFS ICT Department · Report Card Generator · 2025–2026</p></footer>
    </div>
  );
}
