import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";
import fs from "node:fs/promises";

const input = await FileBlob.load("gpt_전달_양식.xlsx");
const workbook = await SpreadsheetFile.importXlsx(input);

const summary = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 10000,
  tableMaxRows: 30,
  tableMaxCols: 20,
  tableMaxCellChars: 120,
});
console.log(summary.ndjson);

const sheets = await workbook.inspect({ kind: "sheet", include: "id,name" });
console.log("SHEETS");
console.log(sheets.ndjson);

const sheetInfo = JSON.parse(`[${sheets.ndjson.trim().split(/\n/).join(",")}]`);
for (const sheet of sheetInfo) {
  const preview = await workbook.render({
    sheetName: sheet.name,
    autoCrop: "all",
    scale: 1,
    format: "png",
  });
  const safe = sheet.name.replace(/[\\/:*?"<>|]/g, "_");
  await fs.writeFile(`outputs/table_def_work/template_${safe}.png`, new Uint8Array(await preview.arrayBuffer()));
}

