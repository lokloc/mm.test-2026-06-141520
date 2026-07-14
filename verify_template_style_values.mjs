import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const input = await FileBlob.load("outputs/table_def_work/GPT_전달_테이블정의서_MM_양식맞춤.xlsx");
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem("Sheet1");
const used = sheet.getUsedRange();
const values = used.values;
let blockCount = 0;
let fieldRows = 0;
let dataCheckFilled = 0;
let zedWithoutZdd = 0;
let dateBad = 0;
for (const row of values) {
  if (row[0] === "CBO 테이블 정의서") blockCount++;
  if (row[7] === "작성일" && row[8] !== "2026-07-02") dateBad++;
  if (typeof row[0] === "number" && row[1] && row[1] !== ".INCLUDE") {
    fieldRows++;
    if (row[9]) dataCheckFilled++;
    if (String(row[5] ?? "").startsWith("ZED") && !String(row[6] ?? "").startsWith("ZDD") && !["XUBNAME", "DATS", "TIMS"].includes(String(row[6] ?? ""))) {
      zedWithoutZdd++;
    }
  }
}
console.log(JSON.stringify({ blockCount, fieldRows, dataCheckFilled, zedWithoutZdd, dateBad }));

