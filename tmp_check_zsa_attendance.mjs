import xlsx from 'xlsx';
import path from 'path';
import { parseWithMergedHeaders, parseMarksData, parseAttendanceData } from './src/dataParser.js';

const zsaPath = path.resolve('C:/Users/WZFS_ICT/OneDrive - Weihai Zhongshi Foreign School/WZFS - All Staff - Staff Resources/Marks Entry - Sub Teachers/Spring 2026/Final/ZSA_Spring2026_Master.xlsx');
const attendancePath = path.resolve('C:/Users/WZFS_ICT/OneDrive - Weihai Zhongshi Foreign School/WZFS - All Staff - Staff Resources/Marks Entry - Sub Teachers/Spring 2026/Final/AttendanceData(Spring2026).xlsx');

function normalizeKey(s) {
  return String(s||'').toLowerCase().replace(/[\s_-]/g,'').trim();
}

function nameVariants(student) {
  const full = String(student.name||'').trim();
  const called = String(student.nickName||student.calledName||'').trim();
  const variants = new Set();
  if (full) variants.add(full.toLowerCase());
  if (called) variants.add(called.toLowerCase());
  const first = full.split(/\s+/)[0];
  if (first) variants.add(first.toLowerCase());
  if (called) {
    const firstc = called.split(/\s+/)[0];
    if (firstc) variants.add(firstc.toLowerCase());
  }
  return [...variants];
}

const attWb = xlsx.readFile(attendancePath, { cellDates: true });
const attWs = attWb.Sheets[attWb.SheetNames[0]];
const attRows = xlsx.utils.sheet_to_json(attWs, { defval: '' });
const attMap = parseAttendanceData(attRows);
const zsaWb = xlsx.readFile(zsaPath, { cellDates: true });
const zsaWs = zsaWb.Sheets[zsaWb.SheetNames[0]];
const zsaRows = parseWithMergedHeaders(zsaWs);
const zsaStudents = parseMarksData(zsaRows, { grade: 'ZSA' });

console.log('ZSA students parsed:', zsaStudents.length);
console.log('Attendance rows total:', attRows.length);
console.log('Attendance byId count:', attMap.byId.size, 'byName count:', attMap.byName.size);

function findByNameKeys(keys) {
  const hits = [];
  for (const key of keys) {
    const lookup = key.toLowerCase().replace(/[\s_-]/g,'');
    if (attMap.byName.has(lookup)) hits.push({ key, match: attMap.byName.get(lookup) });
  }
  return hits;
}

for (const student of zsaStudents) {
  const idRaw = String(student.id||student.studentId||'').replace(/\s/g,'').toUpperCase();
  const idHit = idRaw ? attMap.byId.get(idRaw) : null;
  const keys = nameVariants(student);
  const nameHits = keys.map(key => ({ key, hit: attMap.byName.get(key.replace(/[\s_-]/g,'')) })).filter(x => x.hit);
  const hasAtt = student.attendance && Object.values(student.attendance).some(v => v !== '');
  console.log('---');
  console.log(`student: ${student.name} | called: ${student.nickName || ''} | id: ${student.id || student.studentId || ''} | grade: ${student.grade}`);
  console.log(`  parsed attendance present on student object?: ${hasAtt}`);
  console.log(`  id normalized: ${idRaw}`);
  console.log(`  id match: ${idHit ? 'yes' : 'no'}`);
  console.log(`  name variants: ${keys.join(' | ')}`);
  if (nameHits.length) {
    for (const hit of nameHits) {
      console.log(`  name key match: ${hit.key} => rows: ${hit.hit.length}`);
    }
  } else {
    console.log('  name key match: none');
  }
}

const unmatchedAttendance = attRows.filter(row => {
  const rowGrade = String(row.grade || row.Class || row.ClassName || row['Grade'] || row['grade'] || '').toUpperCase().replace(/\s/g,'');
  return rowGrade === 'ZSA';
}).map((row, idx) => ({ idx, row }));
console.log('\nAttendance rows with grade ZSA:', unmatchedAttendance.length);
for (const item of unmatchedAttendance.slice(0, 20)) {
  const row = item.row;
  const rowName = String(row.fullname || row.name || row.studentname || row.calledname || row.nickname || '');
  const rowId = String(row.studentid || row.id || '');
  console.log(`  [${item.idx}] ${rowName} | id=${rowId} | grade=${String(row.grade || row.Class || row['Grade'] || '')}`);
}
