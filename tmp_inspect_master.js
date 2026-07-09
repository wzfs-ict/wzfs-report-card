import xlsx from 'xlsx';
import path from 'path';
import { parseMarksData } from './src/dataParser.js';

const masterFile = path.resolve('C:/Users/WZFS_ICT/OneDrive - Weihai Zhongshi Foreign School/WZFS - All Staff - Staff Resources/Marks Entry - Sub Teachers/Spring 2026/Final/G6_Spring2026_Master.xlsx');
const wb = xlsx.readFile(masterFile, { cellDates: true });
const ws = wb.Sheets[wb.SheetNames[0]];

function parseWithMergedHeaders(sheet) {
  const raw = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false });
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
    return xlsx.utils.sheet_to_json(sheet, { defval: '', range: headerRow });
  }

  const groupRow = raw[subRowIdx - 1] || [];
  const subRow = raw[subRowIdx] || [];
  const compoundHeaders = [];
  let lastGroup = '';
  for (let c = 0; c < subRow.length; c++) {
    const subLabel = String(subRow[c] || '').trim();
    const groupLabel = String(groupRow[c] || '').trim();
    if (groupLabel) lastGroup = groupLabel;
    if (subPatterns.test(subLabel)) {
      const normalized = /behavior/i.test(subLabel) ? 'Behaviour' : subLabel;
      compoundHeaders.push(`${lastGroup}_${normalized}`);
    } else {
      compoundHeaders.push(subLabel || `Col${c}`);
    }
  }
  const dataRows = raw.slice(subRowIdx + 1);
  return dataRows
    .filter(row => row.some(cell => String(cell).trim() !== ''))
    .map(row => {
      const obj = {};
      compoundHeaders.forEach((h, i) => { obj[h] = row[i] !== undefined ? row[i] : ''; });
      return obj;
    });
}

const parsed = parseWithMergedHeaders(ws);
console.log('Parsed rows with merged headers:', parsed.length);
console.log('Sample row keys:', Object.keys(parsed[0] || {}).slice(0, 40));
console.log('Sample row 0:', JSON.stringify(parsed[0], null, 2));

const students = parseMarksData(parsed, { grade: '6' });
console.log('parseMarksData returned', students.length, 'students');
console.log('First student sample:', JSON.stringify(students[0], null, 2));
