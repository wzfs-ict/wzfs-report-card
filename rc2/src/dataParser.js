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
      const score = scoreRaw === "" ? null : parseFloat(scoreRaw);
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
      const score = parseFloat(scoreRaw);
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
      const entry = { name: subName, score: score?parseFloat(score):null, behaviour: beh?parseInt(beh):null };
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
    const name = v(row,"nameofstudent","studentname","name");
    if (!name) continue;
    const key = name.trim();
    if (!map[key]) map[key] = [];
    map[key].push({
      type: v(row,"recognition","awardtype","certificate") || "Certificate",
      name: v(row,"event","awardname","award"),
      points: v(row,"points","servicepoints"),
      date: v(row,"date"),
    });
  }
  return map;
}

export function mergeStudentData(students, awardsMap) {
  return students.map(s => {
    // Try nick name, first name, full name
    const firstName = s.name.split(" ")[0];
    const awards = awardsMap[s.nickName] || awardsMap[s.name] || awardsMap[firstName] || [];
    return {
      ...s,
      certificates: awards.filter(a => !a.points || a.points===""),
      servicePoints: awards.filter(a => a.points && a.points!=="").map(a=>({name:a.name,points:Number(a.points)||0})),
    };
  });
}
