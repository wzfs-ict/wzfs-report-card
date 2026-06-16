import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import ReportCard from "./ReportCard";
import UploadPanel from "./UploadPanel";
import StudentNav from "./StudentNav";
import { parseMarksData, parseAwardsData, mergeStudentData } from "./dataParser";

export default function App() {
  const [marksRaw, setMarksRaw] = useState(null);
  const [awardsRaw, setAwardsRaw] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [step, setStep] = useState("upload"); // upload | preview
  const [errors, setErrors] = useState([]);
  const printRef = useRef();

  const handleMarksUpload = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
        setMarksRaw(data);
        setErrors([]);
      } catch (err) {
        setErrors(["Could not read marks file. Please check the format."]);
      }
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
      } catch (err) {
        setErrors(["Could not read awards file. Please check the format."]);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleGenerate = () => {
    if (!marksRaw) {
      setErrors(["Please upload the marks file first."]);
      return;
    }
    try {
      const parsedMarks = parseMarksData(marksRaw);
      const parsedAwards = awardsRaw ? parseAwardsData(awardsRaw) : {};
      const merged = mergeStudentData(parsedMarks, parsedAwards);
      if (merged.length === 0) {
        setErrors(["No student records found. Check your file columns."]);
        return;
      }
      setStudents(merged);
      setSelectedIndex(0);
      setStep("preview");
      setErrors([]);
    } catch (err) {
      setErrors([err.message || "Error processing files. Check column headers."]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    setStep("upload");
    setStudents([]);
    setSelectedIndex(0);
  };

  if (step === "preview" && students.length > 0) {
    return (
      <div className="app-preview">
        <div className="preview-toolbar no-print">
          <div className="toolbar-left">
            <button className="btn-back" onClick={handleBack}>
              ← Back to Upload
            </button>
            <span className="student-count">{students.length} student{students.length !== 1 ? "s" : ""} loaded</span>
          </div>
          <div className="toolbar-center">
            <StudentNav
              students={students}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
            />
          </div>
          <div className="toolbar-right">
            <button className="btn-print" onClick={handlePrint}>
              🖨 Print / Save as PDF
            </button>
          </div>
        </div>
        <div className="print-area" ref={printRef}>
          {students.map((student, i) => (
            <div
              key={i}
              className={`student-report-wrapper ${i === selectedIndex ? "active-student" : "hidden-student"}`}
            >
              <ReportCard student={student} />
            </div>
          ))}
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
          <p className="header-sub">Upload marks and awards files to generate printable report cards</p>
        </div>
        <div className="school-logo-area">
          <img src="/wzfs-logo.png" alt="WZFS Logo" onError={(e) => { e.target.style.display = "none"; }} />
        </div>
      </header>

      <main className="upload-main">
        <div className="upload-grid">
          <UploadPanel
            title="Marks File"
            description="Excel or CSV with student scores, behaviour, attendance & comments"
            icon="📋"
            onUpload={handleMarksUpload}
            uploaded={!!marksRaw}
            rowCount={marksRaw?.length}
            required
            templateCols={["StudentID","StudentName","NickName","DOB","Grade","Advisor","Department","GradingPeriod","SubjectType","SubjectName","Score","Behaviour","TotalDays","DaysPresent","AuthAbsences","UnauthAbsences","DaysTardy","TeacherComments"]}
          />
          <UploadPanel
            title="Awards File"
            description="Excel or CSV with certificates, honours and service points"
            icon="🏆"
            onUpload={handleAwardsUpload}
            uploaded={!!awardsRaw}
            rowCount={awardsRaw?.length}
            required={false}
            templateCols={["StudentID","StudentName","AwardType","AwardName","Points","Date"]}
          />
        </div>

        {errors.length > 0 && (
          <div className="error-box">
            {errors.map((e, i) => <p key={i}>⚠ {e}</p>)}
          </div>
        )}

        <div className="generate-area">
          <button
            className="btn-generate"
            onClick={handleGenerate}
            disabled={!marksRaw}
          >
            Generate Report Cards →
          </button>
          {!marksRaw && (
            <p className="generate-hint">Upload the marks file to continue. Awards file is optional.</p>
          )}
        </div>

        <div className="format-guide">
          <h3>Column Guide</h3>
          <div className="format-tables">
            <div>
              <h4>Marks File — one row per subject per student</h4>
              <table>
                <thead><tr><th>Column</th><th>Example</th><th>Notes</th></tr></thead>
                <tbody>
                  <tr><td>StudentID</td><td>G7-001</td><td>Unique ID, used to match awards</td></tr>
                  <tr><td>StudentName</td><td>JUNWOO PARK</td><td>Full name (uppercase)</td></tr>
                  <tr><td>NickName</td><td>Joseph</td><td>English name shown in brackets</td></tr>
                  <tr><td>DOB</td><td>08/01/2011</td><td>mm/dd/yyyy</td></tr>
                  <tr><td>Grade</td><td>G7</td><td></td></tr>
                  <tr><td>Advisor</td><td>Mr. Glen Joshua</td><td></td></tr>
                  <tr><td>Department</td><td>Middle School</td><td></td></tr>
                  <tr><td>GradingPeriod</td><td>Fall Semester</td><td></td></tr>
                  <tr><td>SubjectType</td><td>I</td><td>I = Academic, II = Extracurricular</td></tr>
                  <tr><td>SubjectName</td><td>Maths</td><td></td></tr>
                  <tr><td>Score</td><td>59</td><td>Numeric</td></tr>
                  <tr><td>Behaviour</td><td>1</td><td>1 (best) to 4 (lowest)</td></tr>
                  <tr><td>TotalDays</td><td>89</td><td>Same value repeated per student</td></tr>
                  <tr><td>DaysPresent</td><td>84</td><td></td></tr>
                  <tr><td>AuthAbsences</td><td>5</td><td></td></tr>
                  <tr><td>UnauthAbsences</td><td>0</td><td></td></tr>
                  <tr><td>DaysTardy</td><td>0</td><td></td></tr>
                  <tr><td>TeacherComments</td><td>Joseph is a focused...</td><td>Repeated per student rows</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <h4>Awards File — one row per award per student</h4>
              <table>
                <thead><tr><th>Column</th><th>Example</th><th>Notes</th></tr></thead>
                <tbody>
                  <tr><td>StudentID</td><td>G7-001</td><td>Must match Marks file ID</td></tr>
                  <tr><td>StudentName</td><td>JUNWOO PARK</td><td>Fallback if ID missing</td></tr>
                  <tr><td>AwardType</td><td>Certificate</td><td>Certificate / Honour / Service</td></tr>
                  <tr><td>AwardName</td><td>High Honour Roll</td><td></td></tr>
                  <tr><td>Points</td><td>10</td><td>For service points (leave blank if N/A)</td></tr>
                  <tr><td>Date</td><td>2025-12</td><td>Optional</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>WZFS ICT Department · Report Card Generator · 2025–2026</p>
      </footer>
    </div>
  );
}
