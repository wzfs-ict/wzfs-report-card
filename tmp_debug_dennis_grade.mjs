import xlsx from 'xlsx';
import path from 'path';
import {
  parseWithMergedHeaders,
  parseMarksData,
  parseAwardsData,
  mergeStudentData,
} from './src/dataParser.js';

const awardPath = path.resolve('C:/Users/WZFS_ICT/OneDrive - Weihai Zhongshi Foreign School/Upper School - General/Spring 2026 Awards.xlsx');
const g7Path = path.resolve('C:/Users/WZFS_ICT/OneDrive - Weihai Zhongshi Foreign School/WZFS - All Staff - Staff Resources/Marks Entry - Sub Teachers/Spring 2026/Final/G7_Spring2026_Master.xlsx');
const zsaPath = path.resolve('C:/Users/WZFS_ICT/OneDrive - Weihai Zhongshi Foreign School/WZFS - All Staff - Staff Resources/Marks Entry - Sub Teachers/Spring 2026/Final/ZSA_Spring2026_Master.xlsx');

function readMergedRows(filePath) {
  const wb = xlsx.readFile(filePath, { cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return parseWithMergedHeaders(ws);
}

function findDennis(students) {
  return students.filter(s => String(s.name||'').toLowerCase().includes('dennis') || String(s.nickName||'').toLowerCase().includes('dennis'));
}

function parseAwards() {
  const wb = xlsx.readFile(awardPath, { cellDates: true });
  let rows = [];
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    rows = rows.concat(parseWithMergedHeaders(ws));
  }
  return parseAwardsData(rows);
}

const awards = parseAwards();
console.log('Awards parse done. Dennis awards keys:');
for (const name of Object.keys(awards)) {
  if (String(name).toLowerCase().includes('dennis')) {
    console.log('  >', name, 'count', awards[name].length);
    console.log(JSON.stringify(awards[name], null, 2));
  }
}

for (const [label, filePath] of [['G7', g7Path], ['ZSA', zsaPath]]) {
  const rows = readMergedRows(filePath);
  const students = parseMarksData(rows, { grade: label });
  console.log(`\n${label} master students parsed: ${students.length}`);
  const dennis = findDennis(students);
  console.log(`${label} Dennis count: ${dennis.length}`);
  dennis.forEach((s, idx) => {
    console.log(`--- ${label} Dennis ${idx}`);
    console.log('name:', s.name, 'nickName:', s.nickName, 'grade:', s.grade, 'id:', s.id);
    console.log('subjectsI count:', s.subjectsI.length, 'subjectsII count:', s.subjectsII.length);
  });
  const merged = mergeStudentData(students, awards);
  const dennisMerged = findDennis(merged);
  dennisMerged.forEach((s, idx) => {
    console.log(`--- ${label} merged Dennis ${idx}`);
    console.log('name:', s.name, 'grade:', s.grade, 'certificates:', s.certificates.length, 'servicePoints:', s.servicePoints.length);
    console.log('certificates:', JSON.stringify(s.certificates, null, 2));
    console.log('servicePoints:', JSON.stringify(s.servicePoints, null, 2));
  });
}
