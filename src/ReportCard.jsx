const MAX_ROWS = 9; // max subject rows per table section before "xx nothing follows xx"

function SubjectTable({ title, subjects }) {
  const rows = [...subjects];
  // Pad to at least 3 empty rows after the list, then cap
  while (rows.length < 3) rows.push(null);
  const visibleRows = rows.slice(0, MAX_ROWS);

  return (
    <table className="rc-subject-table">
      <thead>
        <tr>
          <th className="rc-th-subject">{title}</th>
          <th className="rc-th-score">Score</th>
          <th className="rc-th-beh">Behaviour</th>
        </tr>
      </thead>
      <tbody>
        {visibleRows.map((sub, i) => {
          if (!sub) return (
            <tr key={i} className="rc-row-empty">
              <td colSpan={3}>&nbsp;</td>
            </tr>
          );
          return (
            <tr key={i} className="rc-row-data">
              <td className="rc-cell-subject">{sub.name}</td>
              <td className="rc-cell-score">{sub.score !== null ? sub.score : ""}</td>
              <td className="rc-cell-beh">{sub.behaviour !== null ? sub.behaviour : ""}</td>
            </tr>
          );
        })}
        <tr className="rc-row-terminator">
          <td colSpan={3} className="rc-cell-terminator">xx nothing follows &nbsp; xx</td>
        </tr>
        {/* 2 blank buffer rows after terminator */}
        <tr className="rc-row-empty"><td colSpan={3}>&nbsp;</td></tr>
        <tr className="rc-row-empty"><td colSpan={3}>&nbsp;</td></tr>
      </tbody>
    </table>
  );
}

function AttendanceTable({ attendance }) {
  const a = attendance || { totalDays: "", daysPresent: "", authAbsences: "", unauthAbsences: "", daysTardy: "" };
  return (
    <table className="rc-attendance-table">
      <thead>
        <tr><th colSpan={2} className="rc-th-attendance">Attendance</th></tr>
      </thead>
      <tbody>
        <tr><td>Total Number of School Days</td><td className="rc-att-val">{a.totalDays}</td></tr>
        <tr><td>Days Present</td><td className="rc-att-val">{a.daysPresent}</td></tr>
        <tr><td>Authorized Absences</td><td className="rc-att-val">{a.authAbsences}</td></tr>
        <tr><td>Unauthorized Absences</td><td className="rc-att-val">{a.unauthAbsences}</td></tr>
        <tr><td>Days Tardy</td><td className="rc-att-val">{a.daysTardy}</td></tr>
      </tbody>
    </table>
  );
}

function RCHeader({ schoolYear = "2025–2026" }) {
  return (
    <div className="rc-header">
      <div className="rc-header-left">
        <div className="rc-badge-label">Report Card</div>
        <div className="rc-year-label">
          <span className="rc-year-italic">School Year:</span>
          <br />
          <span className="rc-year-value">{schoolYear}</span>
        </div>
      </div>
      <div className="rc-header-center">
        <div className="rc-school-name">WEIHAI ZHONGSHI<br />FOREIGN SCHOOL</div>
      </div>
      <div className="rc-header-right">
        <div className="rc-logo-box">
          <img src="/wzfs-logo.png" alt="WZFS" className="rc-logo-img" onError={e => e.target.style.display = "none"} />
        </div>
      </div>
    </div>
  );
}

function RCStudentInfo({ student }) {
  return (
    <div className="rc-student-info">
      <div className="rc-info-row">
        <div className="rc-info-item">
          <span className="rc-info-label">Name of Student</span>
          <span className="rc-info-sep">:</span>
          <span className="rc-info-value rc-info-name">
            {student.name}{student.nickName ? ` (${student.nickName})` : ""}
          </span>
          <span className="rc-info-sublabel">first name_last name (Nick Name)</span>
        </div>
        <div className="rc-info-item">
          <span className="rc-info-label">Grade</span>
          <span className="rc-info-sep">:</span>
          <span className="rc-info-value">{student.grade}</span>
        </div>
      </div>
      <div className="rc-info-row">
        <div className="rc-info-item">
          <span className="rc-info-label">Date of Birth</span>
          <span className="rc-info-sep">:</span>
          <span className="rc-info-value">{student.dob}</span>
          <span className="rc-info-sublabel">mm/dd/yyyy</span>
        </div>
        <div className="rc-info-item">
          <span className="rc-info-label">Advisor</span>
          <span className="rc-info-sep">:</span>
          <span className="rc-info-value">{student.advisor}</span>
        </div>
      </div>
      <div className="rc-info-row">
        <div className="rc-info-item">
          <span className="rc-info-label">Department</span>
          <span className="rc-info-sep">:</span>
          <span className="rc-info-value">{student.department}</span>
        </div>
        <div className="rc-info-item">
          <span className="rc-info-label">Grading Period</span>
          <span className="rc-info-sep">:</span>
          <span className="rc-info-value">{student.gradingPeriod}</span>
        </div>
      </div>
    </div>
  );
}

function RCFooterNotes() {
  return (
    <div className="rc-footer-notes">
      <p>- <em>Subject I – Academic Subjects</em></p>
      <p>- <em>Subject II – Extra Curricular Subjects</em></p>
      <p>- <em>Behaviour is scored from 1 (highest) to 4 (lowest). The behaviour score reflects both the student's attitude and effort in class. The rating is calculated independently of the exam score.</em></p>
      <p>- <em>PSHE (Personal, Social, Health and Economic Education)</em></p>
      <p>- <em>PE (Physical Education)</em></p>
    </div>
  );
}

function RCSignatures() {
  return (
    <div className="rc-signatures">
      <div className="rc-sig-block">
        <div className="rc-sig-line"></div>
        <p className="rc-sig-title">Class Advisor Signature:</p>
        <p className="rc-sig-name">Mr. Glen Joshua</p>
      </div>
      <div className="rc-sig-block">
        <div className="rc-sig-line"></div>
        <p className="rc-sig-title">School Principal Signature:</p>
        <p className="rc-sig-name">Mr. Arsenio Sumeg-ang</p>
      </div>
    </div>
  );
}

function RCAddressBar() {
  return (
    <div className="rc-address-bar">
      <p>42 East jiang Su Road International Port Economic and Technological Development District, Weihai City Shandong Province, China 264-211</p>
      <p>中国 山东省 威海市 临港经济技术开发区 江苏东路北侧 42号</p>
      <p>Tel: (86)631-599-6381 / www.zhongshischool.org</p>
    </div>
  );
}

// ─── Page 1 ─────────────────────────────────────────────────────────────────

function Page1({ student, pageNum = "1" }) {
  return (
    <div className="rc-page rc-page-1">
      <RCHeader />
      <div className="rc-divider" />
      <RCStudentInfo student={student} />
      <div className="rc-divider" />

      <div className="rc-body">
        {/* Left column: Subject tables */}
        <div className="rc-body-left">
          <SubjectTable title="Subject I" subjects={student.subjectsI || []} />
          <SubjectTable title="Subject II" subjects={student.subjectsII || []} />
          <RCFooterNotes />
        </div>

        {/* Right column: Attendance + Comments */}
        <div className="rc-body-right">
          <AttendanceTable attendance={student.attendance} />
          <div className="rc-comments-box">
            <div className="rc-comments-header">Teacher's Comments and Feedback</div>
            <p className="rc-comments-text">{student.comments}</p>
          </div>
        </div>
      </div>

      <RCSignatures />
      <div className="rc-divider" />
      <RCAddressBar />
      <div className="rc-page-number">Page {pageNum} of 2</div>
    </div>
  );
}

// ─── Page 2 ─────────────────────────────────────────────────────────────────

function Page2({ student }) {
  const honourCerts = student.certificates?.filter(c =>
    c.type.toLowerCase().includes("honour") || c.type.toLowerCase().includes("honor")
  ) || [];
  const otherCerts = student.certificates?.filter(c =>
    !c.type.toLowerCase().includes("honour") && !c.type.toLowerCase().includes("honor")
  ) || [];
  const servicePoints = student.servicePoints || [];

  return (
    <div className="rc-page rc-page-2">
      <RCHeader />
      <div className="rc-divider" />
      <RCStudentInfo student={student} />
      <div className="rc-divider" />

      <div className="rc-p2-body">
        {/* Service Points */}
        <div className="rc-p2-section">
          <div className="rc-p2-section-title">Service Points</div>
          {servicePoints.length > 0 ? (
            <table className="rc-p2-table">
              <thead>
                <tr>
                  <th>Activity / Service</th>
                  <th className="rc-p2-th-pts">Points</th>
                </tr>
              </thead>
              <tbody>
                {servicePoints.map((sp, i) => (
                  <tr key={i}>
                    <td>{sp.name}</td>
                    <td className="rc-p2-td-pts">{sp.points}</td>
                  </tr>
                ))}
                <tr className="rc-p2-total-row">
                  <td><strong>Total</strong></td>
                  <td className="rc-p2-td-pts"><strong>{servicePoints.reduce((a, b) => a + b.points, 0)}</strong></td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="rc-p2-empty">
              <p className="rc-p2-spaced-text">S &nbsp; e &nbsp; r &nbsp; v &nbsp; i &nbsp; c &nbsp; e &nbsp; &nbsp; P &nbsp; o &nbsp; i &nbsp; n &nbsp; t &nbsp; s</p>
            </div>
          )}
        </div>

        {/* Certificates */}
        <div className="rc-p2-section">
          <div className="rc-p2-section-title">Certificates</div>
          {student.certificates?.length > 0 ? (
            <table className="rc-p2-table">
              <thead>
                <tr>
                  <th>Certificate / Award</th>
                  <th>Type</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {student.certificates.map((cert, i) => (
                  <tr key={i}>
                    <td>{cert.name}</td>
                    <td>{cert.type}</td>
                    <td>{cert.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="rc-p2-empty">
              <p className="rc-p2-spaced-text">C &nbsp; e &nbsp; r &nbsp; t &nbsp; i &nbsp; f &nbsp; i &nbsp; c &nbsp; a &nbsp; t &nbsp; e &nbsp; s</p>
            </div>
          )}
        </div>
      </div>

      <RCSignatures />
      <div className="rc-divider" />
      <RCAddressBar />
      <div className="rc-page-number">Page 2 of 2</div>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function ReportCard({ student }) {
  return (
    <div className="rc-wrapper">
      <Page1 student={student} pageNum="1" />
      <div className="rc-page-break" />
      <Page2 student={student} />
    </div>
  );
}
