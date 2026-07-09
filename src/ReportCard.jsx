import { normGradeNum, gradeDisplayKey } from "./gradeAdvisors";
import { gradeSignatureMap } from "./gradeSignatures";

function SubjectTable({ title, subjects, rowScale }) {
  const rows = [...(subjects||[])];
  return (
    <table className="rc-subject-table" style={{ "--row-scale": rowScale }}>
      <thead>
        <tr>
          <th className="rc-th-subject">{title}</th>
          <th className="rc-th-num">Score</th>
          <th className="rc-th-num">Behaviour</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((s,i) => (
          <tr key={i} className="rc-row-data">
            <td className="rc-cell-subject">{s.name}</td>
            <td className="rc-cell-num">{s.score!==null&&s.score!==undefined?s.score:""}</td>
            <td className="rc-cell-num">{s.behaviour!==null&&s.behaviour!==undefined?s.behaviour:""}</td>
          </tr>
        ))}
        <tr className="rc-row-terminator">
          <td colSpan={3} className="rc-cell-terminator">xx nothing follows &nbsp;&nbsp; xx</td>
        </tr>
      </tbody>
    </table>
  );
}

// Determines how much to scale up row height + font size when a student has
// very few subjects, so the table fills the page nicely instead of leaving
// a large empty gap. Caps out for students with many subjects (no shrinking
// below the normal compact size — only ever scales UP for sparse data).
function getRowScale(totalSubjects) {
  if (totalSubjects <= 6) return 1.6;
  if (totalSubjects <= 9) return 1.3;
  if (totalSubjects <= 12) return 1.1;
  return 1; // 13+ subjects: standard compact size, as before
}

function RCHeader({ schoolYear }) {
  return (
    <div className="rc-header">
      <div className="rc-header-left">
        <div className="rc-badge">Report Card</div>
        <div className="rc-year-block">
          <span className="rc-year-label">School Year:</span><br/>
          <span className="rc-year-value">{schoolYear||"2025–2026"}</span>
          <div className="rc-year-rule"/>
        </div>
      </div>
      <div className="rc-header-school">
        <div className="rc-school-en">WEIHAI ZHONGSHI FOREIGN SCHOOL</div>
        <div className="rc-school-zh">威海中世外籍人员子女学校</div>
      </div>
      <div className="rc-header-logos">
        <img src="./wzfs-logo.png" alt="WZFS Logo" className="rc-logo" onError={e=>{e.target.style.display="none";}}/>
        <img src="./wasc-logo.png" alt="WASC Accreditation" className="rc-logo rc-logo-wasc" onError={e=>{e.target.style.display="none";}}/>
      </div>
    </div>
  );
}

function RCStudentInfo({ student }) {
  return (
    <div className="rc-student-info">
      <div className="rc-info-row">
        <div className="rc-info-cell wide">
          <span className="rc-lbl">Name of Student</span><span className="rc-sep">:</span>
          <span className="rc-val name-val">{student.name}{student.nickName?` (${student.nickName})`:""}</span>
          <span className="rc-sublbl">first name_last name (Nick Name)</span>
        </div>
        <div className="rc-info-cell">
          <span className="rc-lbl">Grade</span><span className="rc-sep">:</span>
          <span className="rc-val">{student.grade}</span>
        </div>
      </div>
      <div className="rc-info-row">
        <div className="rc-info-cell wide">
          <span className="rc-lbl">Date of Birth</span><span className="rc-sep">:</span>
          <span className="rc-val">{student.dob||""}</span>
          <span className="rc-sublbl">出生日期 (mm/dd/yyyy)</span>
        </div>
        <div className="rc-info-cell">
          <span className="rc-lbl">Advisor</span><span className="rc-sep">:</span>
          <span className="rc-val">{student.advisor}</span>
        </div>
      </div>
      <div className="rc-info-row">
        <div className="rc-info-cell wide">
          <span className="rc-lbl">Department</span><span className="rc-sep">:</span>
          <span className="rc-val">{student.department}</span>
        </div>
        <div className="rc-info-cell">
          <span className="rc-lbl">Grading Period</span><span className="rc-sep">:</span>
          <span className="rc-val">{student.gradingPeriod}</span>
        </div>
      </div>
    </div>
  );
}

function AttendanceTable({ att }) {
  const a = att || {};
  return (
    <table className="rc-att-table">
      <thead><tr><th colSpan={2} className="rc-att-th">Attendance</th></tr></thead>
      <tbody>
        {[["Total Number of School Days","totalDays"],["Days Present","daysPresent"],
          ["Authorized Absences","authAbsences"],["Unauthorized Absences","unauthAbsences"],
          ["Days Tardy","daysTardy"]].map(([label,key])=>(
          <tr key={key}>
            <td className="rc-att-label">{label}</td>
            <td className="rc-att-val">{a[key]!==undefined&&a[key]!==""?a[key]:""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RCFooterNotes() {
  return (
    <div className="rc-notes">
      <p>- <em>Subject I – Academic Subjects</em></p>
      <p>- <em>Subject II – Extra Curricular Subjects</em></p>
      <p>- <em>Behaviour is scored from 1 (highest) to 4 (lowest). The behaviour score reflects both the student's attitude and effort in class. The rating is calculated independently of the exam score.</em></p>
      <p>- <em>PE (Physical Education)</em></p>
    </div>
  );
}

function AccreditationStrip() {
  return (
    <div className="rc-accred-strip">
      <span>WASC Accredited</span><span className="rc-accred-dot">•</span>
      <span>Western Association of Schools and Colleges</span>
    </div>
  );
}

function RCSignatures({ student, signatures }) {
  const gradeNum = normGradeNum(student.grade);          // "7", "ZSA", ""
  const gradeKey = gradeNum ? gradeDisplayKey(gradeNum) : null; // "G7", "ZSA", null
  // Manual override (teacher signed in Manage Signatures) takes priority;
  // otherwise fall back to the preloaded bundled signature for that grade.
  const advisorSig = (gradeKey && signatures?.[gradeKey]) || (gradeNum && gradeSignatureMap[gradeNum]) || null;
  const principalName = student.principal || "Mr. Arsenio Sumeg-ang";
  // Principal: localStorage override → bundled principal.png → nothing
  const principalSig = signatures?.["principal"] || gradeSignatureMap["principal"] || null;

  return (
    <div className="rc-sigs">
      <div className="rc-sig-block">
        <div className="rc-sig-line">
          {advisorSig && <img src={advisorSig} alt="" className="rc-sig-img" />}
        </div>
        <p className="rc-sig-role">Class Advisor Signature:</p>
        <p className="rc-sig-name">{student.advisor}</p>
      </div>
      <div className="rc-sig-block">
        <div className="rc-sig-line">
          {principalSig && <img src={principalSig} alt="" className="rc-sig-img" />}
        </div>
        <p className="rc-sig-role">School Principal Signature:</p>
        <p className="rc-sig-name">{principalName}</p>
      </div>
    </div>
  );
}

function RCAddress({ pageNum }) {
  return (
    <div className="rc-address-row">
      <div className="rc-address-text">
        <p>42 East jiang Su Road International Port Economic and Technological Development District, Weihai City Shandong Province, China 264-211</p>
        <p>中国山东省威海市临港经济技术开发区 江苏东路北侧42号 &nbsp;&nbsp; Tel: (86)631-599-6381 / www.zhongshischool.org</p>
      </div>
      <div className="rc-page-num">Page {pageNum} of 2</div>
    </div>
  );
}

function normalizeSubjectGroups(subjectsI = [], subjectsII = []) {
  const movedMusic = subjectsI.filter(s => s.name?.trim().toLowerCase() === "music");
  if (!movedMusic.length) {
    return { subjectsI, subjectsII };
  }
  return {
    subjectsI: subjectsI.filter(s => s.name?.trim().toLowerCase() !== "music"),
    subjectsII: [...subjectsII, ...movedMusic],
  };
}

function Page1({ student, signatures }) {
  const { subjectsI, subjectsII } = normalizeSubjectGroups(student.subjectsI, student.subjectsII);
  const totalSubjects = (subjectsI?.length||0) + (subjectsII?.length||0);
  const rowScale = getRowScale(totalSubjects);
  return (
    <div className="rc-page">
      <RCHeader schoolYear={student.schoolYear}/>
      <div className="rc-rule"/>
      <RCStudentInfo student={student}/>
      <div className="rc-rule"/>
      <div className="rc-body">
        <div className="rc-body-left">
          <SubjectTable title="Subject I" subjects={student.subjectsI} rowScale={rowScale}/>
          <SubjectTable title="Subject II" subjects={student.subjectsII} rowScale={rowScale}/>
          <RCFooterNotes/>
        </div>
        <div className="rc-body-right">
          <AttendanceTable att={student.attendance}/>
          <div className="rc-comments-box rc-comments-grow">
            <div className="rc-comments-hdr">Teacher's Comments and Feedback</div>
            <p className="rc-comments-body">{student.homeroomComment||""}</p>
          </div>
        </div>
      </div>
      <RCSignatures student={student} signatures={signatures}/>
      <div className="rc-rule"/>
      <AccreditationStrip/>
      <RCAddress pageNum="1"/>
    </div>
  );
}

function Page2({ student }) {
  const sp    = student.servicePoints || [];
  const certs = student.certificates  || [];

  // Use 2-column layouts for both service points and certificates to save space.
  const effectiveRows = Math.ceil(sp.length / 2) + Math.ceil(certs.length / 2);

  // Tighten the page for denser data so the quote and footer stay visible.
  const p2Scale = Math.min(1, Math.max(0.58, 24 / Math.max(24, sp.length + certs.length + 8)));
  const p2Pad = Math.max(0.78, p2Scale);

  return (
    <div className="rc-page" style={{"--p2-scale": p2Scale, "--p2-pad": p2Pad}}>
      <RCHeader schoolYear={student.schoolYear}/>
      <div className="rc-rule"/>
      <div className="rc-p2-student-strip">
        <span className="rc-p2-strip-name">{student.name}{student.nickName?` (${student.nickName})`:""}</span>
        <span className="rc-p2-strip-sep">·</span>
        <span>{/^\d/.test(normGradeNum(student.grade)) ? `Grade ${student.grade}` : student.grade}</span>
        <span className="rc-p2-strip-sep">·</span>
        <span>{student.gradingPeriod}</span>
      </div>
      <div className="rc-rule"/>

      <div className="rc-p2-banner">
        <div className="rc-p2-banner-title">Achievements &amp; Recognition</div>
        <div className="rc-p2-banner-sub">Service Points and Certificates earned during {student.gradingPeriod||"this grading period"}</div>
      </div>

      <div className="rc-p2-body">
        {sp.length > 0 && (
          <>
            <div className="rc-p2-section-title">Service Points</div>
            <div className="rc-p2-sp-grid">
              {sp.map((s,i) => (
                <div key={i} className={`rc-p2-sp-cell${i%2===1 ? " rc-p2-sp-even" : ""}`}>
                  <span className="rc-p2-sp-name">{s.name}</span>
                  <span className="rc-p2-sp-points">{s.points}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="rc-p2-section-title" style={{marginTop: sp.length > 0 ? "calc(6mm * var(--p2-scale,1))" : "0"}}>Certificates</div>
        {certs.length > 0 ? (
          <div className="rc-p2-certs-2col">
            {certs.map((c,i) => (
              <div key={i} className={`rc-p2-cert-cell${i%2===1?" rc-p2-cert-even":""}`}>
                <span className="rc-p2-cert-name">{c.name}</span>
                <span className="rc-p2-cert-type">{c.type}</span>
              </div>
            ))}
          </div>
        ) : <div className="rc-p2-placeholder">C &nbsp; e &nbsp; r &nbsp; t &nbsp; i &nbsp; f &nbsp; i &nbsp; c &nbsp; a &nbsp; t &nbsp; e &nbsp; s</div>}

        {p2Scale >= 0.78 && <div className="rc-p2-spacer"/>}
        {p2Scale >= 0.78 && (
          <div className="rc-p2-quote">"Use better Grades to build better Character."</div>
        )}
      </div>

      {/* Signatures removed from Page 2 to maximize space for certificates */}
      
      <div className="rc-rule"/>
      <AccreditationStrip/>
      <RCAddress pageNum="2"/>
    </div>
  );
}

export default function ReportCard({ student, signatures }) {
  return (
    <div className="rc-wrapper">
      <Page1 student={student} signatures={signatures}/>
      <div className="rc-page-break"/>
      <Page2 student={student}/>
    </div>
  );
}
