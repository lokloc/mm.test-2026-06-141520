import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const input = await FileBlob.load("outputs/table_def_work/GPT_전달_테이블정의서_MM정리본.xlsx");
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem("MM");
const values = sheet.getRange("A1:K179").values;
let tableCount = 0;
let fieldRows = 0;
let dataCheckFilled = 0;
let zedWithoutZdd = 0;
for (const row of values) {
  if (row[0] === "테이블") tableCount++;
  if (typeof row[0] === "number" && row[1]) {
    fieldRows++;
    if (row[9]) dataCheckFilled++;
    if (String(row[5] ?? "").startsWith("ZED") && !String(row[6] ?? "").startsWith("ZDD") && !["XUBNAME", "DATS", "TIMS"].includes(String(row[6] ?? ""))) {
      zedWithoutZdd++;
    }
  }
}
console.log(JSON.stringify({ tableCount, fieldRows, dataCheckFilled, zedWithoutZdd }));

