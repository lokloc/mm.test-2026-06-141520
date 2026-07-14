import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const input = await FileBlob.load("outputs/table_def_work/GPT_전달_테이블정의서_MM_전체_양식맞춤.xlsx");
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem("Sheet1");
const values = sheet.getUsedRange().values;

let blockCount = 0;
let fieldRows = 0;
let keyFilled = 0;
let checkFilled = 0;
let zedWithoutZdd = 0;
let dateBad = 0;
for (const row of values) {
  if (row[0] === "CBO 테이블 정의서") blockCount++;
  if (row[7] === "작성일" && row[8] !== "2026-07-02") dateBad++;
  if (typeof row[0] === "number" && row[1] && row[1] !== ".INCLUDE") {
    fieldRows++;
    if (row[3]) keyFilled++;
    if (row[9]) checkFilled++;
    const element = String(row[5] ?? "");
    const domain = String(row[6] ?? "");
    if (element.startsWith("ZED") && !domain.startsWith("ZDD")) zedWithoutZdd++;
  }
}

console.log(JSON.stringify({ blockCount, fieldRows, keyFilled, checkFilled, zedWithoutZdd, dateBad }));

