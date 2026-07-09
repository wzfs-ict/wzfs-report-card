import xlsx from 'xlsx';
import path from 'path';
import {
  parseWithMergedHeaders,
  parseMarksData,
  parseAttendanceData,
  mergeAttendanceData,
  parseAwardsData,
} from './src/dataParser.js';

const attendancePath = path.resolve('C:/Users/WZFS_ICT/OneDrive - Weihai Zhongshi Foreign School/WZFS - All Staff - Staff Resources/Marks Entry - Sub Teachers/Spring 2026/Final/AttendanceData(Spring2026).xlsx');
const masterPaths = [
  'C:/Users/WZFS_ICT/OneDrive - Weihai Zhongshi Foreign School/WZFS - All Staff - Staff Resources/Marks Entry - Sub Teachers/Spring 2026/Final/G6_Spring2026_Master.xlsx',
  'C:/Users/WZFS_ICT/OneDrive - Weihai Zhongshi Foreign School/WZFS - All Staff - Staff Resources/Marks Entry - Sub Teachers/Spring 2026/Final/G7_Spring2026_Master.xlsx',
  'C:/Users/WZFS_ICT/OneDrive - Weihai Zhongshi Foreign School/WZFS - All Staff - Staff Resources/Marks Entry - Sub Teachers/Spring 2026/Final/G8_Spring2026_Master.xlsx',
  'C:/Users/WZFS_ICT/OneDrive - Weihai Zhongshi Foreign School/WZFS - All Staff - Staff Resources/Marks Entry - Sub Teachers/Spring 2026/Final/G9_Spring2026_Master.xlsx',
  'C:/Users/WZFS_ICT/OneDrive - Weihai Zhongshi Foreign School/WZFS - All Staff - Staff Resources/Marks Entry - Sub Teachers/Spring 2026/Final/G10_Spring2026_Master.xlsx',
  'C:/Users/WZFS_ICT/OneDrive - Weihai Zhongshi Foreign School/WZFS - All Staff - Staff Resources/Marks Entry - Sub Teachers/Spring 2026/Final/G11_Spring2026_Master.xlsx',
  'C:/Users/WZFS_ICT/OneDrive - Weihai Zhongshi Foreign School/WZFS - All Staff - Staff Resources/Marks Entry - Sub Teachers/Spring 2026/Final/ZSA_Spring2026_Master.xlsx',
];
const awardsPath = path.resolve('C:/Users/WZFS_ICT/OneDrive - Weihai Zhongshi Foreign School/Upper School - General/Spring 2026 Awards.xlsx');

function readSheetRows(filePath, sheetIndex = 0) {
  const wb = xlsx.readFile(filePath, { cellDates: true });
  const sheetName = wb.SheetNames[sheetIndex];
  const ws = wb.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(ws, { defval: '' });
}

function readMergedRows(filePath, sheetIndex = 0) {
  const wb = xlsx.readFile(filePath, { cellDates: true });
  const sheetName = wb.SheetNames[sheetIndex];
  const ws = wb.Sheets[sheetName];
  return parseWithMergedHeaders(ws);
}

function normName(s) {
  return String(s||'').toLowerCase().replace(/[^^\p{L}\p{N}\s]/gu,'').replace(/\s+/g,' ').trim();
}

function canonicalName(s) {
  return normName(s)
    .split(' ')
    .filter(Boolean)
    .map(w => ({ stefy:'stefania', stephania:'stefania', stef:'stefania', steph:'stefania' })[w] || w)
    .join(' ');
}

function canonicalFirstName(s) {
  const words = normName(s).split(' ').filter(Boolean);
  return words.length ? (({ stefy:'stefania', stephania:'stefania', stef:'stefania', steph:'stefania' })[words[0]] || words[0]) : '';
}

function normGrade(g) {
  const s = String(g||'').trim();
  if (/^zsa$/i.test(s.replace(/[\s_-]/g,''))) return 'ZSA';
  return s.replace(/[^\d]/g,'').trim();
}

function studentKeys(student) {
  const keys = new Set();
  const full = normName(student.name);
  if (full) keys.add(full);
  const canonical = canonicalName(student.name);
  if (canonical) keys.add(canonical);
  if (student.nickName) {
    const nick = normName(student.nickName);
    if (nick) keys.add(nick);
    const nickc = canonicalName(student.nickName);
    if (nickc) keys.add(nickc);
  }
  const first = normName(student.name).split(' ')[0] || '';
  if (first) keys.add(first);
  const firstc = canonicalFirstName(student.name);
  if (firstc) keys.add(firstc);
  const last = full.split(' ').slice(-1)[0] || '';
  if (last) keys.add(last);
  return [...keys];
}

function studentGradeKey(student) {
  return `${normGrade(student.grade)}`;
}

function matchAttendanceRow(row, students) {
  const id = String(row.studentid || row.id || '').replace(/\s/g,'').toUpperCase();
  if (id) {
    const byId = new Map(students.map(s => [String(s.id||s.studentId||'').replace(/\s/g,'').toUpperCase(), s]));
    if (byId.has(id)) return byId.get(id);
  }
  const fullName = normName(row.fullname || row.name || row.studentname || '');
  const calledName = normName(row.calledname || row.nickname || row.nick || '');
  const rowNames = [fullName, calledName].filter(Boolean);
  const rowCanon = rowNames.map(canonicalName).filter(Boolean);
  const rowFirst = [fullName, calledName].map(s => s.split(' ')[0]||'').filter(Boolean);
  const rowFirstCanon = rowNames.map(canonicalFirstName).filter(Boolean);
  const grade = normGrade(row.grade || row.class || row.yeargroup);
  for (const student of students) {
    const studGrade = normGrade(student.grade);
    if (grade && studGrade && grade !== studGrade) continue;
    const keys = studentKeys(student);
    if (rowNames.some(rn => keys.includes(rn)) || rowCanon.some(rc => keys.includes(rc)) || rowFirst.some(rf => keys.includes(rf)) || rowFirstCanon.some(rfc => keys.includes(rfc))) {
      return student;
    }
  }
  return null;
}

function parseAttendanceRows(filePath) {
  const wb = xlsx.readFile(filePath, { cellDates: true });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(ws, { defval: '' });
}

console.log('Attendance file:', attendancePath);
const attendanceRows = parseAttendanceRows(attendancePath);
console.log('Attendance rows read:', attendanceRows.length);
const attendanceMap = parseAttendanceData(attendanceRows);
console.log('Attendance byId keys:', attendanceMap.byId.size, 'byName keys:', attendanceMap.byName.size);

const allStudents = [];
for (const filePath of masterPaths) {
  const gradeLabel = path.basename(filePath).replace(/.*?(G\d+|ZSA).*/, '$1');
  const rows = readMergedRows(filePath);
  const students = parseMarksData(rows, { grade: gradeLabel });
  console.log(`\nMaster ${gradeLabel}: file=${filePath}`);
  console.log('  rows parsed:', rows.length, 'students:', students.length);
  const merged = mergeAttendanceData(students, attendanceMap);
  const matched = merged.filter(s => s.attendance && Object.values(s.attendance).some(v => v !== '')).length;
  console.log('  attendance matched students:', matched, 'unmatched:', students.length - matched);
  const unmatchedSamples = merged.filter(s => !s.attendance || !Object.values(s.attendance).some(v => v !== '')).slice(0, 20);
  if (unmatchedSamples.length > 0) {
    console.log('  some unmatched students:');
    unmatchedSamples.forEach(s => console.log(`    - ${s.name} | id=${s.id || ''} | grade=${s.grade}`));
  }
  allStudents.push(...students.map(s => ({ ...s, sourceGrade: gradeLabel })));
}

console.log(`\nTotal students across G6-G11+ZSA: ${allStudents.length}`);

const attendanceUnmatched = attendanceRows.filter(row => !matchAttendanceRow(row, allStudents));
console.log('Attendance rows with no student match:', attendanceUnmatched.length);
attendanceUnmatched.slice(0, 20).forEach((row, idx) => {
  const name = row.fullname || row.name || row.studentname || row.calledname || row.nickname || '';
  const id = row.studentid || row.id || '';
  console.log(`  [${idx}] ${name} | id=${id} | grade=${row.grade||row.class||row.yeargroup || ''}`);
});

console.log('\nAwards file:', awardsPath);
const awardsWb = xlsx.readFile(awardsPath, { cellDates: true });
let awardsRows = [];
for (const sheetName of awardsWb.SheetNames) {
  const ws = awardsWb.Sheets[sheetName];
  const rows = parseWithMergedHeaders(ws);
  awardsRows = awardsRows.concat(rows);
}
console.log('Awards rows read:', awardsRows.length);
const awardNameCounts = new Map();
for (const row of awardsRows) {
  const name = row.Name || row.name || row.StudentName || row['Name of Student'] || '';
  if (!name) continue;
  const norm = normName(name);
  awardNameCounts.set(norm, (awardNameCounts.get(norm) || 0) + 1);
}
console.log('Awards unique normalized names:', awardNameCounts.size);

const studentNameKeys = new Map();
for (const s of allStudents) {
  for (const key of studentKeys(s)) {
    if (!studentNameKeys.has(key)) studentNameKeys.set(key, []);
    studentNameKeys.get(key).push(`${s.name} [${s.sourceGrade}]`);
  }
}

const unmatchedAwardNames = [];
for (const [normNameKey, count] of awardNameCounts) {
  if (!studentNameKeys.has(normNameKey)) {
    unmatchedAwardNames.push({ name: normNameKey, count });
  }
}
console.log('Award names with no student key match:', unmatchedAwardNames.length);
unmatchedAwardNames.slice(0, 50).forEach(item => console.log(`  - ${item.name} (${item.count})`));

console.log('\nFinished coverage diagnostics.');
