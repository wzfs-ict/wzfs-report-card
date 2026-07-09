import xlsx from 'xlsx';
import path from 'path';
import { parseWithMergedHeaders, parseMarksData, parseAttendanceData, mergeAttendanceData } from './src/dataParser.js';

const zsaPath = path.resolve('C:/Users/WZFS_ICT/OneDrive - Weihai Zhongshi Foreign School/WZFS - All Staff - Staff Resources/Marks Entry - Sub Teachers/Spring 2026/Final/ZSA_Spring2026_Master.xlsx');
const attendancePath = path.resolve('C:/Users/WZFS_ICT/OneDrive - Weihai Zhongshi Foreign School/WZFS - All Staff - Staff Resources/Marks Entry - Sub Teachers/Spring 2026/Final/AttendanceData(Spring2026).xlsx');

const zsaWb = xlsx.readFile(zsaPath, { cellDates: true });
const zsaWs = zsaWb.Sheets[zsaWb.SheetNames[0]];
const zsaRows = parseWithMergedHeaders(zsaWs);
const zsaStudents = parseMarksData(zsaRows, { grade: 'ZSA' });

const attWb = xlsx.readFile(attendancePath, { cellDates: true });
const attWs = attWb.Sheets[attWb.SheetNames[0]];
const attRows = xlsx.utils.sheet_to_json(attWs, { defval: '' });
const attMap = parseAttendanceData(attRows);

const merged = mergeAttendanceData(zsaStudents, attMap);
const withAtt = merged.filter(s => s.attendance && Object.values(s.attendance).some(v => v !== ''));
console.log('ZSA students:', zsaStudents.length);
console.log('With attendance after merge:', withAtt.length);
for (const s of merged) {
  const has = s.attendance && Object.values(s.attendance).some(v => v !== '');
  console.log(`${has ? 'YES' : 'NO'} | ${s.name} | ${s.nickName || ''} | ${s.id || ''} | grade=${s.grade}`);
}
