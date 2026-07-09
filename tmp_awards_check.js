const XLSX = require('xlsx');
const { parseAwardsData } = require('./src/dataParser.js');
const path = 'C:/Users/WZFS_ICT/Downloads/Spring 2026 Awards.xlsx';
const wb = XLSX.readFile(path, {sheetStubs:true});
const summary = [];
for (const name of wb.SheetNames) {
  const sheet = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(sheet, {defval:'', blankrows:false});
  const awards = parseAwardsData(rows);
  summary.push({ sheet: name, rows: rows.length, awards: Object.keys(awards).length, firstNames: Object.keys(awards).slice(0,5) });
}
console.log(JSON.stringify(summary, null, 2));
