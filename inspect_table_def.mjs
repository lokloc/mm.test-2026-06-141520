import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const input = await FileBlob.load("GPT_전달_테이블정의서.xlsx");
const workbook = await SpreadsheetFile.importXlsx(input);

const summary = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 8000,
  tableMaxRows: 12,
  tableMaxCols: 18,
  tableMaxCellChars: 120,
});
console.log(summary.ndjson);

const sheets = await workbook.inspect({ kind: "sheet", include: "id,name" });
console.log("SHEETS");
console.log(sheets.ndjson);

