import * as XLSX from "xlsx";

// Subject type classification — Subject II is extracurricular only; everything
// else (including Chinese) defaults to Subject I (academic).
const SUBJECT_II = [
  "pe","physical education","drama","orchestra","debate",
  "well-being","wellbeing","pshe","careers","elective","ecc",
  "sports","board games","food tech","food technology","homeroom"
];

// parseInt with proper zero-preservation. `parseInt("0") || ""` incorrectly
// returns "" because 0 is falsy. This returns 0 as 0 and blank/NaN as "".
function intAttVal(raw) {
  const n = parseInt(String(raw ?? "").trim(), 10);
  return isNaN(n) ? "" : n;
}

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

// Normalizes a raw DOB cell value into a consistent "mm/dd/yyyy" string.
// Handles three cases seen from real Excel/WPS imports:
//  1. Excel date-serial numbers (e.g. 41154) — happens when the source cell
//     is a genuine Excel "Date" type cell; SheetJS reads it as a raw number.
//  2. Already-formatted date strings — "9/2/2012", "09/02/2012", "2012-09-02".
//  3. Anything unrecognized is returned as-is rather than dropped, so a
//     typo'd or unusual entry is still visible (and fixable) rather than lost.

function normalizeDob(raw) {
  const str = String(raw ?? "").trim();
  if (str === "") return "";

  // Case 1: pure number -> Excel date serial (epoch Dec 30 1899)
  if (/^\d+(\.\d+)?$/.test(str)) {
    const serial = parseFloat(str);
    if (serial > 0 && serial < 60000) { // sane bounds for a student's DOB
      const utcDays = Math.floor(serial - 25569);
      const d = new Date(utcDays * 86400 * 1000);
      return `${d.getUTCMonth()+1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
    }
  }

  // Case 2: mm/dd/yyyy or mm-dd-yyyy
  let m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return `${parseInt(m[1],10)}/${parseInt(m[2],10)}/${m[3]}`;

  // Case 3: yyyy-mm-dd or yyyy/mm/dd
  m = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m) return `${parseInt(m[2],10)}/${parseInt(m[3],10)}/${m[1]}`;

  return str; // unrecognized format — show as-is rather than discard
}

export function parseWithMergedHeaders(sheet) {
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", blankrows: false });
  const idPatterns = /student.?id|full.?name|student.?name|^name$|^id$/i;
  const subPatterns = /^score$|^behaviour$|^behavior$|^type$/i;

  let subRowIdx = -1;
  for (let i = 0; i < Math.min(5, raw.length); i++) {
    const row = raw[i] || [];
    const subCount = row.filter(cell => subPatterns.test(String(cell).trim())).length;
    if (subCount >= 2) { subRowIdx = i; break; }
  }

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

  const groupRow = raw[subRowIdx - 1] || [];
  const subRow = raw[subRowIdx] || [];
  const compoundHeaders = [];
  let lastGroup = "";

  for (let c = 0; c < subRow.length; c++) {
    const subLabel = String(subRow[c] || "").trim();
    const groupLabel = String(groupRow[c] || "").trim();
    if (groupLabel) lastGroup = groupLabel;
    if (subPatterns.test(subLabel)) {
      const normalized = /behavior/i.test(subLabel) ? "Behaviour" : subLabel;
      compoundHeaders.push(`${lastGroup}_${normalized}`);
    } else {
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
      const baseEsc = base.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
      const bCol = keys.find(k => new RegExp("^"+baseEsc+"_beh","i").test(k));
      // Some subjects (e.g. Chinese) carry a per-student "Type" column instead of
      // a fixed subject name — e.g. "Chinese Elementary Class A-1". When present,
      // use that as the displayed subject name instead of the generic group title.
      // Falls back to a bare "Type" column (unprefixed) for the Chinese group
      // specifically, in case the source file's header merge isn't recognized.
      const tCol = keys.find(k => new RegExp("^"+baseEsc+"_type$","i").test(k))
        || (/chinese/i.test(base) ? keys.find(k => /^type$/i.test(k.trim())) : undefined);
      const typeRaw = tCol ? String(row[tCol]).trim() : "";
      const displayName = typeRaw || cleanName(base);
      const scoreRaw = String(row[sc]).trim();
      const bRaw = bCol ? String(row[bCol]).trim() : "";
      // Only drop this subject for this student if there's truly no data at
      // all (no score AND no behaviour). If either is present, keep it.
      if (scoreRaw === "" && bRaw === "") continue;
      const score = scoreRaw === "" ? null : Math.round(parseFloat(scoreRaw));
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
      totalDays: intAttVal(v(row,"totaldays","schooldays")),
      daysPresent: intAttVal(v(row,"dayspresent","present")),
      authAbsences: intAttVal(v(row,"authabsences","authorizedabsences")),
      unauthAbsences: intAttVal(v(row,"unauthabsences","unauthorizedabsences")),
      daysTardy: intAttVal(v(row,"daystardy","tardy")),
    };
    const hasAtt = Object.values(att).some(x => x !== "");

    return {
      id: v(row,"studentid","id") || cleanedName,
      name: cleanedName,
      nickName,
      dob: normalizeDob(v(row,"dob","dateofbirth")),
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
        dob: normalizeDob(v(row,"dob","dateofbirth")),
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
        totalDays: intAttVal(td),
        daysPresent: intAttVal(v(row,"dayspresent")),
        authAbsences: intAttVal(v(row,"authabsences","authorizedabsences")),
        unauthAbsences: intAttVal(v(row,"unauthabsences","unauthorizedabsences")),
        daysTardy: intAttVal(v(row,"daystardy","tardy")),
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
    let name = v(row,"nameofstudent","studentname","name");
    if (!name) {
      // Handles "Grade", "Class", "G6"–"G12"-style column headers
      const gradeIdx = keys.findIndex(k => {
        const n = k.toLowerCase().replace(/[\s_-]/g,"");
        return n === "grade" || n === "class" || /^g\d{1,2}$/.test(n) || n.startsWith("grade");
      });
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
    let awardName = v(row,"event","award","certificate","service","servicepoint");
    if (!awardName) {
      const nameIdx = keys.findIndex(k => row[k] === name);
      if (nameIdx !== -1 && keys[nameIdx + 1]) {
        awardName = String(row[keys[nameIdx + 1]] || "").trim();
      }
    }
    if (!awardName) {
      const fallbackCol = keys.find(k => /winner|list|award|certificate|service|activity/i.test(k) && k.toLowerCase()!=="grade");
      if (fallbackCol) awardName = String(row[fallbackCol]||"").trim();
    }
    if (!awardName) continue; // truly nothing to record for this row

    const recognition = v(row,"recognition","category","remark","type") || "Certificate of Recognition";
    // Grade column: match "Grade", "Class", "G6"-"G12"-style headers, or "YearGroup"
    const grade = v(row,"grade","class","yeargroup") || (() => {
      const gk = Object.keys(row).find(k => /^g\d{1,2}$|^grade\d{1,2}$/i.test(k.trim()));
      return gk ? String(row[gk]||"").trim() : "";
    })();
    const points = v(row,"points","servicepoints","service point");

    // Achievement-level values (Gold/Silver/Bronze etc.) in the category/recognition
    // column indicate a service-points entry — e.g. "Parent Involvement | Gold".
    // Pure certificate descriptions like "Certificate of Recognition" stay as-is
    // and route to the Certificates section instead.
    const achievementRx = /^(gold|silver|bronze|platinum|merit|pass|distinction)$/i;
    const effectivePoints = points || (achievementRx.test(recognition.trim()) ? recognition.trim() : "");
    const effectiveRecognition = achievementRx.test(recognition.trim()) ? "Certificate of Recognition" : recognition;

    map[key].push({
      type: effectiveRecognition,
      name: awardName,
      points: effectivePoints,
      date: v(row,"date"),
      grade,
    });
  }
  return map;
}

// Normalizes a name for comparison: lowercase, collapse whitespace, strip punctuation.
function normName(s) {
  return String(s||"").toLowerCase().replace(/[^^\p{L}\p{N}\s]/gu,"").replace(/\s+/g," ").trim();
}

const NAME_ALIASES = {
  stefy: "stefania",
  stephania: "stefania",
  stefania: "stefania",
  steph: "stefania",
  stef: "stefania",
};

function canonicalName(s) {
  return normName(s)
    .split(" ")
    .filter(Boolean)
    .map(w => NAME_ALIASES[w] || w)
    .join(" ");
}

function canonicalFirstName(s) {
  const words = normName(s).split(" ").filter(Boolean);
  return words.length ? (NAME_ALIASES[words[0]] || words[0]) : "";
}

function normGrade(g) {
  const s = String(g||"").trim();
  if (/^zsa$/i.test(s.replace(/[\s_-]/g,""))) return "ZSA";
  // "6", "G6", "Grade 6" all become "6"
  return s.replace(/[^\d]/g,"").trim();
}

// Builds a lookup from normalized-name -> array of awards, so matching is
// case/spacing/punctuation insensitive instead of requiring exact equality.
function buildNormalizedAwardsIndex(awardsMap) {
  const index = {};
  const addEntry = (key, awards) => {
    if (!key) return;
    if (!index[key]) index[key] = [];
    index[key].push(...awards);
  };
  for (const [rawName, awards] of Object.entries(awardsMap)) {
    const nameNorm = normName(rawName);
    const nameCanon = canonicalName(rawName);
    addEntry(nameNorm, awards);
    if (nameCanon && nameCanon !== nameNorm) addEntry(nameCanon, awards);

    const pm = rawName.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if (pm) {
      const baseNorm = normName(pm[1]);
      const baseCanon = canonicalName(pm[1]);
      const callNorm = normName(pm[2]);
      const callCanon = canonicalName(pm[2]);
      addEntry(baseNorm, awards);
      if (baseCanon && baseCanon !== baseNorm) addEntry(baseCanon, awards);
      addEntry(callNorm, awards);
      if (callCanon && callCanon !== callNorm) addEntry(callCanon, awards);
    }
  }
  return index;
}

export function mergeStudentData(students, awardsMap) {
  const normIndex = buildNormalizedAwardsIndex(awardsMap);

  return students.map(s => {
    const studentGrade = normGrade(s.grade);
    const fullNameNorm = normName(s.name);
    const fullNameCanon = canonicalName(s.name);
    const nickNameNorm = normName(s.nickName);
    const nickNameCanon = canonicalName(s.nickName);
    const nameWords = normName(s.name).split(/\s+/).filter(Boolean);
    const firstNameNorm = nameWords[0] || "";
    const firstNameCanon = canonicalFirstName(s.name);
    const lastNameNorm  = nameWords[nameWords.length - 1] || "";
    const reversedNameNorm = normName([...nameWords].reverse().join(" "));

    let awards = [];
    let matchedByFirstNameOnly = false;

    if (nickNameNorm && normIndex[nickNameNorm]) {
      // Called name match (most specific — e.g. "Noah")
      awards = normIndex[nickNameNorm];
    } else if (nickNameCanon && normIndex[nickNameCanon]) {
      awards = normIndex[nickNameCanon];
    } else if (normIndex[fullNameNorm]) {
      // Full name exact match (e.g. "Hee Im")
      awards = normIndex[fullNameNorm];
    } else if (fullNameCanon && normIndex[fullNameCanon]) {
      awards = normIndex[fullNameCanon];
    } else if (normIndex[reversedNameNorm]) {
      // Reversed order match (Korean family-name-first → Western order)
      awards = normIndex[reversedNameNorm];
    } else if (nickNameNorm && lastNameNorm && normIndex[`${nickNameNorm} ${lastNameNorm}`]) {
      // Called name + family name (e.g. awards file has "Noah Kim" but called name is "Noah")
      awards = normIndex[`${nickNameNorm} ${lastNameNorm}`];
    } else if (firstNameNorm && normIndex[firstNameNorm]) {
      // Given name only — ambiguous, grade filter below will disambiguate
      awards = normIndex[firstNameNorm];
      matchedByFirstNameOnly = true;
    } else if (firstNameCanon && normIndex[firstNameCanon]) {
      awards = normIndex[firstNameCanon];
      matchedByFirstNameOnly = true;
    } else if (lastNameNorm && normIndex[lastNameNorm] && nameWords.length > 1) {
      // Family name only as last resort
      awards = normIndex[lastNameNorm];
      matchedByFirstNameOnly = true;
    }

    // Always narrow by grade when the award row carries grade info — this
    // prevents students sharing a called name (e.g. "Noah") across different
    // grades from picking up each other's awards.
    // The guard `gradeFiltered.length > 0` ensures we never accidentally drop
    // all awards on sheets that omit the grade column entirely.
    if (studentGrade && awards.length > 0) {
      const gradeFiltered = awards.filter(a => !a.grade || normGrade(a.grade) === studentGrade);
      if (gradeFiltered.length > 0) awards = gradeFiltered;
    }

    return {
      ...s,
      certificates: dedupeAwards(
        awards.filter(a => !a.points || a.points===""),
        a => `${normName(a.name)}|${normName(a.type)}`
      ),
      servicePoints: dedupeAwards(
        awards.filter(a => a.points && a.points!=="").map(a => {
          const n = Number(a.points);
          return { name: a.name, points: isNaN(n) ? a.points : n };
          // Preserves text values like "Gold", "Silver", "Bronze" as-is,
          // while still converting numeric strings like "16" to the number 16.
        }),
        a => `${normName(a.name)}|${String(a.points).toLowerCase()}`
      ),
    };
  });
}

// Removes duplicate award entries — the same certificate or service point
// can end up listed twice when a student appears in more than one tab of
// the awards workbook with an identical entry. Keeps the first occurrence
// and its original order; `keyFn` decides what counts as "the same award".
function dedupeAwards(list, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

// ─── Attendance data parser ───────────────────────────────────────────────────
// Accepts a flat Excel/CSV with one row per student.
// Column names are fuzzy-matched so teachers can use natural headings.
// Returns a Map keyed by Student_ID (preferred) or normalised name (fallback).
export function parseAttendanceData(rows) {
  const byId = new Map();
  // byName maps normalized-name -> array of { grade: normalizedGrade, att }
  const byName = new Map();

  for (const row of rows) {
    const id = v(row,"studentid","id").replace(/\s/g,"");
    const fullName = v(row,"fullname","name","studentname");
    const calledName = v(row,"calledname","nickname","nick");
    const gradeRaw = v(row,"grade","class","yeargroup");
    const gradeNorm = normGrade(gradeRaw);
    const fullNameCanon = canonicalName(fullName);
    const calledNameCanon = canonicalName(calledName);

    const att = {
      totalDays:     intAttVal(v(row,"totaldays","schooldays","totalnumberofschooldays")),
      daysPresent:   intAttVal(v(row,"dayspresent","present","presentdays")),
      authAbsences:  intAttVal(v(row,"authorizedabsences","authabs","authorised","authorized")),
      unauthAbsences:intAttVal(v(row,"unauthorizedabsences","unauthabs","unauthorised","unauthorized")),
      daysTardy:     intAttVal(v(row,"daystardy","tardy","late")),
    };

    // Only store rows that actually have some attendance data
    const hasData = Object.values(att).some(x => x !== "");
    if (!hasData) continue;

    if (id) byId.set(id.toUpperCase(), att);

    if (fullName) {
      const k = normName(fullName);
      const kc = fullNameCanon;
      const firstNorm = (normName(fullName).split(/\s+/)[0] || "");
      const firstCanon = canonicalFirstName(fullName);
      if (!byName.has(k)) byName.set(k, []);
      byName.get(k).push({ grade: gradeNorm, att });
      if (kc && kc !== k) {
        if (!byName.has(kc)) byName.set(kc, []);
        byName.get(kc).push({ grade: gradeNorm, att });
      }
      if (firstNorm && firstNorm !== k) {
        if (!byName.has(firstNorm)) byName.set(firstNorm, []);
        byName.get(firstNorm).push({ grade: gradeNorm, att });
      }
      if (firstCanon && firstCanon !== firstNorm) {
        if (!byName.has(firstCanon)) byName.set(firstCanon, []);
        byName.get(firstCanon).push({ grade: gradeNorm, att });
      }
    }
    if (calledName) {
      const k = normName(calledName);
      const kc = calledNameCanon;
      const firstNorm = (normName(calledName).split(/\s+/)[0] || "");
      const firstCanon = canonicalFirstName(calledName);
      if (!byName.has(k)) byName.set(k, []);
      byName.get(k).push({ grade: gradeNorm, att });
      if (kc && kc !== k) {
        if (!byName.has(kc)) byName.set(kc, []);
        byName.get(kc).push({ grade: gradeNorm, att });
      }
      if (firstNorm && firstNorm !== k) {
        if (!byName.has(firstNorm)) byName.set(firstNorm, []);
        byName.get(firstNorm).push({ grade: gradeNorm, att });
      }
      if (firstCanon && firstCanon !== firstNorm) {
        if (!byName.has(firstCanon)) byName.set(firstCanon, []);
        byName.get(firstCanon).push({ grade: gradeNorm, att });
      }
    }
  }
  return { byId, byName };
}

// Merges parsed attendance data into the student array.
// Joins by Student_ID first (exact), then falls back to name+grade matching.
// Individual student's existing attendance values take priority over the
// imported data (so manual edits in the app are never overwritten).
export function mergeAttendanceData(students, attendanceMap) {
  const { byId, byName } = attendanceMap;
  return students.map(s => {
    const existing = s.attendance || {};
    // Try ID match first
    const id = (s.id || s.studentId || "").replace(/\s/g,"").toUpperCase();
    let imported = (id && byId.get(id)) || null;
    // Fall back to name match (prefer exact nameKey or calledNameKey),
    // but if multiple candidate rows exist, prefer one whose grade matches.
    if (!imported) {
      const nameKey = normName(s.nickName || s.name || "");
      const fullKey = normName(s.name || "");
      const nameKeyCanon = canonicalName(s.nickName || s.name || "");
      const fullKeyCanon = canonicalName(s.name || "");
      const firstNameCanon = canonicalFirstName(s.nickName || s.name || "");
      const firstNameNorm = (normName(s.nickName || s.name || "").split(/\s+/)[0] || "");
      const keysToTry = [nameKey, nameKeyCanon, fullKey, fullKeyCanon, firstNameCanon, firstNameNorm];
      const candidates = [];
      for (const k of keysToTry) {
        if (!k) continue;
        const arr = byName.get(k);
        if (arr) candidates.push(...arr);
      }
      if (candidates.length > 0) {
        const studentGrade = normGrade(s.grade);
        // Prefer candidate with matching grade (or blank grade in source)
        let match = null;
        if (studentGrade) {
          match = candidates.find(c => !c.grade || c.grade === studentGrade);
        }
        if (!match) match = candidates[0];
        imported = match ? match.att : null;
      } else {
        imported = null;
      }
    }
    if (!imported) return s;
    // Merge: imported values fill empty slots; existing (manually entered) values win
    const merged = { ...imported };
    for (const k of Object.keys(merged)) {
      if (existing[k] !== "" && existing[k] !== null && existing[k] !== undefined) {
        merged[k] = existing[k];
      }
    }
    return { ...s, attendance: { ...existing, ...merged } };
  });
}

