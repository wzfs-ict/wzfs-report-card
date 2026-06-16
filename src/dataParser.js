// Flexible column name matching — handles variations in header naming
const findCol = (row, candidates) => {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const match = keys.find(k => k.trim().toLowerCase() === c.toLowerCase());
    if (match) return row[match];
  }
  return "";
};

export function parseMarksData(rawRows) {
  if (!rawRows || rawRows.length === 0) throw new Error("Marks file is empty.");

  const studentMap = {};

  for (const row of rawRows) {
    const id = String(findCol(row, ["StudentID", "Student ID", "ID", "student_id"]) || "").trim();
    const name = String(findCol(row, ["StudentName", "Student Name", "Name", "student_name"]) || "").trim();
    const key = id || name;
    if (!key) continue;

    if (!studentMap[key]) {
      studentMap[key] = {
        id: key,
        name,
        nickName: String(findCol(row, ["NickName", "Nick Name", "Nickname", "English Name", "nickname"]) || "").trim(),
        dob: String(findCol(row, ["DOB", "Date of Birth", "dob", "DateOfBirth"]) || "").trim(),
        grade: String(findCol(row, ["Grade", "grade"]) || "").trim(),
        advisor: String(findCol(row, ["Advisor", "Class Advisor", "HomeRoom", "advisor"]) || "").trim(),
        department: String(findCol(row, ["Department", "Dept", "department"]) || "").trim(),
        gradingPeriod: String(findCol(row, ["GradingPeriod", "Grading Period", "Period", "Semester"]) || "").trim(),
        subjectsI: [],
        subjectsII: [],
        attendance: null,
        comments: "",
      };
    }

    const s = studentMap[key];

    // Update name if we get a better version
    if (!s.name && name) s.name = name;

    // Attendance (take first non-empty value)
    const totalDays = findCol(row, ["TotalDays", "Total Days", "SchoolDays", "School Days"]);
    if (!s.attendance && (totalDays !== "" && totalDays !== undefined)) {
      s.attendance = {
        totalDays: Number(totalDays) || 0,
        daysPresent: Number(findCol(row, ["DaysPresent", "Days Present"])) || 0,
        authAbsences: Number(findCol(row, ["AuthAbsences", "Authorized Absences", "Auth Absences"])) || 0,
        unauthAbsences: Number(findCol(row, ["UnauthAbsences", "Unauthorized Absences", "Unauth Absences"])) || 0,
        daysTardy: Number(findCol(row, ["DaysTardy", "Days Tardy", "Tardy"])) || 0,
      };
    }

    // Comments
    const comments = String(findCol(row, ["TeacherComments", "Teacher Comments", "Comments", "Feedback", "Comment"]) || "").trim();
    if (comments && !s.comments) s.comments = comments;

    // Subject
    const subjectType = String(findCol(row, ["SubjectType", "Subject Type", "Type"]) || "").trim().toUpperCase();
    const subjectName = String(findCol(row, ["SubjectName", "Subject Name", "Subject"]) || "").trim();
    const score = findCol(row, ["Score", "Marks", "Mark", "Grade"]);
    const behaviour = findCol(row, ["Behaviour", "Behavior", "BehaviourScore"]);

    if (subjectName && subjectName.toLowerCase() !== "xx nothing follows xx") {
      const subjectEntry = {
        name: subjectName,
        score: score !== "" ? Number(score) : null,
        behaviour: behaviour !== "" ? Number(behaviour) : null,
      };

      if (subjectType === "II" || subjectType === "2") {
        s.subjectsII.push(subjectEntry);
      } else {
        s.subjectsI.push(subjectEntry);
      }
    }
  }

  return Object.values(studentMap);
}

export function parseAwardsData(rawRows) {
  if (!rawRows || rawRows.length === 0) return {};
  const awardsMap = {};

  for (const row of rawRows) {
    const id = String(findCol(row, ["StudentID", "Student ID", "ID"]) || "").trim();
    const name = String(findCol(row, ["StudentName", "Student Name", "Name"]) || "").trim();
    const key = id || name;
    if (!key) continue;

    if (!awardsMap[key]) awardsMap[key] = [];

    awardsMap[key].push({
      type: String(findCol(row, ["AwardType", "Award Type", "Type"]) || "").trim(),
      name: String(findCol(row, ["AwardName", "Award Name", "Award", "Certificate", "Honour"]) || "").trim(),
      points: findCol(row, ["Points", "ServicePoints", "Service Points"]),
      date: String(findCol(row, ["Date", "date"]) || "").trim(),
    });
  }

  return awardsMap;
}

export function mergeStudentData(students, awardsMap) {
  return students.map(s => {
    const awards = awardsMap[s.id] || awardsMap[s.name] || [];

    const certificates = awards.filter(a =>
      a.type.toLowerCase().includes("cert") || a.type.toLowerCase().includes("honour") || a.type.toLowerCase().includes("honor") || a.type === ""
    );
    const servicePoints = awards
      .filter(a => a.points !== "" && a.points !== undefined && a.points !== null)
      .map(a => ({ name: a.name, points: Number(a.points) || 0 }));

    return { ...s, certificates, servicePoints };
  });
}
