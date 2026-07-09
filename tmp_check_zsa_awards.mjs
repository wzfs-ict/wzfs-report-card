import xlsx from 'xlsx';
import path from 'path';
import { parseWithMergedHeaders, parseMarksData, parseAwardsData, mergeStudentData } from './src/dataParser.js';

const zsaPath = path.resolve('C:/Users/WZFS_ICT/OneDrive - Weihai Zhongshi Foreign School/WZFS - All Staff - Staff Resources/Marks Entry - Sub Teachers/Spring 2026/Final/ZSA_Spring2026_Master.xlsx');
const awardsPath = path.resolve('C:/Users/WZFS_ICT/OneDrive - Weihai Zhongshi Foreign School/Upper School - General/Spring 2026 Awards.xlsx');

function readMergedRows(filePath) {
  const wb = xlsx.readFile(filePath, { cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return parseWithMergedHeaders(ws);
}

const zsaRows = readMergedRows(zsaPath);
const zsaStudents = parseMarksData(zsaRows, { grade: 'ZSA' });
console.log('ZSA students parsed:', zsaStudents.length);

const wbAwards = xlsx.readFile(awardsPath, { cellDates: true });
let allAwardRows = [];
for (const sheetName of wbAwards.SheetNames) {
  const ws = wbAwards.Sheets[sheetName];
  const rows = parseWithMergedHeaders(ws);
  allAwardRows = allAwardRows.concat(rows.map(r => ({ sheetName, row: r })));
}
console.log('Awards rows parsed from workbook:', allAwardRows.length);

const awardsData = parseAwardsData(allAwardRows.map(item => item.row));

function normName(s) {
  return String(s||'').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,'').replace(/\s+/g,' ').trim();
}

function countAwardRowsForStudent(student) {
  const keys = [normName(student.name)];
  if (student.nickName) keys.push(normName(student.nickName));
  if (student.name.includes('(')) {
    const m = student.name.match(/^(.*?)\s*\((.*?)\)\s*$/);
    if (m) {
      keys.push(normName(m[1]));
      keys.push(normName(m[2]));
    }
  }
  const uniq = Array.from(new Set(keys.filter(Boolean)));
  let total = 0;
  uniq.forEach(key => {
    const items = awardsData[key];
    if (items) total += items.length;
  });
  return { keys: uniq, total };
}

const merged = mergeStudentData(zsaStudents, awardsData);
for (const s of merged) {
  const awardCount = (s.certificates?.length || 0) + (s.servicePoints?.length || 0);
  console.log(`NAME=${s.name} | CALLED=${s.nickName || ''} | ID=${s.id || s.studentId || ''} | AWARDS=${awardCount}`);
  if (awardCount > 0) {
    console.log('  certs:', s.certificates.map(c => c.name).join(' | '));
    console.log('  service:', s.servicePoints.map(sp => sp.name + ':' + sp.points).join(' | '));
  }
}

console.log('\nChecking award rows with ZSA grade or ZSA name...');
const zsaGradeRows = allAwardRows.filter(({ row }) => {
  const values = Object.values(row).map(v => String(v || '').trim()).filter(Boolean).map(v => v.toLowerCase());
  return values.some(v => v === 'zsa');
});
console.log('Award rows with explicit ZSA grade/text:', zsaGradeRows.length);
zsaGradeRows.slice(0, 50).forEach((item, idx) => {
  const row = item.row;
  const rowStr = JSON.stringify(row);
  console.log(idx, item.sheetName, rowStr);
});

const zsaMatchCounts = {};
for (const item of allAwardRows) {
  const row = item.row;
  const name = normName(row.Name || row.name || row['Name of Student'] || row['Student Name'] || row['fullname'] || row['Full Name'] || '');
  if (!name) continue;
  const grade = normName(row.Grade || row.grade || row.Class || row.ClassName || row['YearGroup'] || '');
  if (grade === 'zsa') {
    zsaMatchCounts[name] = (zsaMatchCounts[name] || 0) + 1;
  }
}
console.log('\nExplicit ZSA award rows by normalized student name:');
Object.entries(zsaMatchCounts).forEach(([name,count]) => console.log(`${name}: ${count}`));
