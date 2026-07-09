import xlsx from 'xlsx';
import path from 'path';
import { parseWithMergedHeaders, parseAwardsData } from './src/dataParser.js';

const awardsPath = path.resolve('C:/Users/WZFS_ICT/OneDrive - Weihai Zhongshi Foreign School/Upper School - General/Spring 2026 Awards.xlsx');
const wb = xlsx.readFile(awardsPath, { cellDates: true });
console.log('Awards workbook sheets:', wb.SheetNames);

for (const sheetName of wb.SheetNames) {
  const ws = wb.Sheets[sheetName];
  const rows = parseWithMergedHeaders(ws);
  const dennisRows = rows.filter(row => {
    const name = String(row.Name || row.name || row['Name of Student'] || row['Student Name'] || '').toLowerCase();
    return name.includes('dennis');
  });
  if (dennisRows.length === 0) continue;
  console.log('--- Sheet:', sheetName, 'Dennis rows:', dennisRows.length);
  dennisRows.forEach((row, idx) => {
    console.log(idx, JSON.stringify(row));
  });
}

const allRows = [];
for (const sheetName of wb.SheetNames) {
  const ws = wb.Sheets[sheetName];
  const rows = parseWithMergedHeaders(ws);
  allRows.push(...rows.map((r) => ({ sheet: sheetName, row: r })));
}
const awardMap = parseAwardsData(allRows.map(r => r.row));
console.log('Awards map entries for Dennis:');
for (const [name, awards] of Object.entries(awardMap)) {
  if (name.toLowerCase().includes('dennis')) {
    console.log('name:', JSON.stringify(name), 'count:', awards.length);
    awards.forEach((a, i) => console.log('  ', i, JSON.stringify(a)));
  }
}
