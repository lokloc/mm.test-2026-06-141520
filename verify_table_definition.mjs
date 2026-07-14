import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";
import fs from "node:fs/promises";

const input = await FileBlob.load("outputs/table_def_work/GPT_전달_테이블정의서_MM정리본.xlsx");
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem("MM");
const values = sheet.getRange("A1:K179").values;
let dataCheckFilled = 0;
let tableCount = 0;
let fieldRows = 0;
for (const row of values) {
  if (row[0] === "테이블") tableCount++;
  if (typeof row[0] === "number" && row[1]) {
    fieldRows++;
    if (row[9]) dataCheckFilled++;
  }
}
console.log(JSON.stringify({ tableCount, fieldRows, dataCheckFilled }));
console.log(JSON.stringify(values.slice(0, 18)));

const fullPreview = await workbook.render({
  sheetName: "MM",
  range: "A1:K179",
  scale: 1,
  format: "png",
});
await fs.writeFile("outputs/table_def_work/full_preview.png", new Uint8Array(await fullPreview.arrayBuffer()));

