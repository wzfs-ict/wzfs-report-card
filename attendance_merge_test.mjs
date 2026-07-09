import xlsx from 'xlsx';
import { parseAttendanceData, mergeAttendanceData, parseMarksData, parseWithMergedHeaders, canonicalName, canonicalFirstName } from './src/dataParser.js';
import path from 'path';

const attendanceFile = path.resolve('C:/Users/WZFS_ICT/OneDrive - Weihai Zhongshi Foreign School/WZFS - All Staff - Staff Resources/Marks Entry - Sub Teachers/Spring 2026/Final/AttendanceData(Spring2026).xlsx');
const masterFile = path.resolve('C:/Users/WZFS_ICT/OneDrive - Weihai Zhongshi Foreign School/WZFS - All Staff - Staff Resources/Marks Entry - Sub Teachers/Spring 2026/Final/G6_Spring2026_Master.xlsx');

function loadSheetRows(filePath) {

  const wb = xlsx.readFile(filePath, { cellDates: true });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(ws, { defval: '' });
}

console.log('Loading attendance rows...');
const attendanceRows = loadSheetRows(attendanceFile);
const attendanceMap = parseAttendanceData(attendanceRows);
console.log('Parsed', attendanceRows.length, 'attendance rows.');
console.log('ID rows:', attendanceMap.byId.size, 'Name keys:', attendanceMap.byName.size);

console.log('Loading master student rows...');
const wb = xlsx.readFile(masterFile, { cellDates: true });
const masterSheet = wb.Sheets[wb.SheetNames[0]];
const masterRows = parseWithMergedHeaders(masterSheet);
const students = parseMarksData(masterRows, { grade: '6' });
console.log('Parsed', students.length, 'student records.');

const merged = mergeAttendanceData(students, attendanceMap);
const withAttendance = merged.filter(s => s.attendance && Object.values(s.attendance).some(v => v !== ''));
console.log('Students with merged attendance:', withAttendance.length);

for (const s of withAttendance) {
  console.log(`- ${s.name} | grade=${s.grade} | attendance=${JSON.stringify(s.attendance)}`);
}

const noAttendance = merged.filter(s => !s.attendance || !Object.values(s.attendance).some(v => v !== ''));
console.log('Students without attendance after merge:', noAttendance.length);
for (const s of noAttendance.slice(0, 20)) {
  console.log(`  * ${s.name} | grade=${s.grade}`);
}
