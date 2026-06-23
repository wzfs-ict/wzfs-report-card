// Subject type classification
const SUBJECT_II = [
  "pe","physical education","drama","orchestra","debate",
  "well-being","wellbeing","elective","sports","board games",
  "food tech","food technology","se","homeroom"
];

function getSubjectType(name) {
  const n = name.toLowerCase();
  return SUBJECT_II.some(k => n.includes(k)) ? "II" : "I";
}

function cleanName(raw) {
  return raw
    .replace(/_score$/i,"").replace(/_behaviour$/i,"").replace(/_behavior$/i,"")
    .replace(/([a-z])([A-Z])/g,"$1 $2")
    .replace(/_/g," ").trim();
}

function v(row, ...candidates) {
  for (const c of candidates) {
    const k = Object.keys(row).find(k => k.toLowerCase().replace(/[\s_-]/g,"").includes(c.toLowerCase().replace(/[\s_-]/g,"")));
    if (k !== undefined && row[k] !== "" && row[k] !== null && row[k] !== undefined) return String(row[k]).trim();
  }
  return "";
}

function parseWide(rows, meta) {
  return rows.map(row => {
    const keys = Object.keys(row);
    const rawName = v(row,"fullname","studentname","name");
    if (!rawName) return null;

    // Extract nick name from brackets e.g. "Hyunjeong Lim (Elena)"
    const nickMatch = rawName.match(/\(([^)]+)\)/);
    const cleanedName = rawName.replace(/\s*\([^)]*\)/,"").trim();
    const nickName = nickMatch ? nickMatch[1] : v(row,"calledname","nickname","englishname");

    const subjectsI = [], subjectsII = [];

    // Find all _Score columns
    const scoreCols = keys.filter(k => /_score$/i.test(k));
    for (const sc of scoreCols) {
      const base = sc.replace(/_score$/i,"");
      const displayName = cleanName(base);
      const bCol = keys.find(k => new RegExp("^"+base+"_beh","i").test(k));
      const scoreRaw = String(row[sc]).trim();
      if (scoreRaw === "" || scoreRaw === "0" && !bCol) continue;
      const score = scoreRaw === "" ? null : Math.round(parseFloat(scoreRaw));
      const bRaw = bCol ? String(row[bCol]).trim() : "";
      const behaviour = bRaw === "" ? null : parseInt(bRaw);
      const entry = { name: displayName, score: isNaN(score)?null:score, behaviour: isNaN(behaviour)?null:behaviour };
      getSubjectType(base) === "II" ? subjectsII.push(entry) : subjectsI.push(entry);
    }

    // Also handle "SubjectName_Mark" pattern
    const markCols = keys.filter(k => /_mark$/i.test(k) && !/_score$/i.test(k));
    for (const mc of markCols) {
      const base = mc.replace(/_mark$/i,"");
      const displayName = cleanName(base);
      const scoreRaw = String(row[mc]).trim();
      if (scoreRaw === "") continue;
      const score = Math.round(parseFloat(scoreRaw));
      const entry = { name: displayName, score: isNaN(score)?null:score, behaviour: null };
      getSubjectType(base) === "II" ? subjectsII.push(entry) : subjectsI.push(entry);
    }

    const att = {
      totalDays: parseInt(v(row,"totaldays","schooldays")) || "",
      daysPresent: parseInt(v(row,"dayspresent","present")) || "",
      authAbsences: parseInt(v(row,"authabsences","authorizedabsences")) || "",
      unauthAbsences: parseInt(v(row,"unauthabsences","unauthorizedabsences")) || "",
      daysTardy: parseInt(v(row,"daystardy","tardy")) || "",
    };
    const hasAtt = Object.values(att).some(x => x !== "");

    return {
      id: v(row,"studentid","id") || cleanedName,
      name: cleanedName,
      nickName,
      dob: v(row,"dob","dateofbirth"),
      grade: v(row,"grade") || meta.grade,
      advisor: v(row,"advisor","adviser","homeroom") || meta.advisor,
      department: v(row,"department","dept") || meta.department,
      gradingPeriod: v(row,"gradingperiod","semester","period") || meta.gradingPeriod,
      schoolYear: meta.schoolYear,
      subjectsI,
      subjectsII,
      homeroomComment: v(row,"homeroomcomment","classcomment","advisorcomment","teachercomment","comment"),
      attendance: hasAtt ? att : null,
      certificates: [],
      servicePoints: [],
    };
  }).filter(Boolean);
}

function parseLong(rows, meta) {
  const map = {};
  for (const row of rows) {
    const id = v(row,"studentid","id");
    const name = v(row,"studentname","name");
    const key = id || name;
    if (!key) continue;
    if (!map[key]) {
      map[key] = {
        id: key, name,
        nickName: v(row,"nickname","calledname","englishname"),
        dob: v(row,"dob","dateofbirth"),
        grade: v(row,"grade") || meta.grade,
        advisor: v(row,"advisor") || meta.advisor,
        department: v(row,"department") || meta.department,
        gradingPeriod: v(row,"gradingperiod","semester") || meta.gradingPeriod,
        schoolYear: meta.schoolYear,
        subjectsI: [], subjectsII: [],
        homeroomComment: "", attendance: null,
        certificates: [], servicePoints: [],
      };
    }
    const s = map[key];
    const comment = v(row,"teachercomments","comment","homeroomcomment");
    if (comment && !s.homeroomComment) s.homeroomComment = comment;
    const td = v(row,"totaldays","schooldays");
    if (!s.attendance && td) {
      s.attendance = {
        totalDays: parseInt(td)||"",
        daysPresent: parseInt(v(row,"dayspresent"))||"",
        authAbsences: parseInt(v(row,"authabsences","authorizedabsences"))||"",
        unauthAbsences: parseInt(v(row,"unauthabsences","unauthorizedabsences"))||"",
        daysTardy: parseInt(v(row,"daystardy","tardy"))||"",
      };
    }
    const subName = v(row,"subjectname","subject");
    if (subName) {
      const type = v(row,"subjecttype","type").toUpperCase();
      const score = v(row,"score","marks");
      const beh = v(row,"behaviour","behavior");
      const entry = { name: subName, score: score?Math.round(parseFloat(score)):null, behaviour: beh?parseInt(beh):null };
      (type==="II"||type==="2" ? s.subjectsII : s.subjectsI).push(entry);
    }
  }
  return Object.values(map);
}

export function parseMarksData(rows, meta={}) {
  if (!rows || rows.length===0) throw new Error("Marks file is empty.");
  const keys = Object.keys(rows[0]);
  const isWide = keys.some(k => /_score$/i.test(k) || /_mark$/i.test(k) || /_behaviour$/i.test(k));
  return isWide ? parseWide(rows, meta) : parseLong(rows, meta);
}

export function parseAwardsData(rows) {
  if (!rows || rows.length===0) return {};
  const map = {};

  for (const row of rows) {
    const keys = Object.keys(row);

    // Name column: try common header variants first, then fall back to
    // "the column right after Grade" or "the first text-heavy column" —
    // some award sheets (e.g. Pi Day) don't use a recognizable header at all.
    let name = v(row,"nameofstudent","name");
    if (!name) {
      const gradeIdx = keys.findIndex(k => /^grade$/i.test(k.trim()));
      if (gradeIdx !== -1 && keys[gradeIdx + 1]) {
        name = String(row[keys[gradeIdx + 1]] || "").trim();
      }
    }
    if (!name) continue;
    name = name.trim();
    if (!name) continue;

    const key = name;
    if (!map[key]) map[key] = [];

    // Event/Award title: try common headers, then fall back to "the column
    // right after the name column" so unlabeled sheets like Pi Day still work.
    let awardName = v(row,"event","award","certificate");
    if (!awardName) {
      const nameIdx = keys.findIndex(k => row[k] === name);
      if (nameIdx !== -1 && keys[nameIdx + 1]) {
        awardName = String(row[keys[nameIdx + 1]] || "").trim();
      }
    }
    if (!awardName) {
      const fallbackCol = keys.find(k => /winner|list|award|certificate/i.test(k) && k.toLowerCase()!=="grade");
      if (fallbackCol) awardName = String(row[fallbackCol]||"").trim();
    }
    if (!awardName) continue; // truly nothing to record for this row

    const recognition = v(row,"recognition","category","remark") || "Certificate of Recognition";
    const grade = v(row,"grade");
    const points = v(row,"points","servicepoints");

    map[key].push({
      type: recognition,
      name: awardName,
      points,
      date: v(row,"date"),
      grade,
    });
  }
  return map;
}

// Normalizes a name for comparison: lowercase, collapse whitespace, strip punctuation.
function normName(s) {
  return String(s||"").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,"").replace(/\s+/g," ").trim();
}

function normGrade(g) {
  // "6", "G6", "Grade 6" all become "6"
  return String(g||"").replace(/[^\d]/g,"").trim();
}

// Builds a lookup from normalized-name -> array of awards, so matching is
// case/spacing/punctuation insensitive instead of requiring exact equality.
function buildNormalizedAwardsIndex(awardsMap) {
  const index = {};
  for (const [rawName, awards] of Object.entries(awardsMap)) {
    const norm = normName(rawName);
    if (!index[norm]) index[norm] = [];
    index[norm].push(...awards);
  }
  return index;
}

export function mergeStudentData(students, awardsMap) {
  const normIndex = buildNormalizedAwardsIndex(awardsMap);

  return students.map(s => {
    const studentGrade = normGrade(s.grade);
    const fullNameNorm = normName(s.name);
    const nickNameNorm = normName(s.nickName);
    const firstNameNorm = normName(s.name.split(" ")[0]);
    // Reversed word order handles "Lee Seungyun" matching "Seungyun Lee"
    const reversedNameNorm = normName(s.name.split(" ").reverse().join(" "));

    let awards = [];
    let matchedByFirstNameOnly = false;

    if (nickNameNorm && normIndex[nickNameNorm]) {
      awards = normIndex[nickNameNorm];
    } else if (normIndex[fullNameNorm]) {
      awards = normIndex[fullNameNorm];
    } else if (normIndex[reversedNameNorm]) {
      awards = normIndex[reversedNameNorm];
    } else if (firstNameNorm && normIndex[firstNameNorm]) {
      awards = normIndex[firstNameNorm];
      matchedByFirstNameOnly = true;
    }

    // If matched by first name only (ambiguous — many students share first names),
    // narrow down using grade when the award row has grade info.
    if (matchedByFirstNameOnly && studentGrade) {
      const gradeFiltered = awards.filter(a => !a.grade || normGrade(a.grade) === studentGrade);
      if (gradeFiltered.length > 0) awards = gradeFiltered;
    }

    return {
      ...s,
      certificates: awards.filter(a => !a.points || a.points===""),
      servicePoints: awards.filter(a => a.points && a.points!=="").map(a=>({name:a.name,points:Number(a.points)||0})),
    };
  });
}
