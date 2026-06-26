import { useState, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";
import ReportCard from "./ReportCard";
import UploadPanel from "./UploadPanel";
import StudentNav from "./StudentNav";
import MetaPanel from "./MetaPanel";
import EditPanel from "./EditPanel";
import SignatureManager, { loadSignatures } from "./SignatureManager";
import { parseMarksData, parseAwardsData, mergeStudentData } from "./dataParser";

export default function App() {
  const [marksRaw, setMarksRaw] = useState(null);
  const [awardsRaw, setAwardsRaw] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [step, setStep] = useState("upload");
  const [errors, setErrors] = useState([]);
  const [showSigManager, setShowSigManager] = useState(false);
  const [signatures, setSignatures] = useState({});
  const [meta, setMeta] = useState({
    grade: "", advisor: "", principal: "Mr. Arsenio Sumeg-ang",
    department: "", gradingPeriod: "Spring Semester", schoolYear: "2025–2026",
  });

  useEffect(() => { setSignatures(loadSignatures()); }, []);

  const refreshSignatures = useCallback(() => {
    setSignatures(loadSignatures());
    setShowSigManager(false);
  }, []);

  // Detects and merges two-row headers: row of subject-group titles (often merged cells)
  // sitting above a row of Score/Behaviour sub-headers. Produces compound keys like
  // "English Lang_Score" so dataParser.js can match them. Falls back to normal single-row
  // parsing if no such pattern is found.
  const parseWithMergedHeaders = (sheet) => {
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", blankrows: false });
    const idPatterns = /student.?id|full.?name|student.?name|^name$|^id$/i;
    const subPatterns = /^score$|^behaviour$|^behavior$|^type$/i;

    // Find the row containing Score/Behaviour/Type sub-headers
    let subRowIdx = -1;
    for (let i = 0; i < Math.min(5, raw.length); i++) {
      const row = raw[i] || [];
      const subCount = row.filter(cell => subPatterns.test(String(cell).trim())).length;
      if (subCount >= 2) { subRowIdx = i; break; }
    }

    // No merged-header pattern found — fall back to standard single-row parsing
    if (subRowIdx === -1) {
      const headerRow = (() => {
        for (let i = 0; i < Math.min(5, raw.length); i++) {
          const row = raw[i] || [];
          const matchCount = row.filter(cell => idPatterns.test(String(cell).trim())).length;
          if (matchCount >= 2) return i;
        }
        return 0;
      })();
      return XLSX.utils.sheet_to_json(sheet, { defval: "", range: headerRow });
    }

    // Merged-header pattern found: row [subRowIdx - 1] holds subject group titles
    // (sparse — only set on the first column of each merged pair), row [subRowIdx]
    // holds Score/Behaviour/Type, and fixed columns (Student_ID etc.) live in subRowIdx too.
    // "Type" (e.g. under "Chinese") becomes "Chinese_Type" — picked up by dataParser.js
    // to use the student's specific class level (e.g. "Chinese Elementary Class A-1")
    // as the subject name instead of the generic group title.
    const groupRow = raw[subRowIdx - 1] || [];
    const subRow = raw[subRowIdx] || [];

    const compoundHeaders = [];
    let lastGroup = "";
    for (let c = 0; c < subRow.length; c++) {
      const subLabel = String(subRow[c] || "").trim();
      const groupLabel = String(groupRow[c] || "").trim();
      if (groupLabel) lastGroup = groupLabel; // merged cells only populate the first column
      if (subPatterns.test(subLabel)) {
        // e.g. "English Lang_Score" / "English Lang_Behaviour"
        const normalized = /behavior/i.test(subLabel) ? "Behaviour" : subLabel;
        compoundHeaders.push(`${lastGroup}_${normalized}`);
      } else {
        // Fixed column like Student_ID, Full_Name, Called_Name, Class Tutor Comment
        compoundHeaders.push(subLabel || `Col${c}`);
      }
    }

    const dataRows = raw.slice(subRowIdx + 1);
    return dataRows
      .filter(row => row.some(cell => String(cell).trim() !== ""))
      .map(row => {
        const obj = {};
        compoundHeaders.forEach((h, i) => { obj[h] = row[i] !== undefined ? row[i] : ""; });
        return obj;
      });
  };

  const readFile = useCallback((file, onData) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = parseWithMergedHeaders(ws);
        onData(rows);
        setErrors([]);
      } catch { setErrors(["Could not read file — please check the format."]); }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // Awards workbooks often have one tab per event/competition — read ALL sheets and combine
  const readAwardsFile = useCallback((file, onData) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        let combined = [];
        for (const sheetName of wb.SheetNames) {
          const ws = wb.Sheets[sheetName];
          const rows = parseWithMergedHeaders(ws);
          combined = combined.concat(rows);
        }
        onData(combined);
        setErrors([]);
      } catch { setErrors(["Could not read awards file — please check the format."]); }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleGenerate = () => {
    if (!marksRaw) { setErrors(["Please upload the marks file first."]); return; }
    try {
      const parsed = parseMarksData(marksRaw, meta);
      const awards = awardsRaw ? parseAwardsData(awardsRaw) : {};
      const merged = mergeStudentData(parsed, awards).map(s => ({
        ...s,
        grade: s.grade || meta.grade,
        advisor: s.advisor || meta.advisor,
        principal: s.principal || meta.principal,
        department: s.department || meta.department,
        gradingPeriod: s.gradingPeriod || meta.gradingPeriod,
        schoolYear: meta.schoolYear,
      }));
      if (!merged.length) { setErrors(["No students found — check your file's column headers."]); return; }
      setStudents(merged);
      setSelectedIndex(0);
      setStep("preview");
    } catch (err) { setErrors([err.message || "Error reading file."]); }
  };

  const updateStudent = useCallback((index, updates) => {
    setStudents(prev => { const n=[...prev]; n[index]={...n[index],...updates}; return n; });
  }, []);

  // Total School Days is the one attendance figure shared by an entire class —
  // when a teacher edits it for one student, sync it to every student in this upload.
  const updateAttendanceTotalDays = useCallback((value) => {
    setStudents(prev => prev.map(s => ({
      ...s,
      attendance: { ...(s.attendance || {}), totalDays: value },
    })));
  }, []);

  // Renames a subject across every student in the class — fixes typos/inconsistent
  // naming made by different subject teachers, applied only when explicitly confirmed.
  const renameSubjectClassWide = useCallback((subjectType, oldName, newName) => {
    if (!newName || newName === oldName) return;
    setStudents(prev => prev.map(s => {
      const key = subjectType === "I" ? "subjectsI" : "subjectsII";
      const list = (s[key] || []).map(sub => sub.name === oldName ? { ...sub, name: newName } : sub);
      return { ...s, [key]: list };
    }));
  }, []);

  if (step === "preview") {
    return (
      <div className="app-preview">
        <div className="preview-toolbar no-print">
          <div className="tl">
            <button className="btn-back" onClick={()=>{setStep("upload");setStudents([]);}}>← Upload</button>
            <span className="stu-count">{students.length} students</span>
          </div>
          <div className="tc">
            <StudentNav students={students} selectedIndex={selectedIndex} onSelect={setSelectedIndex}/>
          </div>
          <div className="tr">
            <button className="btn-sig" onClick={()=>setShowSigManager(true)}>✍ Signatures</button>
            <button className="btn-print" onClick={()=>window.print()}>🖨 Print / Save PDF</button>
          </div>
        </div>
        <div className="preview-body">
          <div className="edit-sidebar no-print">
            <EditPanel
              student={students[selectedIndex]}
              index={selectedIndex}
              onChange={updateStudent}
              onTotalDaysSync={updateAttendanceTotalDays}
              onRenameSubjectClassWide={renameSubjectClassWide}
            />
          </div>
          <div className="print-area">
            {students.map((s,i)=>(
              <div key={i} className={i===selectedIndex?"active-student":"hidden-student"}>
                <ReportCard student={s} signatures={signatures}/>
              </div>
            ))}
          </div>
        </div>
        {showSigManager && <SignatureManager onClose={refreshSignatures}/>}
      </div>
    );
  }

  return (
    <div className="app-upload">
      <header className="app-header">
        <div className="header-badge">Report Card Generator</div>
        <h1>WEIHAI ZHONGSHI FOREIGN SCHOOL</h1>
        <p className="header-sub">Upload · Edit · Print</p>
      </header>
      <main className="upload-main">
        <div className="upload-toolbar-row">
          <button className="btn-sig-outline" onClick={()=>setShowSigManager(true)}>✍ Manage Teacher & Principal Signatures</button>
        </div>
        <MetaPanel values={meta} onChange={setMeta}/>
        <div className="upload-grid">
          <UploadPanel title="Marks File" description="CSV or Excel — one row per student" icon="📋"
            onUpload={f=>readFile(f,setMarksRaw)} uploaded={!!marksRaw} rowCount={marksRaw?.length} required/>
          <UploadPanel title="Awards File" description="Reads every tab — Sports, Chinese, UNESCO, etc." icon="🏆"
            onUpload={f=>readAwardsFile(f,setAwardsRaw)} uploaded={!!awardsRaw} rowCount={awardsRaw?.length} required={false}/>
        </div>
        {errors.length>0 && <div className="error-box">{errors.map((e,i)=><p key={i}>⚠ {e}</p>)}</div>}
        <div className="generate-area">
          <button className="btn-generate" onClick={handleGenerate} disabled={!marksRaw}>
            Generate Report Cards →
          </button>
          {!marksRaw && <p className="generate-hint">Upload the marks file to continue</p>}
        </div>
        <div className="format-guide">
          <h3>How it works</h3>
          <div className="format-tables">
            <div>
              <h4>Marks file (wide format — your actual CSV)</h4>
              <p>One row per student. Subject columns like <code>Maths_Score</code>, <code>Maths_Behaviour</code>. Student name can include nick name in brackets e.g. <em>Hyunjeong Lim (Elena)</em>.</p>
              <p style={{marginTop:"8px"}}>Academic subjects → Subject I. PE, Drama, Electives, Orchestra, Debate → Subject II (auto-detected).</p>
            </div>
            <div>
              <h4>Awards file — multiple tabs supported</h4>
              <p>Every sheet/tab in the workbook is read automatically (Sports, Chinese Contests, UNESCO, Math Kangaroo, etc.) Column names can vary slightly between tabs — the app recognizes common variants:</p>
              <table><thead><tr><th>Looks for</th><th>Accepts</th></tr></thead>
              <tbody>
                <tr><td>Name</td><td>Name, Name of Student, Name of student</td></tr>
                <tr><td>Award title</td><td>Event, Award, Certificate</td></tr>
                <tr><td>Type</td><td>Recognition, Category, Remark</td></tr>
                <tr><td>Grade</td><td>Grade (used to avoid mismatches for common first names)</td></tr>
              </tbody></table>
            </div>
          </div>
        </div>
      </main>
      <footer className="app-footer">WZFS ICT Department · Report Card Generator · 2025–2026</footer>
      {showSigManager && <SignatureManager onClose={refreshSignatures}/>}
    </div>
  );
}
