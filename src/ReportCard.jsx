function SubjectTable({ title, subjects }) {
  const rows = [...(subjects||[])];
  return (
    <table className="rc-subject-table">
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
        <tr className="rc-row-empty"><td colSpan={3}>&nbsp;</td></tr>
        <tr className="rc-row-empty"><td colSpan={3}>&nbsp;</td></tr>
      </tbody>
    </table>
  );
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
      <div className="rc-header-school">WEIHAI ZHONGSHI<br/>FOREIGN SCHOOL</div>
      <div className="rc-header-logos">
        <img src="./wzfs-logo.png" alt="WZFS Logo" className="rc-logo" onError={e=>{e.target.style.display="none";}}/>
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
          <span className="rc-val">{student.dob}</span>
          <span className="rc-sublbl">mm/dd/yyyy</span>
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
      <p>- <em>PSHE (Personal, Social, Health and Economic Education)</em></p>
      <p>- <em>PE (Physical Education)</em></p>
    </div>
  );
}

function RCSignatures({ student, signatures }) {
  const advisorSig = signatures?.[student.advisor];
  const principalName = student.principal || "Mr. Arsenio Sumeg-ang";
  const principalSig = signatures?.[principalName];

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

function Page1({ student, signatures }) {
  return (
    <div className="rc-page">
      <RCHeader schoolYear={student.schoolYear}/>
      <div className="rc-rule"/>
      <RCStudentInfo student={student}/>
      <div className="rc-rule"/>
      <div className="rc-body">
        <div className="rc-body-left">
          <SubjectTable title="Subject I" subjects={student.subjectsI}/>
          <SubjectTable title="Subject II" subjects={student.subjectsII}/>
          <RCFooterNotes/>
        </div>
        <div className="rc-body-right">
          <AttendanceTable att={student.attendance}/>
          <div className="rc-comments-box">
            <div className="rc-comments-hdr">Teacher's Comments and Feedback</div>
            <p className="rc-comments-body">{student.homeroomComment||""}</p>
          </div>
        </div>
      </div>
      <RCSignatures student={student} signatures={signatures}/>
      <div className="rc-rule"/>
      <RCAddress pageNum="1"/>
    </div>
  );
}

function Page2({ student, signatures }) {
  const sp = student.servicePoints||[];
  const certs = student.certificates||[];
  return (
    <div className="rc-page">
      <RCHeader schoolYear={student.schoolYear}/>
      <div className="rc-rule"/>
      <RCStudentInfo student={student}/>
      <div className="rc-rule"/>
      <div className="rc-p2-body">
        <div className="rc-p2-section-title">Service Points</div>
        {sp.length > 0 ? (
          <table className="rc-p2-table">
            <thead><tr><th>Activity / Service</th><th className="rc-p2-num">Points</th></tr></thead>
            <tbody>
              {sp.map((s,i)=><tr key={i}><td>{s.name}</td><td className="rc-p2-num">{s.points}</td></tr>)}
              <tr className="rc-p2-total"><td><strong>Total</strong></td><td className="rc-p2-num"><strong>{sp.reduce((a,b)=>a+(b.points||0),0)}</strong></td></tr>
            </tbody>
          </table>
        ) : <div className="rc-p2-placeholder">S &nbsp; e &nbsp; r &nbsp; v &nbsp; i &nbsp; c &nbsp; e &nbsp;&nbsp; P &nbsp; o &nbsp; i &nbsp; n &nbsp; t &nbsp; s</div>}

        <div className="rc-p2-section-title" style={{marginTop:"6mm"}}>Certificates</div>
        {certs.length > 0 ? (
          <table className="rc-p2-table">
            <thead><tr><th>Certificate / Award</th><th>Type</th><th>Date</th></tr></thead>
            <tbody>{certs.map((c,i)=><tr key={i}><td>{c.name}</td><td>{c.type}</td><td>{c.date}</td></tr>)}</tbody>
          </table>
        ) : <div className="rc-p2-placeholder">C &nbsp; e &nbsp; r &nbsp; t &nbsp; i &nbsp; f &nbsp; i &nbsp; c &nbsp; a &nbsp; t &nbsp; e &nbsp; s</div>}
      </div>
      <RCSignatures student={student} signatures={signatures}/>
      <div className="rc-rule"/>
      <RCAddress pageNum="2"/>
    </div>
  );
}

export default function ReportCard({ student, signatures }) {
  return (
    <div className="rc-wrapper">
      <Page1 student={student} signatures={signatures}/>
      <div className="rc-page-break"/>
      <Page2 student={student} signatures={signatures}/>
    </div>
  );
}
