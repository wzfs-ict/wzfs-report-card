# WZFS Report Card Generator

A React + Vite web app for generating printable WZFS report cards from CSV/Excel files.

## Deploy to Vercel

1. Push this repo to GitHub (wzfs-ict/wzfs-report-card)
2. Import to Vercel → select **Vite** as framework preset
3. Build command: `npm run build` | Output: `dist`

## Local Dev

```bash
npm install
npm run dev
```

## File Formats

### Marks File (CSV or Excel) — one row per subject per student
| Column | Example |
|---|---|
| StudentID | G7-001 |
| StudentName | JUNWOO PARK |
| NickName | Joseph |
| DOB | 08/01/2011 |
| Grade | G7 |
| Advisor | Mr. Glen Joshua |
| Department | Middle School |
| GradingPeriod | Spring Semester |
| SubjectType | I (Academic) or II (Extracurricular) |
| SubjectName | Maths |
| Score | 59 |
| Behaviour | 1 |
| TotalDays | 89 |
| DaysPresent | 84 |
| AuthAbsences | 5 |
| UnauthAbsences | 0 |
| DaysTardy | 0 |
| TeacherComments | Joseph is a focused student... |

### Awards File (CSV or Excel) — one row per award per student
| Column | Example |
|---|---|
| StudentID | G7-001 |
| StudentName | JUNWOO PARK |
| AwardType | Certificate / Honour / Service |
| AwardName | High Honour Roll |
| Points | 10 |
| Date | 2026-01 |

## Usage
1. Upload the marks file
2. Upload the awards file (optional)
3. Click Generate Report Cards
4. Browse students using the top nav
5. Click Print / Save as PDF → browser prints each student as 2 A4 pages
