// ─── WIDE FORMAT PARSER ──────────────────────────────────────────────────────
// The marks CSV has ONE ROW per student, with subjects as columns:
// SubjectName_Score, SubjectName_Behaviour, SubjectName_Comment
//
// Subject type mapping — determines Subject I (Academic) vs Subject II (Extracurricular)
const SUBJECT_TYPE_MAP = {
  // Subject I — Academic
  "english lang": "I", "english lit": "I", "english": "I",
  "grammar": "I", "writtencomm": "I", "written comm": "I", "written communication": "I",
  "readingfluency": "I", "reading fluency": "I",
  "maths": "I", "math": "I", "mathematics": "I",
  "science": "I", "socialstudies": "I", "social studies": "I",
  "ict": "I", "literature": "I", "lit": "I",
  "chinese": "I", "esl science": "I", "esl": "I",
  // Subject II — Extracurricular
  "drama": "II", "pe": "II", "physical education": "II",
  "se": "II", "sports elective": "II", "elective sports": "II", "elecsports": "II",
  "debate": "II", "orchestra": "II", "well-being": "II", "wellbeing": "II",
  "elective": "II", "elective- td": "II", "elective td": "II",
  "board games": "II", "food technology": "II", "food tech": "II",
};

function getSubjectType(name) {
  const lower = name.toLowerCase().trim();
  for (const [key, type] of Object.entries(SUBJECT_TYPE_MAP)) {
    if (lower.includes(key)) return type;
  }
  return "I"; // default to academic
}

// Clean display name for subjects
function cleanSubjectName(raw) {
  return raw
    .replace(/elective-\s*td/i, "Elective (Tech & Design)")
    .replace(/elective\s*sports?/i, "Elective (Sports)")
    .replace(/elecsports/i, "Elective (Sports)")
    .replace(/writtencomm/i, "Written Communication")
    .replace(/readingfluency/i, "Reading Fluency")
    .replace(/socialstudies/i, "Social Studies")
    .replace(/english\s*lang/i, "English Language")
    .replace(/english\s*lit/i, "English Literature")
    .replace(/_/g, " ")
    .trim();
}

export function parseMarksData(rawRows, metaOverrides = {}) {
  if (!rawRows || rawRows.length === 0) throw new Error("Marks file is empty.");

  // Detect format: wide (one row per student) vs long (one row per subject)
  const firstRow = rawRows[0];
  const keys = Object.keys(firstRow);

  // Wide format detection: has columns ending in _Score
  const isWide = keys.some(k => k.toLowerCase().endsWith("_score") || k.toLowerCase().endsWith("_behaviour"));

  if (isWide) {
    return parseWideFormat(rawRows, metaOverrides);
  } else {
    return parseLongFormat(rawRows, metaOverrides);
  }
}

function parseWideFormat(rows, metaOverrides) {
  const students = [];

  for (const row of rows) {
    const keys = Object.keys(row);

    // Find student ID and name columns (flexible)
    const idCol = keys.find(k => /student.?id|^id$/i.test(k));
    const nameCol = keys.find(k => /full.?name|student.?name|^name$/i.test(k));
    const calledCol = keys.find(k => /called.?name|nick.?name|english.?name/i.test(k));
    const dobCol = keys.find(k => /dob|date.?of.?birth/i.test(k));
    const gradeCol = keys.find(k => /^grade$/i.test(k));
    const advisorCol = keys.find(k => /advisor|adviser|homeroom/i.test(k));
    const deptCol = keys.find(k => /department|dept/i.test(k));
    const periodCol = keys.find(k => /grading.?period|semester|period/i.test(k));
    const commentCol = keys.find(k => /homeroom.?comment|class.?comment|advisor.?comment|^comment$/i.test(k));
    const attendTotalCol = keys.find(k => /total.?days|school.?days/i.test(k));
    const attendPresentCol = keys.find(k => /days.?present|present/i.test(k));
    const attendAuthCol = keys.find(k => /auth.?absence/i.test(k));
    const attendUnauthCol = keys.find(k => /unauth.?absence/i.test(k));
    const attendTardyCol = keys.find(k => /tardy/i.test(k));

    const id = String(row[idCol] || "").trim();
    const name = String(row[nameCol] || "").trim();
    if (!id && !name) continue;

    // Extract subjects from _Score columns
    const subjectsI = [];
    const subjectsII = [];
    const subjectComments = {}; // per-subject comments for editor

    // Find all score columns
    const scoreCols = keys.filter(k => /_score$/i.test(k));

    for (const scoreCol of scoreCols) {
      // Derive base name: e.g. "Maths_Score" → "Maths"
      const base = scoreCol.replace(/_score$/i, "").trim();
      if (!base) continue;

      const behaviourCol = keys.find(k => k.toLowerCase() === (base + "_behaviour").toLowerCase() ||
        k.toLowerCase() === (base.replace(/\s/g, "") + "_behaviour").toLowerCase() ||
        k.toLowerCase().includes(base.toLowerCase()) && k.toLowerCase().includes("behaviour")
      );
      const subjectCommentCol = keys.find(k =>
        k.toLowerCase() === (base + "_comment").toLowerCase() ||
        (k.toLowerCase().includes(base.toLowerCase()) && k.toLowerCase().includes("comment"))
      );

      const scoreRaw = String(row[scoreCol] || "").trim();
      const score = (scoreRaw === "" || scoreRaw.toUpperCase() === "N/A" || scoreRaw === "NA")
        ? null : parseFloat(scoreRaw);
      if (score === null && !scoreRaw) continue; // skip truly empty subjects

      const behaviourRaw = behaviourCol ? String(row[behaviourCol] || "").trim() : "";
      const behaviour = (behaviourRaw === "" || behaviourRaw.toUpperCase() === "N/A" || behaviourRaw === "NA")
        ? null : parseInt(behaviourRaw);

      const subComment = subjectCommentCol ? String(row[subjectCommentCol] || "").trim() : "";
      const displayName = cleanSubjectName(base);
      const type = getSubjectType(base);

      const entry = { name: displayName, score, behaviour, comment: subComment };
      subjectComments[displayName] = subComment;

      if (type === "II") subjectsII.push(entry);
      else subjectsI.push(entry);
    }

    // Handle behaviour_score as a separate general behaviour
    const behaviourScoreCol = keys.find(k => /^behaviour\s*score|^behavior\s*score/i.test(k));
    const generalBehaviour = behaviourScoreCol ? parseInt(row[behaviourScoreCol]) || null : null;

    // Homeroom comment
    const homeroomComment = commentCol ? String(row[commentCol] || "").trim() : "";

    students.push({
      id: id || name,
      name: name.replace(/\s*\(.*?\)\s*/g, "").trim(), // strip "(Elena)" from name col if present
      nickName: (() => {
        // Try dedicated col first
        if (calledCol && row[calledCol]) return String(row[calledCol]).trim();
        // Otherwise try to extract from name like "Hyunjeong Lim (Elena)"
        const match = name.match(/\(([^)]+)\)/);
        return match ? match[1] : "";
      })(),
      dob: dobCol ? String(row[dobCol] || "").trim() : "",
      grade: gradeCol ? String(row[gradeCol] || "").trim() : (metaOverrides.grade || ""),
      advisor: advisorCol ? String(row[advisorCol] || "").trim() : (metaOverrides.advisor || "Mr. Glen Joshua"),
      department: deptCol ? String(row[deptCol] || "").trim() : (metaOverrides.department || "Middle School"),
      gradingPeriod: periodCol ? String(row[periodCol] || "").trim() : (metaOverrides.gradingPeriod || "Spring Semester"),
      subjectsI,
      subjectsII,
      subjectComments,
      generalBehaviour,
      homeroomComment,
      attendance: attendTotalCol ? {
        totalDays: parseInt(row[attendTotalCol]) || "",
        daysPresent: parseInt(row[attendPresentCol]) || "",
        authAbsences: parseInt(row[attendAuthCol]) || "",
        unauthAbsences: parseInt(row[attendUnauthCol]) || "",
        daysTardy: parseInt(row[attendTardyCol]) || "",
      } : null,
      certificates: [],
      servicePoints: [],
    });
  }

  return students;
}

function parseLongFormat(rows, metaOverrides) {
  // Existing long-format parser (one row per subject)
  const studentMap = {};
  const findCol = (row, candidates) => {
    const keys = Object.keys(row);
    for (const c of candidates) {
      const match = keys.find(k => k.trim().toLowerCase() === c.toLowerCase());
      if (match !== undefined) return row[match];
    }
    return "";
  };

  for (const row of rows) {
    const id = String(findCol(row, ["StudentID","Student ID","ID"]) || "").trim();
    const name = String(findCol(row, ["StudentName","Student Name","Name"]) || "").trim();
    const key = id || name;
    if (!key) continue;

    if (!studentMap[key]) {
      studentMap[key] = {
        id: key, name,
        nickName: String(findCol(row, ["NickName","Nick Name","Called Name"]) || "").trim(),
        dob: String(findCol(row, ["DOB","Date of Birth"]) || "").trim(),
        grade: String(findCol(row, ["Grade"]) || metaOverrides.grade || "").trim(),
        advisor: String(findCol(row, ["Advisor","Class Advisor"]) || metaOverrides.advisor || "Mr. Glen Joshua").trim(),
        department: String(findCol(row, ["Department"]) || metaOverrides.department || "Middle School").trim(),
        gradingPeriod: String(findCol(row, ["GradingPeriod","Grading Period","Semester"]) || metaOverrides.gradingPeriod || "Spring Semester").trim(),
        subjectsI: [], subjectsII: [], subjectComments: {},
        homeroomComment: "", attendance: null, certificates: [], servicePoints: [],
      };
    }
    const s = studentMap[key];
    const comments = String(findCol(row, ["TeacherComments","Teacher Comments","HomeroomComment"]) || "").trim();
    if (comments && !s.homeroomComment) s.homeroomComment = comments;

    const totalDays = findCol(row, ["TotalDays","Total Days"]);
    if (!s.attendance && totalDays !== "") {
      s.attendance = {
        totalDays: Number(totalDays)||"", daysPresent: Number(findCol(row,["DaysPresent","Days Present"]))||"",
        authAbsences: Number(findCol(row,["AuthAbsences","Authorized Absences"]))||"",
        unauthAbsences: Number(findCol(row,["UnauthAbsences","Unauthorized Absences"]))||"",
        daysTardy: Number(findCol(row,["DaysTardy","Days Tardy"]))||"",
      };
    }
    const subjectName = String(findCol(row,["SubjectName","Subject Name","Subject"])||"").trim();
    const subjectType = String(findCol(row,["SubjectType","Subject Type","Type"])||"").trim().toUpperCase();
    const score = findCol(row,["Score","Marks"]);
    const behaviour = findCol(row,["Behaviour","Behavior"]);
    if (subjectName) {
      const entry = { name: subjectName, score: score!==""?Number(score):null, behaviour: behaviour!==""?Number(behaviour):null, comment:"" };
      if (subjectType==="II"||subjectType==="2") s.subjectsII.push(entry);
      else s.subjectsI.push(entry);
    }
  }
  return Object.values(studentMap);
}

export function parseAwardsData(rawRows) {
  if (!rawRows || rawRows.length === 0) return {};
  const awardsMap = {};

  const findCol = (row, candidates) => {
    const keys = Object.keys(row);
    for (const c of candidates) {
      const match = keys.find(k => k.trim().toLowerCase().includes(c.toLowerCase()));
      if (match !== undefined) return row[match];
    }
    return "";
  };

  for (const row of rawRows) {
    const name = String(findCol(row, ["name of student","student name","name"]) || "").trim();
    const grade = String(findCol(row, ["grade"]) || "").trim();
    const event = String(findCol(row, ["event"]) || "").trim();
    const recognition = String(findCol(row, ["recognition","award","certificate"]) || "").trim();
    const points = findCol(row, ["points","service points"]);

    if (!name) continue;
    if (!awardsMap[name]) awardsMap[name] = [];
    awardsMap[name].push({ type: recognition || "Certificate", name: event, points: points || "", date: "" });
  }
  return awardsMap;
}

export function mergeStudentData(students, awardsMap) {
  return students.map(s => {
    // Match by called name, first name, or full name
    const firstName = s.name.split(" ")[0];
    const awards = awardsMap[s.nickName] || awardsMap[s.name] || awardsMap[firstName] || [];
    return {
      ...s,
      certificates: awards.filter(a => !a.points || a.points === ""),
      servicePoints: awards.filter(a => a.points && a.points !== "").map(a => ({ name: a.name, points: Number(a.points)||0 })),
    };
  });
}
